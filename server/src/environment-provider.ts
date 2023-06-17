import { Environment, buildEnvironment } from 'wollok-ts'
import { wollokURI } from './utils/wollok'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Connection, WorkDoneProgress } from 'vscode-languageserver'

type EnvironmentSubscription = (environment: Environment) => any
export class EnvironmentProvider {
  environment: Environment | null = null
  private subscriptions: EnvironmentSubscription[] = []

  constructor(private connection: Connection) { }

  withLatestEnvironment(cb: EnvironmentSubscription): void {
    if(this.environment){
      cb(this.environment)
    } else {
      this.subscriptions.push(cb)
    }
  }

  rebuildTextDocument(document: TextDocument): void {
    this.notifyBuild(() => {
      const uri = wollokURI(document.uri)
      const content = document.getText()
      const file: { name: string, content: string } = {
        name: uri,
        content: content,
      }
      return buildEnvironment([file], this.environment || undefined)
    })
  }

  resetEnvironment(): void {
    this.notifyBuild(() => buildEnvironment([]))
  }

  private notifyBuild(build: () => Environment): void {
    this.connection.sendProgress(WorkDoneProgress.type, 'wollok-build', { kind: 'begin', title: 'Wollok Building...' })
    this.environment = build()
    this.notify()
    this.connection.sendProgress(WorkDoneProgress.type, 'wollok-build', { kind: 'end' })
  }

  private notify(): void {
    this.subscriptions.forEach(subscription => subscription(this.environment!))
    this.subscriptions = []
  }
}