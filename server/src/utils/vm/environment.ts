import { BehaviorSubject } from 'rxjs'
import { Connection } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, buildEnvironment } from 'wollok-ts'
import { inferTypes } from 'wollok-ts/dist/typeSystem/constraintBasedTypeSystem'
import { ProgressReporter } from '../progress-reporter'
import { wollokURI } from './wollok'
import { TimeMeasurer } from '../../time-measurer'
import { logger } from '../logger'

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

  private buildEnvironmentFrom(files: Parameters<typeof buildEnvironment>[0], baseEnvironment?: Environment): Environment | null {
    try {
      this.buildProgressReporter.begin()
      const timeMeasurer = new TimeMeasurer()
      const environment = buildEnvironment(files, baseEnvironment)
      timeMeasurer.addTime('Building environment')
      inferTypes(environment)
      timeMeasurer.addTime('Infering types')
      this.buildProgressReporter.end()
      timeMeasurer.finalReport()
      return environment
    } catch (error) {
      const message = `✘ Failed to build environment: ${error}`
      logger.error({
        level: 'error',
        files: files.map(file => file.name),
        message,
      })
      throw error
    }
  }
}
