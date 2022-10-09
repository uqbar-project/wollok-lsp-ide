import { CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import { Body, Method, Node } from 'wollok-ts'

export type NodeCompletion = Pick<CompletionItem, 'label' | 'kind' | 'sortText'> & { textEdit: { newText: string } }

export const completionsForNode = (node: Node): NodeCompletion[] => {
  switch (node.kind) {
    case 'Environment': return []
    case 'Package': return completePackage()
    case 'Singleton': return completeSingleton()
    case 'Body': return completeBody(node)
    case 'Method': return completeMethod(node)
    default: return completeForParent(node)
  }
}

const completePackage = (): NodeCompletion[] => [
  {
    label: 'object',
    kind: CompletionItemKind.Class,
    textEdit: { newText: 'object ${1:pepita} { $0}' },
  },
  {
    label: 'class',
    kind: CompletionItemKind.Class,
    textEdit: { newText: 'class ${1:Golondrina} { $0}' },
  },
]


const completeSingleton = (): NodeCompletion[] => [
  {
    label: 'var attribute',
    kind: CompletionItemKind.Field,
    sortText: 'a',
    textEdit: { newText: 'var ${1:energia} = ${0:0}' },
  },
  {
    label: 'const attribute',
    kind: CompletionItemKind.Field,
    sortText: 'a',
    textEdit: { newText: 'const ${1:energia} = ${0:0}' },
  },
  {
    label: 'method',
    kind: CompletionItemKind.Method,
    sortText: 'b',
    textEdit: { newText: 'method ${1:volar}($2) { $0}' },
  },
]

const completeBody = (node: Body): NodeCompletion[] => completeForParent(node)

const completeMethod = (node: Method): NodeCompletion[] => {
  const references = node.parameters.map(p => p.name)
  const parent = node.parent
  if (parent.is('Module')) references.push(...parent.fields().map(f => f.name))
  return references.map(name => ({
    label: name,
    kind: CompletionItemKind.Reference,
    textEdit: { newText: name },
  }))
}

export const completeForParent = (node: Node): NodeCompletion[] => {
  if(!node.parent) throw new Error('Node has no parent')
  return completionsForNode(node.parent)
}