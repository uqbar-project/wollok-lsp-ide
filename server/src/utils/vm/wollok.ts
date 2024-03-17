import fs from 'fs'
import path from 'path'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Class, Entity, Environment, FileContent, Import, LiteralValue, Method, Module, Node, Package, Reference } from 'wollok-ts'
import { is } from 'wollok-ts/dist/extensions'
import { logger } from '../logger'

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

export const documentToFile = (doc: TextDocument): FileContent => ({
  // name: wollokURI(doc.uri),
  name: relativeFilePath(doc.uri),
  content: doc.getText(),
})

export const isNodeURI = (node: Node, uri: string): boolean => node.sourceFileName == relativeFilePath(uri)

export const workspacePackage = (environment: Environment): Package =>
  environment.members[1]

let _rootFolder = ''
/** THIS FUNCTION IS ONLY FOR TESTING */
export const _setRootFolder = (uri: string): void => {
  _rootFolder = uri
}

const FILE_BASE_URI = 'file://'

export const rootFolder = (uri: string): string => {
  // Cached, should not change!
  //   TODO: Check what happend on workspace change.
  if (_rootFolder) return _rootFolder

  if (uri.startsWith(FILE_BASE_URI)) {
    _rootFolder += FILE_BASE_URI
  }
  _rootFolder += findPackageJSON(decodeURIComponent(uri.replace(FILE_BASE_URI, '')))
  return _rootFolder
}

export const findPackageJSON = (uri: string): string => {
  let baseUri = uri
  logger.log('info', `Looking for package.json for: ${baseUri}`)
  while (!fs.existsSync(baseUri + '/' + 'package.json') && baseUri) {
    const lastIndex = baseUri.lastIndexOf('/')
    if (!lastIndex) logger.log('info', `Not found`)
    if (!lastIndex) return ''
    baseUri = baseUri.slice(0, lastIndex)
  }
  logger.log('info', `Found on: ${baseUri}`)
  return baseUri
}


export const relativeFilePath = (absoluteURI: string): string => {
  const rootPath = rootFolder(absoluteURI)
  if (!rootPath) return absoluteURI
  return absoluteURI.replaceAll(rootPath + '/', '')
}

export const uriFromRelativeFilePath = (relativeURI: string): string => {
  // It is important to have _rootFolder cached!
  return _rootFolder + '/' + relativeURI
}

export const projectFQN = (node: Entity): string => {
  if (node.fullyQualifiedName.startsWith('wollok')) return node.fullyQualifiedName
  const fileName = node.sourceFileName ?? ''
  const rootPath = rootFolder('/' + fileName).slice(1)
  if (!rootPath) return node.fullyQualifiedName
  const rootFQN = rootPath.replaceAll('/', '.')
  return node.fullyQualifiedName?.replaceAll(rootFQN + '.', '') ?? ''
}

export const targettingAt = <T extends Node>(aNode: T) => (anotherNode: Node): anotherNode is Reference<T> => {
  return anotherNode.is(Reference) && anotherNode.target === aNode
}
