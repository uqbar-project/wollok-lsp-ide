import { Location, TextDocumentPositionParams } from 'vscode-languageserver'
import { Environment, Method, Module, Node, Reference, Self, Send, Super, is, match, sendDefinitions, when } from 'wollok-ts'
import { getNodesByPosition, nodeToLocation } from '../utils/text-documents'
import { logger } from '../utils/logger'

export const definition = (environment: Environment) => (
  textDocumentPosition: TextDocumentPositionParams
  ): Location[] => {
    const cursorNodes = getNodesByPosition(environment, textDocumentPosition)
    const definitions = getDefinition(environment)(cursorNodes.reverse()[0])
    return definitions.map(nodeToLocation)
  }

export const getDefinition = (environment: Environment) => (node: Node): Node[] => {
  try {
    return getNodeDefinition(environment)(node)
  } catch (error) {
    logger.error(`✘ Error in getDefinition: ${error}`, error)
    return [node]
  }
}

// TODO: terminar de migrar a wollok-ts estas 4 definiciones
export const getNodeDefinition = (environment: Environment) => (node: Node): Node[] => {
  try {
    return match(node)(
      when(Reference)(node => definedOrEmpty(node.target)),
      when(Send)(node => mapSyntheticMethods(environment, node)),
      when(Super)(node => definedOrEmpty(superMethodDefinition(node))),
      when(Self)(node => definedOrEmpty(getParentModule(node)))
    )
  } catch {
    return [node]
  }
}

const mapSyntheticMethods = (environment: Environment, node: Send) => {
  const definitions = sendDefinitions(environment)(node)
  return definitions.map((method: Method) => method.isSynthetic ? getDefinitionFromSyntheticMethod(method) : method)
}

const getDefinitionFromSyntheticMethod = (method: Method) => {
  return method.parent.allFields.find((field) => field.name === method.name && field.isProperty)
}

const superMethodDefinition = (superNode: Super): Method | undefined => {
  const currentMethod = superNode.ancestors.find(is(Method))!
  const module = getParentModule(superNode)
  return module ? module.lookupMethod(currentMethod.name, superNode.args.length, { lookupStartFQN: module.fullyQualifiedName }) : undefined
}

const getParentModule = (node: Node) => node.ancestors.find(is(Module))

const definedOrEmpty = <T>(value: T | undefined): T[] => value ? [value] : []