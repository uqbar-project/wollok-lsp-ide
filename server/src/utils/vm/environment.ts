import { BehaviorSubject } from 'rxjs'
import { Connection } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, buildEnvironment } from 'wollok-ts'
import { inferTypes } from 'wollok-ts/dist/typeSystem/constraintBasedTypeSystem'
import { TimeMeasurer } from '../../timeMeasurer'
import { ProgressReporter } from '../progress-reporter'
import { wollokURI } from './wollok'

export class EnvironmentProvider {
  readonly $environment = new BehaviorSubject<Environment | null>(null)
  private buildProgressReporter: ProgressReporter

  constructor(connection: Connection) {
    this.buildProgressReporter = new ProgressReporter(connection, { identifier: 'wollok-build', title: 'Wollok Building...' })
  }

  updateEnvironmentWith(document: TextDocument): void {
    const uri = wollokURI(document.uri)
    const content = document.getText()
    const file: { name: string, content: string } = {
      name: uri,
      content: content,
    }
    this.$environment.next(this.buildEnvironmentFrom([file], this.$environment.getValue() ?? undefined))
  }

  resetEnvironment(): void {
    return this.$environment.next(this.buildEnvironmentFrom([]))
  }

  private buildEnvironmentFrom(files: Parameters<typeof buildEnvironment>[0], baseEnvironment?: Environment): Environment {
    this.buildProgressReporter.begin()
    const timeMeasurer = new TimeMeasurer()
    const environment = buildEnvironment(files, baseEnvironment)
    timeMeasurer.addTime('build environment')
    inferTypes(environment, console)
    timeMeasurer.addTime('infer types')
    this.buildProgressReporter.end()
    timeMeasurer.finalReport()
    return environment
  }
}
