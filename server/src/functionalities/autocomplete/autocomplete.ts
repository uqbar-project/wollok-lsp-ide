import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver'
import { Class, Entity, Field, Method, Mixin, Module, Name, Node, Parameter, Reference, Singleton } from 'wollok-ts'
import { OBJECT_CLASS, parentClass, projectFQN } from '../../utils/vm/wollok'
import { match, when } from 'wollok-ts/dist/extensions'


// -----------------
// -----MAPPERS-----
// -----------------
type CompletionItemMapper<T extends Node> = (node: T) => CompletionItem

export const parameterCompletionItem: CompletionItemMapper<Parameter> = namedCompletionItem(CompletionItemKind.Variable)

export const fieldCompletionItem: CompletionItemMapper<Field> = namedCompletionItem(CompletionItemKind.Field)

export const singletonCompletionItem: CompletionItemMapper<Singleton> = moduleCompletionItem(CompletionItemKind.Class)

/**
 * We want
 * - first: methods belonging to the same file we are using
 * - then, concrete classes/singletons
 * - then, library methods having this order: 1. lang, 2. lib, 3. game
 * - and last: object
 */
const getSortText = (node: Node, method: Method) => {
  const methodClass = parentClass(method)
  return node.sourceFileName === method.sourceFileName ? '001' : formatSortText(getLibraryIndex(method) + additionalIndex(method, methodClass))
}

const getLibraryIndex = (node: Node) => {
  switch (node.sourceFileName) {
    case 'wollok/lang.wlk': {
      return 20
    }
    case 'wollok/lib.wlk': {
      return 30
    }
    case 'wollok/game.wlk': {
      return 40
    }
    default: {
      return 10
    }
  }
}

const formatSortText = (index: number) => ('000' + index).slice(-3)

const additionalIndex = (method: Method, methodClass: Class): number => {
  if (methodClass.fullyQualifiedName === OBJECT_CLASS) return 50
  if (methodClass.isAbstract) return 5
  if (method.isAbstract()) return 3
  return 1
}

export const methodCompletionItem = (node: Node, method: Method): CompletionItem => {
  const params = method.parameters.map((parameter, i) => `\${${i+1}:${parameter.name}}`).join(', ')
  return {
    label: method.name,
    filterText: method.name,
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: `${method.name}(${params})`,
    kind: CompletionItemKind.Method,
    detail: `${method.parent.name} \n\n\n File ${method.parent.sourceFileName?.split('/').pop()}`,
    labelDetails: { description: method.parent.name, detail: `(${method.parameters.map(parameter => parameter.name).join(', ')})` },
    sortText: getSortText(node, method),
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

export const classCompletionItem = (clazz: Class): CompletionItem => {
  return {
    label: clazz.name,
    filterText: clazz.name,
    insertTextFormat: InsertTextFormat.PlainText,
    insertText: `${clazz.name}`,
    kind: CompletionItemKind.Class,
    detail: `${clazz.name} \n\n\n File ${clazz.parent.sourceFileName?.split('/').pop()}`,
    sortText: formatSortText(getLibraryIndex(clazz)),
  }
}

export const initializerCompletionItem = (clazz: Class): CompletionItem => {
  // TODO: export getAllUninitializedAttributes from wollok-ts and use it
  const initializers = clazz.allFields.map((member, i) => `\${${2*i+1}:${member.name}} = \${${2*i+2}}`).join(', ')
  return {
    label: 'initializers',
    filterText: 'initializers',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: initializers,
    kind: CompletionItemKind.Constructor,
  }
}

export const entityCompletionItem = (entity: Entity): CompletionItem => {
  const label = projectFQN(entity)
  return {
    label,
    filterText: label,
    insertTextFormat: InsertTextFormat.PlainText,
    kind: match(entity)(
      when(Class)(() => CompletionItemKind.Class),
      when(Mixin)(() => CompletionItemKind.Interface),
      when(Reference)(() => CompletionItemKind.Reference),
      when(Singleton)(() => CompletionItemKind.Module),
    ),
    sortText: formatSortText(getLibraryIndex(entity)),
  }
}