import { Connection } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, buildEnvironment } from 'wollok-ts'
import { ProgressReporter } from '../progress-reporter'
import { wollokURI } from './wollok'
import { BehaviorSubject } from 'rxjs'

export class EnvironmentProvider {
  readonly $environment = new BehaviorSubject<Environment | null>(null)
  private buildProgressReporter: ProgressReporter

  constructor(connection: Connection) {
    this.buildProgressReporter = new ProgressReporter(connection, { identifier: 'wollok-build', title: 'Wollok Building...' })
  }

  updateEnvironmentWith(document: TextDocument): Environment {
    const uri = wollokURI(document.uri)
    const content = document.getText()
    const file: { name: string, content: string } = {
      name: uri,
      content: content,
    }
    return this.buildEnvironmentFrom([file], this.$environment.getValue() ?? undefined
    )
  }

  resetEnvironment(): Environment {
    return this.buildEnvironmentFrom([])
  }

  private buildEnvironmentFrom(files: Parameters<typeof buildEnvironment>[0], baseEnvironment?: Environment): Environment {
    this.buildProgressReporter.begin()
    const environment = buildEnvironment(files, baseEnvironment)
    this.buildProgressReporter.end()
    return environment
  }
}
