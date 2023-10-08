import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver'
import { Node, Body, Method, Singleton, Module, Environment, Package, Class, Mixin } from 'wollok-ts'
import { is, match, when } from 'wollok-ts/dist/extensions'
import { fieldCompletionItem, parameterCompletionItem, singletonCompletionItem } from './autocomplete'

export const completionsForNode = (node: Node): CompletionItem[] => {
  console.info('**********', node.kind)
  try{
    return match(node)(
      when(Environment)(_ => []),
      when(Package)(completePackage),
      when(Singleton)(completeModule),
      when(Class)(completeModule),
      when(Mixin)(completeModule),
      when(Body)(completeBody),
      when(Method)(completeMethod)
    )
  } catch {
    return completeForParent(node)
  }
}

const completePackage = (): CompletionItem[] => [
  // TODO: consider wlk vs. wtest vs. wpgm
  // TODO 2: add program
  // TODO 3: describe -> va con strings?
  // TODO 4: test?
  {
    label: 'object',
    kind: CompletionItemKind.Module,
    insertTextFormat: InsertTextFormat.Snippet,
    sortText: 'a',
    insertText: 'object ${1:name} {\n  ${0}\n}',
  },
  {
    label: 'class',
    kind: CompletionItemKind.Class,
    sortText: 'b',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'class ${1:Name} {\n  ${0}\n}',
  },
  {
    label: 'describe',
    kind: CompletionItemKind.Folder,
    insertTextFormat: InsertTextFormat.Snippet,
    sortText: 'c',
    insertText: 'describe ${1:name} {\n  test "${2:description}" {\n    ${0}\n  }\n}',
  },
  {
    label: 'test',
    kind: CompletionItemKind.Event,
    sortText: 'd',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'test "${1:description}" {\n  ${0}\n}',
  },
]


const completeModule = (): CompletionItem[] => [
  {
    label: 'var attribute',
    kind: CompletionItemKind.Field,
    sortText: 'a',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'var ${1:name} = ${0:0}',
  },
  {
    label: 'var property',
    kind: CompletionItemKind.Property,
    sortText: 'a',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'var property ${1:name} = ${0}',
  },
  {
    label: 'const attribute',
    kind: CompletionItemKind.Field,
    sortText: 'b',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'const ${1:name} = ${0}',
  },
  {
    label: 'const property',
    kind: CompletionItemKind.Property,
    sortText: 'b',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'const property ${1:propertyName} = ${0:0}',
  },
  {
    label: 'method (effect)',
    kind: CompletionItemKind.Method,
    sortText: 'c',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'method ${1:name}($2) {\n  ${0}\n}',
  },
  {
    label: 'method (return)',
    kind: CompletionItemKind.Method,
    sortText: 'c',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'method ${1:name}($2) = ${0}',
  },
]

const completeBody = (node: Body): CompletionItem[] => completeForParent(node)

const completeMethod = (node: Method): CompletionItem[] => {
  const parent = node.parent
  const fields = is(Module) ? parent.fields : []
  return [
    ...node.parameters.map(parameterCompletionItem),
    ...fields.map(fieldCompletionItem),
    ...(node.environment.descendants.filter(node => node.is(Singleton) && !!node.name) as Singleton[]).map(singletonCompletionItem),
  ]
}

export const completeForParent = (node: Node): CompletionItem[] => {
  if(!node.parent) throw new Error('Node has no parent')
  return completionsForNode(node.parent)
}