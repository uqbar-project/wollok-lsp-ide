import { Connection, WorkDoneProgress, WorkDoneProgressBegin, WorkDoneProgressEnd, WorkDoneProgressReport } from 'vscode-languageserver'

/**
 * This class is a wrapper around the connection object that allows sending progress reports to the client.
 */
export class ProgressReporter {
  constructor(private connection: Connection, private process: { identifier: string, title: string }){}

  begin(): Promise<void>{
    return this.sendProgress({ kind: 'begin', title: this.process.title })
  }

  progress(percentage?: number): Promise<void>{
    return this.sendProgress({ kind: 'report', percentage })
  }

  end(message?: string): Promise<void>{
    return this.sendProgress({ kind: 'end', message })
  }

  sendProgress(payload: WorkDoneProgressBegin | WorkDoneProgressReport | WorkDoneProgressEnd): Promise<void> {
    return this.connection.sendProgress(WorkDoneProgress.type, this.process.identifier, payload)
  }
}