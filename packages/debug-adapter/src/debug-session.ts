import { DebugSession, InitializedEvent, StoppedEvent, TerminatedEvent, Thread } from '@vscode/debugadapter'
import { DebugProtocol } from '@vscode/debugprotocol'
import * as vscode from 'vscode'
import { ExtensionContext } from 'vscode'
import { buildEnvironment, DirectedInterpreter, Environment, ExecutionDirector, executionFor, ExecutionState, FileContent, is, Node, Program, PROGRAM_FILE_EXTENSION, RuntimeObject, TEST_FILE_EXTENSION, WOLLOK_FILE_EXTENSION } from 'wollok-ts'
export class WollokDebugSession extends DebugSession {
  private interpreter: DirectedInterpreter
  private environment: Environment
  private executionDirector: ExecutionDirector<unknown>
  private stoppedNode: Node
  constructor(private context: ExtensionContext, private workspace: typeof vscode.workspace){
    super()
  }

  handleMessage(msg: DebugProtocol.ProtocolMessage): void {
    console.log(`[${(msg as any).command || msg.type}]`, msg)
    super.handleMessage(msg)
  }

  sendResponse(response: DebugProtocol.Response): void {
    console.log(`[response]`, response)
    super.sendResponse(response)
  }

  protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments, request?: DebugProtocol.Request): void {
    this.sendResponse(response)
  }

  protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void {

    // build and return the capabilities of this debug adapter:
		response.body = response.body || {}

    // response.body.supportsBreakpointLocationsRequest = true
    response.body.supportsDelayedStackTraceLoading = true
    // response.body.supportsConfigurationDoneRequest = true
    response.body.supportsSingleThreadExecutionRequests = false

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

  protected attachRequest(response: DebugProtocol.AttachResponse, args: DebugProtocol.AttachRequestArguments, request?: DebugProtocol.Request): void {
    this.launchRequest(response, args, request)
  }

  protected launchRequest(response: DebugProtocol.LaunchResponse, args: DebugProtocol.LaunchRequestArguments, request?: DebugProtocol.Request): void {


    // ToDo get test/program from args[program]
    const program = this.environment.descendants.find<Program>(is(Program))!
    this.executionDirector = this.interpreter.exec(
      program
    )
    this.sendResponse(response)
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {

    // runtime supports no threads so just return a default thread.
    response.body = {
      threads: [
        new Thread(1, "Wollok Main Thread"),
      ],
    }
    this.sendResponse(response)
  }


  protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments, request?: DebugProtocol.Request): void {

    const sentence = this.environment.descendants.find<Program>(is(Program))!.sentences()[1]
    this.executionDirector.addBreakpoint(sentence)

    response.body = {
      breakpoints: [
        { verified: true,
          line: sentence.sourceMap.start.line,
          column: sentence.sourceMap.start.column,
          instructionReference: 'holaaa',
        },
      ],
    }
    this.sendResponse(response)
    this.continue()
  }

  protected setExceptionBreakPointsRequest(response: DebugProtocol.SetExceptionBreakpointsResponse, args: DebugProtocol.SetExceptionBreakpointsArguments, request?: DebugProtocol.Request): void {

    this.sendResponse(response)
  }

  protected breakpointLocationsRequest(response: DebugProtocol.BreakpointLocationsResponse, args: DebugProtocol.BreakpointLocationsArguments, request?: DebugProtocol.Request): void {

    response.body = {
      breakpoints: [
        { line: 1, column: 1 },
      ],
    }

    this.sendResponse(response)
  }

  protected moveExecution(action: () => ExecutionState<unknown>): void{
    const state = action()
    const stoppedReason = state.done ? state.error ? 'exception' : 'done' : 'breakpoint'
    if(!state.done && 'next' in state) {
      this.stoppedNode = state.next
      this.sendEvent(new StoppedEvent(stoppedReason, 1))
    } else {
      this.sendEvent(new TerminatedEvent())
    }
  }

  protected continue(): void {
    this.moveExecution(() => this.executionDirector.resume())
  }

  protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments, request?: DebugProtocol.Request): void {
    this.continue()
    this.sendResponse(response)
  }

  protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments, request?: DebugProtocol.Request): void {
    this.moveExecution(() => this.executionDirector.stepThrough())
    this.sendResponse(response)
  }

  protected stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments, request?: DebugProtocol.Request): void {
    this.moveExecution(() => this.executionDirector.stepIn())
    this.sendResponse(response)
  }

  protected stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments, request?: DebugProtocol.Request): void {
    this.moveExecution(() => this.executionDirector.stepOut())
    this.sendResponse(response)
  }


  protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments, request?: DebugProtocol.Request): void {
    response.body = { stackFrames: [
      {
        id: 1,
        name:     this.stoppedNode.label,
        line:     this.stoppedNode.sourceMap?.start.line,
        column:   this.stoppedNode.sourceMap?.start.column,
        endColumn: this.stoppedNode.sourceMap?.end.column,
        endLine:   this.stoppedNode.sourceMap?.end.line,
        source: {
          name: this.interpreter.evaluation.frameStack[1].node.sourceFileName,
          path: this.interpreter.evaluation.frameStack[1].node.sourceFileName,
        },
      },
    ] }
    this.sendResponse(response)
  }

  protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments, request?: DebugProtocol.Request): void {
    response.body = {
      scopes: [
        {
          name: this.interpreter.evaluation.currentNode.label,
          variablesReference: 1,
          expensive: false,
        },
      ],
    }
    this.sendResponse(response)
  }

  protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments, request?: DebugProtocol.Request): void {
    const variables: DebugProtocol.VariablesResponse['body']['variables'] = []

    this.interpreter.evaluation.currentFrame.locals.forEach((_, name) => {
      const value = this.interpreter.evaluation.currentFrame.get(name)

      variables.push({
        name,
        value: value.innerNumber.toString(),
        variablesReference: 0,
      })
    })

    response.body = {
      variables,
    }
    this.sendResponse(response)
  }
}