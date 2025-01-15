import { DebugSession, InitializedEvent, OutputEvent, Source, StackFrame, StoppedEvent, TerminatedEvent, Thread, Variable } from '@vscode/debugadapter'
import { DebugProtocol } from '@vscode/debugprotocol'
import * as vscode from 'vscode'
import { Body, BOOLEAN_MODULE, buildEnvironment, Context, DirectedInterpreter, ExecutionDirector, executionFor, ExecutionState, FileContent, Frame, interprete, LIST_MODULE, Node, NUMBER_MODULE, Package, PROGRAM_FILE_EXTENSION, RuntimeObject, RuntimeValue, Sentence, STRING_MODULE, TEST_FILE_EXTENSION, WOLLOK_FILE_EXTENSION, Interpreter } from 'wollok-ts'
import { LaunchTargetArguments, Target, targetFinder } from './target-finders'
import { toClientPath, toWollokPath } from './utils/path-converters'
import { WollokPositionConverter } from './utils/wollok-position-converter'
export class WollokDebugSession extends DebugSession {
  protected static readonly THREAD_ID = 1

  protected interpreter: DirectedInterpreter
  protected executionDirector: ExecutionDirector<unknown>
  protected frames: WollokIdMap<Frame> = new WollokIdMap()
  protected contexts: WollokIdMap<Context> = new WollokIdMap()
  protected stoppedNode: Node

  protected configurationDone: Promise<void>
  protected notifyConfigurationDone: () => void

  protected positionConverter: WollokPositionConverter

  constructor(protected workspace: typeof vscode.workspace){
    super()
    this.configurationDone = new Promise<void>(resolve => {
      this.notifyConfigurationDone = resolve
    })
  }

  protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, _args: DebugProtocol.ConfigurationDoneArguments, _request?: DebugProtocol.Request): void {
    this.sendResponse(response)
    this.notifyConfigurationDone()
  }

  protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void {
    // capabilities
    response.body = {
      ...response.body,
      supportsBreakpointLocationsRequest: true,
      supportsDelayedStackTraceLoading: true,
      supportsConfigurationDoneRequest: true,
      supportsSingleThreadExecutionRequests: false,
    }

    this.positionConverter = new WollokPositionConverter(args.linesStartAt1, args.columnsStartAt1)

    // initialize wollok interpreter
    const debuggableFileExtensions = [WOLLOK_FILE_EXTENSION, PROGRAM_FILE_EXTENSION, TEST_FILE_EXTENSION]
    this.workspace.findFiles(`**/*.{${debuggableFileExtensions.join(',')}}`).then(async files => {
      const wollokPackages = await Promise.all(files.map(file =>

        new Promise<FileContent>(resolve => this.workspace.openTextDocument(file).then(textDocument => {
          resolve({ name: toWollokPath(textDocument.uri.fsPath), content: textDocument.getText() })
        }))
      ))

      const environment = buildEnvironment(wollokPackages, undefined)
      this.interpreter = executionFor(environment)
      this.sendResponse(response)
      this.sendEvent(new InitializedEvent())
    })
  }

  protected launchRequest(response: DebugProtocol.LaunchResponse, args: WollokLaunchArguments, _request?: DebugProtocol.Request): void {
    let container: Target

    try  {
      container = targetFinder(args.target).findTarget(this.interpreter.evaluation.environment)
    } catch(_error) {
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
          args.stopOnEntry ? node => (container as any).body.sentences[0]?.id === node.id : undefined
        )
      }, args.stopOnEntry ? 'entry' : undefined)
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
    const breakpointsPackage = this.packageFromSource(args.source as Source)

    const breakpointsToRemove = []
    this.executionDirector.breakpoints.forEach(breakpointedNode => {
      if(breakpointedNode.parentPackage.id === breakpointsPackage.id) {
        breakpointsToRemove.push(breakpointedNode)
      }
    })
    breakpointsToRemove.forEach(breapointedNode => this.executionDirector.removeBreakpoint(breapointedNode))

    if(breakpointsPackage) {
      const nodesToBreakAt = breakpointsPackage.descendants.filter((node: Node) => {
        return args.breakpoints.some(breakpoint =>
          breakpoint.column ?
            this.positionConverter.convertDebuggerLineToClient(node.sourceMap?.start.line) === breakpoint.line && this.positionConverter.convertDebuggerColumnToClient(node.sourceMap?.start.column) === breakpoint.column :
            node.is(Sentence) && node.parent.is(Body) && this.positionConverter.convertDebuggerLineToClient(node.sourceMap?.start.line) === breakpoint.line
        )
      })
      nodesToBreakAt.forEach(node => {
        this.executionDirector.addBreakpoint(node)
      })

      response.body = {
        breakpoints: nodesToBreakAt.map(node => ({
            verified: true,
            ...this.positionConverter.convertSourceMapToClient(node.sourceMap),
            source: this.sourceFromNode(node),
          })
        ),

      }
    }
    this.sendResponse(response)
  }


  protected moveExecution(action: () => ExecutionState<unknown>, overrideStoppedReason?: string): void{
    const state = action()

    // Reset stack state when moving execution
    this.frames.clear()
    this.contexts.clear()

    const stoppedReason = overrideStoppedReason || (state.done ? state.error ? 'exception' : 'done' : 'breakpoint')
    if(!state.done && 'next' in state) {
      this.stoppedNode = state.next
      if(this.stoppedNode.isSynthetic) {
        return this.moveExecution(() => this.executionDirector.stepOver(), overrideStoppedReason)
      }
      this.sendEvent(new StoppedEvent(stoppedReason, WollokDebugSession.THREAD_ID))
    } else {
      if(state.error) {
        this.sendEvent(new OutputEvent(state.error.message, 'stderr'))
      } else {
          this.sendEvent(new OutputEvent('Finished executing without errors', 'stdout'))
      }
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
      ...currentNode.sourceMap && this.positionConverter.convertSourceMapToClient(currentNode.sourceMap),
      source: !!currentNode.sourceFileName && this.sourceFromNode(currentNode),
    }
  }

  protected breakpointLocationsRequest(response: DebugProtocol.BreakpointLocationsResponse, args: DebugProtocol.BreakpointLocationsArguments, _request?: DebugProtocol.Request): void {
    const pkg = this.packageFromSource(args.source as Source)
    const breakpoints = pkg.descendants.filter(node => {
      if(!node.sourceMap) return false
      const nodeLocation = this.positionConverter.convertSourceMapToClient(node.sourceMap!)
      return args.endLine ?
        nodeLocation.line >= args.line && nodeLocation.lineEnd <= args.endLine && nodeLocation.column >= args.column && nodeLocation.columnEnd <= args.endColumn :
        nodeLocation.line === args.line
    }).map(node => this.positionConverter.convertSourceMapToClient(node.sourceMap!))

    response.body = {
      breakpoints,
    }

    this.sendResponse(response)
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

  protected evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments, _request?: DebugProtocol.Request): void {
    const currentEvaluation = args.context === 'repl' ? this.interpreter.evaluation : this.interpreter.evaluation.copy()
    const frame = args.frameId ? this.frames.get(args.frameId) : currentEvaluation.currentFrame
    const execution = interprete(
      new Interpreter(currentEvaluation),
      args.expression,
      frame
    )

    response.body = {
      result: execution.result,
      variablesReference: 0,
    }

    this.sendResponse(response)
  }

  protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments, _request?: DebugProtocol.Request): void {
    const variables: DebugProtocol.VariablesResponse['body']['variables'] = []
    const context = this.contexts.get(args.variablesReference)

    context.locals.forEach((_, name) => {
      const value: RuntimeValue = context.get(name)

      if(name === 'self') {
        // should we show self?
        variables.push({
          name: '<self>',
          value: value.module.name ?? '',
          variablesReference: 0,
          evaluateName: name,
        })
      } else {
        variables.push(this.buildVariableFromRuntimeObject(name, value))
      }
    })

    // shoud 'innerCollection' be part of the Context interface?
    if(context instanceof RuntimeObject) {
      (context.innerCollection || []).forEach((value, i) => {
        variables.push(this.buildVariableFromRuntimeObject(
          i.toString(),
          value
        ))
      })
    }

    response.body = {
      variables,
    }
    this.sendResponse(response)
  }
  private buildVariableFromRuntimeObject(reference: string, object: RuntimeObject): Variable {
    return {
      name: reference,
      value: getLabel(object) ?? 'undefined',
      variablesReference: object.locals.size > 0 || object.innerCollection?.length > 0 ? this.contexts.getIdFor(object) : 0,
    }
  }

  private sourceFromNode<T extends Node>(node: T): Source {
    return new Source(node.sourceFileName.split('/').pop()!, toClientPath(node.sourceFileName))
  }

  private packageFromSource(source: Source): Package {
    const pkg = this.interpreter.evaluation.environment.descendants.find(node => node.is(Package) && toWollokPath(source.path) === node.sourceFileName) as Package | undefined
    if(!pkg) {
      throw new Error(`Could not find package for source ${source.path}`)
    }
    return pkg
  }
}


function getLabel(value: RuntimeObject): string {
  if(value.innerValue === null){
    return 'null'
  }
  switch(value.module.fullyQualifiedName) {
    case STRING_MODULE:
      return `"${value.innerString}"`
    case NUMBER_MODULE:
      return value.innerNumber.toString()
    case BOOLEAN_MODULE:
      return value.innerBoolean ? 'true' : 'false'
    case LIST_MODULE:
      return `[${value.innerCollection.map(elem => getLabel(elem)).join(', ')}]`
    default:
      return value.description
  }
}

interface WollokLaunchArguments extends DebugProtocol.LaunchRequestArguments {
  stopOnEntry?: boolean
  target: LaunchTargetArguments
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