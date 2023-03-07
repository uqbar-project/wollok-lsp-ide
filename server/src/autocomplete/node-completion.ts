import { CompletionItem, CompletionItemKind } from 'vscode-languageserver'
import { Node, Body, Method, Singleton, Module, Environment, Package } from 'wollok-ts'
import { is, match, when } from 'wollok-ts/dist/extensions'
import { fieldCompletionItem, parameterCompletionItem, singletonCompletionItem } from './autocomplete'

export const completionsForNode = (node: Node): CompletionItem[] => {
  try{
    return match(node)(
      when(Environment)(_ => []),
      when(Package)(completePackage),
      when(Singleton)(completeSingleton),
      when(Body)(completeBody),
      when(Method)(completeMethod)
    )
  } catch {
    return completeForParent(node)
  }
}

const completePackage = (): CompletionItem[] => [
  {
    label: 'object',
    kind: CompletionItemKind.Class,
    insertText: 'object ${1:pepita} { $0}',
  },
  {
    label: 'class',
    kind: CompletionItemKind.Class,
    insertText: 'class ${1:Golondrina} { $0}',
  },
]


const completeSingleton = (): CompletionItem[] => [
  {
    label: 'var attribute',
    kind: CompletionItemKind.Field,
    sortText: 'a',
    insertText: 'var ${1:energia} = ${0:0}',
  },
  {
    label: 'const attribute',
    kind: CompletionItemKind.Field,
    sortText: 'a',
    insertText: 'const ${1:energia} = ${0:0}',
  },
  {
    label: 'method',
    kind: CompletionItemKind.Method,
    sortText: 'b',
    insertText: 'method ${1:volar}($2) { $0}',
  },
]

const completeBody = (node: Body): CompletionItem[] => completeForParent(node)

const completeMethod = (node: Method): CompletionItem[] => {
  const parent = node.parent
  const fields = is(Module) ? parent.fields : []
  return [
    ...node.parameters.map(parameterCompletionItem),
    ...fields.map(fieldCompletionItem),
    ...(node.environment.descendants.filter(node => is(Singleton)(node) && !!node.name) as Singleton[]).map(singletonCompletionItem),
  ]
}

export const completeForParent = (node: Node): CompletionItem[] => {
  if(!node.parent) throw new Error('Node has no parent')
  return completionsForNode(node.parent)
}