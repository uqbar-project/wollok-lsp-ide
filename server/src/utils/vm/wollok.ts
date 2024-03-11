import { is } from 'wollok-ts/dist/extensions'
import { Class, Entity, Environment, FileContent, Import, LiteralValue, Method, Module, Node, Package, Reference } from 'wollok-ts'
import fs from 'fs'
import path from 'path'
import { TextDocument } from 'vscode-languageserver-textdocument'

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

export const wollokURI = (uri: string): string => uri.replace('file:///', '')

export const documentToFile = (doc: TextDocument): FileContent => ({
  // name: wollokURI(doc.uri),
  name: relativeFilePath(doc.uri),
  content: doc.getText(),
})

export const isNodeURI = (node: Node, uri: string): boolean => node.sourceFileName == relativeFilePath(uri)

export const workspacePackage = (environment: Environment): Package =>
  environment.members[1]

export const rootFolder = (uri: string): string => {
  let folderPath = uri
  while (!fs.existsSync(folderPath + path.sep + 'package.json') && folderPath) {
    const lastIndex = folderPath.lastIndexOf(path.sep)
    if (!lastIndex) return ''
    folderPath = folderPath.slice(0, lastIndex)
  }
  return folderPath
}

export const relativeFilePath = (uri: string): string => {
  const sanitizedUri = uri.replace('file:///', path.sep)
  const rootPath = rootFolder(sanitizedUri)
  if (!rootPath) return sanitizedUri
  return sanitizedUri.replaceAll(rootPath + path.sep, '')
}

export const uriFromRelativeFilePath = (relativeURI: string): string => {
  const rootPath = rootFolder(relativeURI) // This is safe?
  return 'file://' + path.join(rootPath, relativeURI)
}

export const projectFQN = (node: Entity): string => {
  if (node.fullyQualifiedName.startsWith('wollok')) return node.fullyQualifiedName
  const fileName = node.sourceFileName ?? ''
  const rootPath = rootFolder(path.sep + fileName).slice(1)
  if (!rootPath) return node.fullyQualifiedName
  const rootFQN = rootPath.replaceAll(path.sep, '.')
  return node.fullyQualifiedName?.replaceAll(rootFQN + '.', '') ?? ''
}

export const targettingAt = <T extends Node>(aNode: T) => (anotherNode: Node): anotherNode is Reference<T> => {
  return anotherNode.is(Reference) && anotherNode.target === aNode
}
