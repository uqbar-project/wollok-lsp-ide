import { DebugSession, InitializedEvent, Source, StackFrame, StoppedEvent, TerminatedEvent, Thread } from '@vscode/debugadapter'
import { DebugProtocol } from '@vscode/debugprotocol'
import * as vscode from 'vscode'
import { ExtensionContext } from 'vscode'
import { Body, buildEnvironment, Context, DirectedInterpreter, Environment, ExecutionDirector, executionFor, ExecutionState, FileContent, Frame, is, Node, Package, Program, PROGRAM_FILE_EXTENSION, RuntimeObject, RuntimeValue, Sentence, Test, TEST_FILE_EXTENSION, WOLLOK_FILE_EXTENSION } from 'wollok-ts'
export class WollokDebugSession extends DebugSession {
  protected static readonly THREAD_ID = 1
  protected interpreter: DirectedInterpreter
  protected environment: Environment
  protected executionDirector: ExecutionDirector<unknown>
  protected frames: WollokIdMap<Frame> = new WollokIdMap()
  protected contexts: WollokIdMap<Context> = new WollokIdMap()
  protected stoppedNode: Node

  protected configurationDone: Promise<void>
  protected notifyConfigurationDone: () => void


  constructor(protected context: ExtensionContext, protected workspace: typeof vscode.workspace){
    super()
    this.configurationDone = new Promise<void>(resolve => {
      this.notifyConfigurationDone = resolve
    })
  }

  handleMessage(msg: DebugProtocol.ProtocolMessage): void {
    console.log(`[${(msg as any).command || msg.type}]`, msg) //ToDo: logger
    super.handleMessage(msg)
  }

  sendResponse(response: DebugProtocol.Response): void {
    console.log(`[response]`, response) //ToDo: logger
    super.sendResponse(response)
  }

  protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, _args: DebugProtocol.ConfigurationDoneArguments, _request?: DebugProtocol.Request): void {
    this.sendResponse(response)
    this.notifyConfigurationDone()
  }

  protected initializeRequest(response: DebugProtocol.InitializeResponse, _args: DebugProtocol.InitializeRequestArguments): void {
    // capabilities
    response.body = response.body || {}
    // ToDo: response.body.supportsBreakpointLocationsRequest = true
    response.body.supportsDelayedStackTraceLoading = true
    response.body.supportsConfigurationDoneRequest = true
    response.body.supportsSingleThreadExecutionRequests = false

    // initialize wollok interpreter
    const debuggableFileExtensions = [WOLLOK_FILE_EXTENSION, PROGRAM_FILE_EXTENSION, TEST_FILE_EXTENSION]
    this.workspace.findFiles(`**/*.{${debuggableFileExtensions.join(',')}}`).then(async files => {
      this.environment = buildEnvironment(
        await Promise.all(files.map(file =>
          new Promise<FileContent>(resolve => this.workspace.openTextDocument(file).then(textDocument => {
            resolve({ name: file.fsPath, content: textDocument.getText() })
          }))
        ))
      )
      this.interpreter = executionFor(this.environment)
      this.sendResponse(response)
      this.sendEvent(new InitializedEvent())
    })
  }

  protected launchRequest(response: DebugProtocol.LaunchResponse, args: WollokLaunchArguments, _request?: DebugProtocol.Request): void {
    const containerPackage = this.environment.descendants.filter<Package>(is(Package)).find(pkg => pkg.sourceFileName === args.file)

    if(!containerPackage){
      this.sendErrorResponse(response, 404, 'Could not find target file')
      return
    }

    const container: Test | Program | undefined = containerPackage.descendants.find<Test|Program>(function (node: Node): node is Test | Program {
      if('test' in args.target) {
        const isPossibleTargetTest = node.is(Test) && node.name === `"${args.target.test}"`
        if(args.target.describe) {
          // possible bug: recursive describes?
          return isPossibleTargetTest && node.parent.name === `"${args.target.describe}"`
        } else {
          return isPossibleTargetTest
        }
      } else {
        return node.is(Program) && node.name === args.target.program
      }
    })

    if(!container){
      this.sendErrorResponse(response, 404, 'Could not find target test or program')
      return
    }

    this.executionDirector = this.interpreter.exec(
      container
    )

    /**
     * Launch response must be sent
     * after configuration is done
     * see: https://github.com/Microsoft/vscode/issues/4902#issuecomment-368583522
     */
    this.configurationDone.then(() => {
      this.sendResponse(response)
      this.moveExecution(() => {
        return this.executionDirector.resume(
          args.stopOnEntry ? node => container.body.id === node.id : undefined
        )
      })
    })
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {

    // runtime supports no threads so just return a default thread.
    response.body = {
      threads: [
        new Thread(WollokDebugSession.THREAD_ID, "Wollok Main Thread"),
      ],
    }
    this.sendResponse(response)
  }


  protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments, _request?: DebugProtocol.Request): void {
    const breakpointsPackage = this.environment.descendants.find<Package>(function (node): node is Package {
      return node.is(Package) && node.sourceFileName === args.source.path
    })
    if(breakpointsPackage){
      const sentences = breakpointsPackage.descendants.filter<Sentence>(function (node): node is Sentence {
        return node.is(Sentence) && node.parent.is(Body) && args.breakpoints.map(breakpoint => breakpoint.line).includes(node.sourceMap?.start.line)
      })
      sentences.forEach(sentence => {
        this.executionDirector.addBreakpoint(sentence)
      })

      response.body = {
        breakpoints: sentences.map(sentence => ({
            verified: true,
            line: sentence.sourceMap.start.line,
            column: sentence.sourceMap.start.column,
            endColumn: sentence.sourceMap.end.column,
            endLine: sentence.sourceMap.end.line,
            source: new Source(sentence.sourceFileName.split('/').pop()!, sentence.sourceFileName),
          })
        ),

      }
    }
    this.sendResponse(response)
  }

  protected setExceptionBreakPointsRequest(response: DebugProtocol.SetExceptionBreakpointsResponse, _args: DebugProtocol.SetExceptionBreakpointsArguments, _request?: DebugProtocol.Request): void {
    this.sendResponse(response)
  }

  protected moveExecution(action: () => ExecutionState<unknown>): void{
    const state = action()
    // reset stack state when moving execution
    this.frames.clear()
    this.contexts.clear()
    const stoppedReason = state.done ? state.error ? 'exception' : 'done' : undefined
    if(!state.done && 'next' in state) {
      this.stoppedNode = state.next
      this.sendEvent(new StoppedEvent(stoppedReason, WollokDebugSession.THREAD_ID))
    } else {
      this.sendEvent(new TerminatedEvent())
    }
  }

  protected continue(): void {
    this.moveExecution(() => this.executionDirector.resume())
  }

  protected continueRequest(response: DebugProtocol.ContinueResponse, _args: DebugProtocol.ContinueArguments, _request?: DebugProtocol.Request): void {
    this.continue()
    this.sendResponse(response)
  }

  protected nextRequest(response: DebugProtocol.NextResponse, _args: DebugProtocol.NextArguments, _request?: DebugProtocol.Request): void {
    this.moveExecution(() => this.executionDirector.stepOver())
    this.sendResponse(response)
  }

  protected stepInRequest(response: DebugProtocol.StepInResponse, _args: DebugProtocol.StepInArguments, _request?: DebugProtocol.Request): void {
    this.moveExecution(() => this.executionDirector.stepIn())
    this.sendResponse(response)
  }

  protected stepOutRequest(response: DebugProtocol.StepOutResponse, _args: DebugProtocol.StepOutArguments, _request?: DebugProtocol.Request): void {
    this.moveExecution(() => this.executionDirector.stepOut())
    this.sendResponse(response)
  }

  protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments, _request?: DebugProtocol.Request): void {
    response.body = {
      stackFrames:
        this.interpreter.evaluation.frameStack
          .slice(args.startFrame || 0)
          .map((frame) => {
            const isCurrentFrame = frame.id === this.interpreter.evaluation.currentFrame.id
            return this.buildStackFrame(frame, isCurrentFrame ? this.stoppedNode : frame.currentNode)
        }).reverse(),
        totalFrames: this.interpreter.evaluation.frameStack.length,
      }
    this.sendResponse(response)
  }

  protected buildStackFrame(frame: Frame, currentNode: Node): StackFrame {
    return {
      id: this.frames.getIdFor(frame),
      name: frame.description,
      line: currentNode.sourceMap?.start.line,
      column: currentNode.sourceMap?.start.column,
      endColumn: currentNode.sourceMap?.end.column,
      endLine: currentNode.sourceMap?.end.line,
      source: !!currentNode.sourceFileName && new Source(
          currentNode.sourceFileName.split('/').pop()!,
          currentNode.sourceFileName,
      ),
    }
  }

  protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments, _request?: DebugProtocol.Request): void {
    const frame = this.frames.get(args.frameId)
    response.body = {
      scopes: frame.contextHierarchy().map(context => ({
          name: context.description,
          variablesReference: this.contexts.getIdFor(context),
          expensive: false,
          namedVariables: context.locals.size,
      })),
    }
    this.sendResponse(response)
  }

  protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments, _request?: DebugProtocol.Request): void {
    const variables: DebugProtocol.VariablesResponse['body']['variables'] = []
    const context = this.contexts.get(args.variablesReference)


    context.locals.forEach((_, name) => {
      // ToDo handle strings, booleans, objects, etc.
      const value: RuntimeValue = context.get(name)
      let valueText: string

      try {
        value.assertIsNumber()
        valueText = value.innerNumber.toString()
      } catch(e) {
        valueText = 'Not a number'
      }

      if(name === 'self') {
        variables.push({
          name,
          value: value.module.name ?? '',
          variablesReference: 0,
          evaluateName: name,
        })
      } else {
        variables.push({
          name,
          value: valueText,
          variablesReference: value.locals.size > 0 ? this.contexts.getIdFor(value) : 0,
          evaluateName: name,
        })
      }
    })

    response.body = {
      variables,
    }
    this.sendResponse(response)
  }
}

interface WollokLaunchArguments extends DebugProtocol.LaunchRequestArguments {
  stopOnEntry?: boolean
  file: string,
  target: {
    test: string,
    describe?: string
  } | { program: string }
}

class WollokIdMap<T extends { id: string }> extends Map<number, T> {
  getIdFor(elem: T): number {
    const id: number | undefined = Array.from(this.keys()).find(key => this.get(key).id === elem.id)
    if(id !== undefined) return id
    const newId = this.size + 1
    this.set(newId, elem)
    return newId
  }
}