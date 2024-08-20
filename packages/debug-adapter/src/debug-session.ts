import { DebugSession, InitializedEvent, StoppedEvent, Thread } from '@vscode/debugadapter'
import { DebugProtocol } from '@vscode/debugprotocol'
import * as vscode from 'vscode'
import { ExtensionContext } from 'vscode'
import { buildEnvironment, DirectedInterpreter, Environment, ExecutionDirector, executionFor, FileContent, is, Program, PROGRAM_FILE_EXTENSION, RuntimeObject, TEST_FILE_EXTENSION, WOLLOK_FILE_EXTENSION } from 'wollok-ts'
export class WollokDebugSession extends DebugSession {
  private interpreter: DirectedInterpreter
  private environment: Environment
  private executionDirector: ExecutionDirector<unknown>
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


  protected continue(): void {
    const state = this.executionDirector.resume()
    const stoppedReason = state.done ? (state.error ? 'exception' : 'done') : 'breakpoint'
    this.sendEvent(new StoppedEvent(stoppedReason, 1))
  }

  protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments, request?: DebugProtocol.Request): void {
    this.continue()
    this.sendResponse(response)
  }


  protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments, request?: DebugProtocol.Request): void {
    response.body = { stackFrames: [
      {
        id: 1,
        name:     this.interpreter.evaluation.currentNode.kind,
        line:     this.interpreter.evaluation.currentNode.sourceMap.start.line,
        column:   this.interpreter.evaluation.currentNode.sourceMap.start.column,
      },
    ] }
    this.sendResponse(response)
  }

  protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments, request?: DebugProtocol.Request): void {
    response.body = {
      scopes: [
        {
          name: 'program',
          variablesReference: 1,
          expensive: false,
        },
      ],
    }
    this.sendResponse(response)
  }

  protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments, request?: DebugProtocol.Request): void {
    response.body = {
      variables: [
        {
          name: 'pepita',
          value: 'Pepita',
          variablesReference: 1,
        },
        {
          name: 'manolo',
          value: 'manolo',
          variablesReference: 1,
        },
      ],
    }
    this.sendResponse(response)
  }
}