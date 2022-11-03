import { Node } from 'wollok-ts'

export const getNodeDefinition = (node: Node): Node => {
  if (node.kind === 'Reference') {
    return node.target()!
  }
  return node
}