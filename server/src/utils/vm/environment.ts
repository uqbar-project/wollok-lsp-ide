import { BehaviorSubject } from 'rxjs'
import { Connection } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, buildEnvironment } from 'wollok-ts'
import { inferTypes } from 'wollok-ts/dist/typeSystem/constraintBasedTypeSystem'
import { ProgressReporter } from '../progress-reporter'
import { wollokURI } from './wollok'
import { TimeMeasurer } from '../../time-measurer'
import { logger } from '../logger'
import { generateErrorForFile } from '../../linter'

export class EnvironmentProvider {
  readonly $environment = new BehaviorSubject<Environment | null>(null)
  private buildProgressReporter: ProgressReporter

  constructor(private connection: Connection) {
    this.buildProgressReporter = new ProgressReporter(connection, { identifier: 'wollok-build', title: 'Wollok Building...' })
  }

  updateEnvironmentWith(document: TextDocument): void {
    this.$environment.next(this.buildEnvironmentFrom([document], this.$environment.getValue() ?? undefined))
  }

  resetEnvironment(): void {
    return this.$environment.next(this.buildEnvironmentFrom([]))
  }

  private buildEnvironmentFrom(documents: TextDocument[], baseEnvironment?: Environment): Environment {
    const files: Parameters<typeof buildEnvironment>[0] = documents.map(document => ({
        name: wollokURI(document.uri),
        content: document.getText(),
    }))
    this.buildProgressReporter.begin()
    const timeMeasurer = new TimeMeasurer()
    try {
      const environment = buildEnvironment(files, baseEnvironment)
      timeMeasurer.addTime('Building environment')
      inferTypes(environment)
      timeMeasurer.addTime('Inferring types')
      this.buildProgressReporter.end()
      return environment
    } catch (error) {
      const message = `✘ Failed to build environment: ${error}`
      documents.forEach(document => {
        generateErrorForFile(this.connection, document)
      })
      logger.error({
        level: 'error',
        files: files.map(file => file.name),
        message,
      })
      throw error
    } finally {
      this.buildProgressReporter.end()
      timeMeasurer.finalReport()
    }
  }
}
