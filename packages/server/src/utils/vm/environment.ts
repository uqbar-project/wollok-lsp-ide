import { BehaviorSubject } from 'rxjs'
import { Connection } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, buildEnvironment, inferTypes } from 'wollok-ts'
import { ProgressReporter } from '../progress-reporter'
import { TimeMeasurer } from '../../time-measurer'
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
      documents.forEach(document => {
        generateErrorForFile(this.connection, document)
      })
      throw error
    } finally {
      this.buildProgressReporter.end()
      timeMeasurer.finalReport()
    }
  }
}
