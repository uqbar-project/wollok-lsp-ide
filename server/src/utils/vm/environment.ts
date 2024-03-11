import { BehaviorSubject } from 'rxjs'
import { Connection } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, buildEnvironment, inferTypes } from 'wollok-ts'
import { ProgressReporter } from '../progress-reporter'
import { TimeMeasurer } from '../../time-measurer'
import { logger } from '../logger'
import { generateErrorForFile } from '../../linter'
import { documentToFile } from '../text-documents'

export class EnvironmentProvider {
  readonly $environment = new BehaviorSubject<Environment | null>(null)
  private buildProgressReporter: ProgressReporter
  inferTypes = false

  constructor(private connection: Connection) {
    this.buildProgressReporter = new ProgressReporter(connection, { identifier: 'wollok-build', title: 'Wollok Building...' })
  }

  updateEnvironmentWith(...documents: TextDocument[]): void {
    this.$environment.next(this.buildEnvironmentFrom(documents, this.$environment.getValue() ?? undefined))
  }

  resetEnvironment(): void {
    return this.$environment.next(this.buildEnvironmentFrom([]))
  }

  private buildEnvironmentFrom(documents: TextDocument[], baseEnvironment?: Environment): Environment {
    const files: Parameters<typeof buildEnvironment>[0] = documents.map(documentToFile)
    this.buildProgressReporter.begin()
    const timeMeasurer = new TimeMeasurer()
    try {
      const environment = buildEnvironment(files, baseEnvironment)
      timeMeasurer.addTime('Building environment')
      if (this.inferTypes) {
        inferTypes(environment)
        timeMeasurer.addTime('Inferring types')
      }
      return environment
    } catch (error) {

      // todo: remove this catch and move the logs to server.ts
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
