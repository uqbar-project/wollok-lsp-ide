import { Class, Entity, Environment, LiteralValue, Node, Package } from 'wollok-ts'

export const literalValueToClass = (environment: Environment, literal: LiteralValue): Class => {
  switch (typeof literal) {
    case 'number':
      return environment.getNodeByFQN('wollok.lang.Number')
    case 'string':
      return environment.getNodeByFQN('wollok.lang.String')
    case 'boolean':
      return environment.getNodeByFQN('wollok.lang.Boolean')
    case 'object':
      return environment.getNodeByFQN('wollok.lang.Object')
  }
}

// @ToDo Workaround because package fqn is absolute in the lsp.
export const fqnRelativeToPackage =
  (pckg: Package, node: Entity): string =>
    node.fullyQualifiedName.replace(pckg.fullyQualifiedName, pckg.name)

export const wollokURI = (uri: string): string => uri.replace('file:///', '')

export const isNodeURI = (node: Node, uri: string): boolean => node.sourceFileName == wollokURI(uri)

export const workspacePackage = (environment: Environment): Package =>
  environment.members[1]