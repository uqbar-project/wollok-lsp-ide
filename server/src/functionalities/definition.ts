import { Location, TextDocumentPositionParams } from 'vscode-languageserver'
import { Environment, Method, Module, New, Node, Reference, Self, Send, Singleton, Super, is, match, when } from 'wollok-ts'
import { getNodesByPosition, nodeToLocation } from '../utils/text-documents'
import { logger } from '../utils/logger'

export const definition = (environment: Environment) => (
  textDocumentPosition: TextDocumentPositionParams
  ): Location[] => {
    const cursorNodes = getNodesByPosition(environment, textDocumentPosition)
    const definitions = getNodeDefinition(environment)(cursorNodes.reverse()[0])
    return definitions.map(nodeToLocation)
  }

// WOLLOK-TS: hablar con Nahue/Ivo, para mí desde acá para abajo todo se podria migrar a wollok-ts
export const getNodeDefinition = (environment: Environment) => (node: Node): Node[] => {
  try {
    return match(node)(
      when(Reference)(node => definedOrEmpty(referenceDefinition(node))),
      when(Send)(sendDefinitions(environment)),
      when(Super)(node => definedOrEmpty(superMethodDefinition(node))),
      when(Self)(node => definedOrEmpty(node.ancestors.find(is(Module))))
    )
  } catch (error) {
    logger.error(`✘ Error in getNodeDefinition: ${error}`, error)
    return [node]
  }
}

function referenceDefinition(ref: Reference<Node>): Node | undefined {
  return ref.target
}


const sendDefinitions = (environment: Environment) => (send: Send): Method[] => {
  try {
    return match(send.receiver)(
      when(Reference)(node => {
        const target = node.target
        return target && is(Singleton)(target) ?
          definedOrEmpty(target.lookupMethod(send.message, send.args.length))
          : allMethodDefinitions(environment, send)
      }),
      when(New)(node => definedOrEmpty(node.instantiated.target?.lookupMethod(send.message, send.args.length))),
      when(Self)(_ => moduleFinderWithBackup(environment, send)(
        (module) => definedOrEmpty(module.lookupMethod(send.message, send.args.length))
      )),
    )
  } catch (error) {
    logger.error(`✘ Send definitions error: ${error}`, error)
    return allMethodDefinitions(environment, send)
  }
}

function superMethodDefinition(superNode: Super): Method | undefined {
  const currentMethod = superNode.ancestors.find(is(Method))!
  const module = superNode.ancestors.find(is(Module))
  return module ? module.lookupMethod(currentMethod.name, superNode.args.length, { lookupStartFQN: module.fullyQualifiedName }) : undefined
}

function allMethodDefinitions(environment: Environment, send: Send): Method[] {
  const arity = send.args.length
  const name = send.message
  return environment.descendants.filter(n =>
    is(Method)(n) &&
    n.name === name &&
    n.parameters.length === arity
  ) as Method[]
}


// UTILS
const moduleFinderWithBackup = (environment: Environment, send: Send) => (methodFinder: (module: Module) => Method[]) => {
  const module = send.ancestors.find(is(Module))
  return module ? methodFinder(module) : allMethodDefinitions(environment, send)
}

function definedOrEmpty<T>(value: T | undefined): T[] {
  return value ? [value] : []
}