import { Location, ReferenceParams } from 'vscode-languageserver'
import { Environment, Method, mayExecute, targettingAt } from 'wollok-ts'
import { cursorNode, nodeToLocation } from '../utils/text-documents'

export const references = (environment: Environment) => (params: ReferenceParams): Location[] | null => {
  const node = cursorNode(environment, params.position, params.textDocument)
  if (!node) throw new Error('Could not find selection node')
  return environment.descendants.filter(
    node.is(Method) ?
      mayExecute(node) :
      targettingAt(node)
  ).map(nodeToLocation)
}
