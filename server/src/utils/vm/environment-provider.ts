import { Connection, LSPAny, ServerRequestHandler } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, buildEnvironment } from 'wollok-ts'
import { ProgressReporter } from '../progress-reporter'
import { wollokURI } from './wollok'

export type ClientConfigurations = {
  'formatter': {abbreviateAssignments: boolean}
  'cli-path': string
  'language': "Spanish"|"English"|"Based on Local Environment",
  'maxNumberOfProblems': number
  'trace': {server: "off" |  "messages" | "verbose"}
  'openDynamicDiagramOnRepl': boolean
  'openInternalDynamicDiagram': boolean
  'dynamicDiagramDarkMode': boolean
}

type EnvironmentSubscription = (environment: Environment) => any
export class EnvironmentProvider {
  environment: Environment | null = null
  private subscriptions: EnvironmentSubscription[] = []
  private buildProgressReporter: ProgressReporter
  private requestProgressReporter: ProgressReporter
  private configs!: ClientConfigurations

  constructor(connection: Connection) {
    this.buildProgressReporter = new ProgressReporter(connection, { identifier: 'wollok-build', title: 'Wollok Building...' })
    this.requestProgressReporter = new ProgressReporter(connection, { identifier: 'wollok-request', title: 'Processing Request...' })
  }


  requestWithEnvironment<P, R, PR, E>(cb: (params: P, env: Environment, config: LSPAny) => R): ServerRequestHandler<P, R, PR, E> {
    return (params) => new Promise<R>((resolve) => {
      this.requestProgressReporter.begin()
      this.withLatestEnvironment((env) => {
        this.requestProgressReporter.end()
        resolve(cb(params, env, this.configs))
      })
    })
  }

  withLatestEnvironment(cb: EnvironmentSubscription): void {
    if(this.environment) {
      cb(this.environment)
    } else {
      this.subscriptions.push(cb)
    }
  }

  rebuildTextDocument(document: TextDocument): void {
    this.changeEnvironment(() => {
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
    this.changeEnvironment(() => buildEnvironment([]))
  }

  setConfigs(newConfigs: ClientConfigurations): void {
    this.configs = newConfigs
  }

  private changeEnvironment(build: () => Environment): void {
    this.buildProgressReporter.begin()
    this.environment = build()
    this.notify()
    this.buildProgressReporter.end()
  }

  private notify(): void {
    this.subscriptions.forEach(subscription => subscription(this.environment!))
    this.subscriptions = []
  }
}