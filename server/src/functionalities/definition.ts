import { Location, TextDocumentPositionParams } from 'vscode-languageserver'
import { Environment, Method, Module, New, Node, Reference, Self, Send, Singleton, Super, is, match, when } from 'wollok-ts'
import { getNodesByPosition, nodeToLocation } from '../utils/text-documents'
import { logger } from '../utils/logger'

export const definition = (environment: Environment) => (
  textDocumentPosition: TextDocumentPositionParams
  ): Location[] => {
    const cursorNodes = getNodesByPosition(environment, textDocumentPosition)
    const definitions = getDefinition(environment)(cursorNodes.reverse()[0])
    return definitions.map(nodeToLocation)
  }

// WOLLOK-TS: hablar con Nahue/Ivo, para mí desde acá para abajo todo se podria migrar a wollok-ts
export const getDefinition = (environment: Environment) => (node: Node): Node[] => {
  try {
    getNodeDefinition(environment)(node)
  } catch (error) {
    logger.error(`✘ Error in getDefinition: ${error}`, error)
    return [node]
  }
}
