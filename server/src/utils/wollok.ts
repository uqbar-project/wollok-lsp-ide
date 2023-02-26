import { Class, Entity, Environment, LiteralValue, Package } from 'wollok-ts'

export const literalValueToClass = (environment: Environment, literal: LiteralValue): Class => {
  switch (typeof literal){
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
    node.fullyQualifiedName().replace(pckg.fullyQualifiedName(), pckg.name)