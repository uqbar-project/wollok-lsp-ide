import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver'
import { Field, Method, Node, Parameter } from 'wollok-ts'

// -----------------
// -----MAPPERS-----
// -----------------
type CompletionItemMapper<T extends Node> = (node: T) => CompletionItem

export const parameterCompletionItem: CompletionItemMapper<Parameter> = namedCompletionItem(CompletionItemKind.Variable)

export const fieldCompletionItem: CompletionItemMapper<Field> = namedCompletionItem(CompletionItemKind.Field)

export const methodCompletionItem: CompletionItemMapper<Method> = (method) => {
  const params = method.parameters.map((p, i) => `\${${i+1}:${p.name}}`).join(', ')
  return {
    label: method.name,
    filterText: method.name,
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: `${method.name}(${params})`,
    kind: CompletionItemKind.Method,
    detail: `${method.parent.name} \n\n\n File ${method.parent.sourceFileName()?.split('/').pop()}`,
    labelDetails: { description: method.parent.name, detail: `(${method.parameters.map(p => p.name).join(', ')})` },
  }
}


function namedCompletionItem<T extends {name: string}>(kind: CompletionItemKind) {
  return (namedNode: T): CompletionItem => {
    return {
      label: namedNode.name,
      insertText: namedNode.name,
      insertTextFormat: InsertTextFormat.PlainText,
      kind,
    }
  }
}