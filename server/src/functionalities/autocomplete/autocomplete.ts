import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver'
import { Field, Method, Module, Name, Node, Parameter, Singleton } from 'wollok-ts'


// -----------------
// -----MAPPERS-----
// -----------------
type CompletionItemMapper<T extends Node> = (node: T) => CompletionItem

export const parameterCompletionItem: CompletionItemMapper<Parameter> = namedCompletionItem(CompletionItemKind.Variable)

export const fieldCompletionItem: CompletionItemMapper<Field> = namedCompletionItem(CompletionItemKind.Field)

export const singletonCompletionItem: CompletionItemMapper<Singleton> = moduleCompletionItem(CompletionItemKind.Class)


export const methodCompletionItem: CompletionItemMapper<Method> = (method) => {
  const params = method.parameters.map((parameter, i) => `\${${i+1}:${parameter.name}}`).join(', ')
  return {
    label: method.name,
    filterText: method.name,
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: `${method.name}(${params})`,
    kind: CompletionItemKind.Method,
    detail: `${method.parent.name} \n\n\n File ${method.parent.sourceFileName?.split('/').pop()}`,
    labelDetails: { description: method.parent.name, detail: `(${method.parameters.map(parameter => parameter.name).join(', ')})` },
  }
}


function moduleCompletionItem<T extends Module>(kind: CompletionItemKind){
  return (module: T) => namedCompletionItem(kind)(module.name ? module as {name: Name} : { name: 'unnamed' })
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