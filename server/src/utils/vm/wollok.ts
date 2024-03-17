import { Class, Environment, Import, LiteralValue, Method, Module, Node, Package, Reference } from 'wollok-ts'
import { is } from 'wollok-ts/dist/extensions'

export const OBJECT_CLASS = 'wollok.lang.Object'

export const literalValueToClass = (environment: Environment, literal: LiteralValue): Class => {
  const clazz = (() => {
    switch (typeof literal) {
      case 'number':
        return 'wollok.lang.Number'
      case 'string':
        return 'wollok.lang.String'
      case 'boolean':
        return 'wollok.lang.Boolean'
      case 'object':
        try {
          const referenceClasses = literal as unknown as Reference<Class>[]
          return referenceClasses[0].name
        } catch (e) {
          return OBJECT_CLASS
        }
    }
  })()
  return environment.getNodeByFQN(clazz)
}

export const allAvailableMethods = (environment: Environment): Method[] =>
  environment.descendants.filter(is(Method)) as Method[]

export const allMethods = (environment: Environment, referenceClass: Reference<Module>): Method[] =>
  (referenceClass.target ?? environment.objectClass).allMethods as Method[]

export const firstNodeWithProblems = (node: Node): Node | undefined => {
  const { start, end } = node.problems![0].sourceMap ?? { start: { offset: -1 }, end: { offset: -1 } }
  return node.children.find(child =>
    child.sourceMap?.covers(start.offset) || child.sourceMap?.covers(end.offset)
  )
}

export const parentModule = (node: Node): Module => (node.ancestors.find(ancestor => ancestor.is(Module))) as Module ?? node.environment.objectClass

export const parentImport = (node: Node): Import | undefined => node.ancestors.find(ancestor => ancestor.is(Import)) as Import

export const implicitImport = (node: Node): boolean => ['wollok/lang.wlk', 'wollok/lib.wlk'].includes(node.sourceFileName ?? '')

// TOFIX
export const workspacePackage = (environment: Environment): Package =>
  environment.members[1]


export const targettingAt = <T extends Node>(aNode: T) => (anotherNode: Node): anotherNode is Reference<T> => {
  return anotherNode.is(Reference) && anotherNode.target === aNode
}
