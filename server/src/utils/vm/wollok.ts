import { Entity, Environment, FileContent, Node, Package } from 'wollok-ts'
import fs from 'fs'
import path from 'path'
import { TextDocument } from 'vscode-languageserver-textdocument'

export const wollokURI = (uri: string): string => uri.replace('file:///', '')

export const documentToFile = (doc: TextDocument): FileContent => ({
  name: wollokURI(doc.uri),
  content: doc.getText(),
})

export const isNodeURI = (node: Node, uri: string): boolean => node.sourceFileName == wollokURI(uri)

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

export const projectFQN = (node: Entity): string => {
  if (node.fullyQualifiedName.startsWith('wollok')) return node.fullyQualifiedName
  const fileName = node.sourceFileName ?? ''
  const rootPath = rootFolder(path.sep + fileName).slice(1)
  if (!rootPath) return node.fullyQualifiedName
  const rootFQN = rootPath.replaceAll(path.sep, '.')
  return node.fullyQualifiedName?.replaceAll(rootFQN + '.', '') ?? ''
}

export const projectPackages = (environment: Environment): Package[] =>
  environment.members.slice(1)
