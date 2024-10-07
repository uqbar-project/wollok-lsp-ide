import { Location, TextDocumentPositionParams } from 'vscode-languageserver'
import { Environment, getNodeDefinition, Method, Node, Send, sendDefinitions } from 'wollok-ts'
import { logger } from '../utils/logger'
import { getNodesByPosition, nodeToLocation } from '../utils/text-documents'

export const definition = (environment: Environment) => (
  textDocumentPosition: TextDocumentPositionParams
  ): Location[] => {
    const cursorNodes = getNodesByPosition(environment, textDocumentPosition)
    const definitions = getDefinition(environment)(cursorNodes.reverse()[0])
    return definitions.map(nodeToLocation)
  }

export const getDefinition = (environment: Environment) => (node: Node): Node[] => {
  try {
    if (node.is(Send)) {
      // TODO: migrate to wollok-ts
      const getDefinitionFromSyntheticMethod = (method: Method) => {
        return method.parent.allFields.find((field) => field.name === method.name && field.isProperty)
      }

      const definitions = sendDefinitions(environment)(node)
      return definitions.map((method: Method) => method.isSynthetic ? getDefinitionFromSyntheticMethod(method) : method)
    }
    return getNodeDefinition(environment)(node)
  } catch (error) {
    logger.error(`✘ Error in getDefinition: ${error}`, error)
    return [node]
  }
}