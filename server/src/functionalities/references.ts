import { Location, ReferenceParams } from 'vscode-languageserver'
import { Environment, Method, Node, Reference, Send, Singleton } from 'wollok-ts'
import { cursorNode, nodeToLocation } from '../utils/text-documents'
import { targettingAt } from '../utils/vm/wollok'

export const references = (environment: Environment) => (params: ReferenceParams): Location[] | null => {
  const node = cursorNode(environment, params.position, params.textDocument)

  return environment.descendants.filter(
    node.is(Method) ?
      mayExecute(node) :
      targettingAt(node)
  ).map(nodeToLocation)
}

const mayExecute = (method: Method) => (aNode: Node) =>
  aNode.is(Send) &&
  aNode.message === method.name &&
  // exclude cases where a message is sent to a different singleton
  !(aNode.receiver.is(Reference) && aNode.receiver.target?.is(Singleton) && aNode.receiver.target !== method.parent)