import { Location, ReferenceParams } from 'vscode-languageserver'
import { Environment, Method, mayExecute, targettingAt } from 'wollok-ts'
import { cursorNode, nodeToLocation } from '../utils/text-documents'
import { logger } from '../utils/logger'

export const references = (environment: Environment) => (params: ReferenceParams): Location[] | null => {
  const node = cursorNode(environment, params.position, params.textDocument)
  if (!node) {
    logger.error('✘ Could not find the node to search references for')
    return null
  }
  return environment.descendants.filter(
    node.is(Method) ?
      mayExecute(node) :
      targettingAt(node)
  ).map(nodeToLocation)
}
