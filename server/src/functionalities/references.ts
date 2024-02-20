import { Location, ReferenceParams } from 'vscode-languageserver'
import { Environment } from 'wollok-ts'

export const references = (environment: Environment) => (params: ReferenceParams): Location[] | null => {


  return [Location.create(params.textDocument.uri, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } })]
}