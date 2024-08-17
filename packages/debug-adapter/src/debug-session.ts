import { LoggingDebugSession } from '@vscode/debugadapter'
import { DebugProtocol } from '@vscode/debugprotocol'
import { buildEnvironment, Evaluation, Interpreter, WRE } from 'wollok-ts'
import * as fs from 'fs'
export class WollokDebugSession extends LoggingDebugSession {
  private interpreter: Interpreter
  constructor(){
    super('debug.txt')
  }

  protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void {
    console.log(`[INITIALIZE REQUEST]`, args)
    response.body.supportsBreakpointLocationsRequest = true
    this.sendResponse(response)
  }

  protected launchRequest(response: DebugProtocol.LaunchResponse, args: DebugProtocol.LaunchRequestArguments, request?: DebugProtocol.Request): void {
    console.log(`[LAUNCH REQUEST]`, request, args)
    // ToDo: get files from args
    const environment = buildEnvironment([{ name: 'pepita', content: fs.readFileSync((args as any).program, 'utf8') + '/pepita.wlk' }])
    const evaluation = Evaluation.build(environment, WRE)
    this.interpreter = new Interpreter(evaluation)
    response.success = true
    this.sendResponse(response)
  }

  protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments, request?: DebugProtocol.Request): void {
    console.log(`[SET BREAKPOINTS REQUEST]`, request, args)
    response.body = {
      breakpoints: [
        { verified: true, line: 1 },
      ],
    }
    this.sendResponse(response)
  }

  protected breakpointLocationsRequest(response: DebugProtocol.BreakpointLocationsResponse, args: DebugProtocol.BreakpointLocationsArguments, request?: DebugProtocol.Request): void {
    console.log(`[BREAKPOINT LOCATIONS REQUEST]`, request, args)
    response.body = {
      breakpoints: [
        { line: 1 },
      ],
    }
    this.sendResponse(response)
  }

}