import { CompletionItem, CompletionItemKind, CompletionParams, InsertTextFormat, Position, TextEdit } from 'vscode-languageserver'
import { Class, Entity, Environment, Field, Import, Method, Mixin, Module, Name, Node, Parameter, Reference, Singleton } from 'wollok-ts'
import { match, when } from 'wollok-ts/dist/extensions'
import { TimeMeasurer } from '../../time-measurer'
import { cursorNode, packageToURI } from '../../utils/text-documents'
import { OBJECT_CLASS, isImportedIn, parentModule, parentPackage, projectFQN, relativeFilePath } from '../../utils/vm/wollok'
import { completionsForNode } from './node-completion'
import { completeMessages } from './send-completion'


export const completions = (environment: Environment) => (
  params: CompletionParams,
): CompletionItem[] => {
  const timeMeasurer = new TimeMeasurer()

  const { position, textDocument, context } = params
  const selectionNode = cursorNode(environment, position, textDocument)

  timeMeasurer.addTime(`Autocomplete - ${selectionNode?.kind}`)

  const autocompleteMessages = context?.triggerCharacter === '.' && !selectionNode.parent.is(Import)
  if (autocompleteMessages) {
    // ignore dot
    position.character -= 1
  }
  const result = autocompleteMessages ? completeMessages(environment, selectionNode) : completionsForNode(selectionNode)
  timeMeasurer.finalReport()
  return result
}

// -----------------
// -----MAPPERS-----
// -----------------
type CompletionItemMapper<T extends Node> = (node: T) => CompletionItem

export const parameterCompletionItem: CompletionItemMapper<Parameter> = namedCompletionItem(CompletionItemKind.Variable)

export const fieldCompletionItem: CompletionItemMapper<Field> = namedCompletionItem(CompletionItemKind.Field)

export const singletonCompletionItem: CompletionItemMapper<Singleton> = moduleCompletionItem(CompletionItemKind.Class)

export const withImport = <T extends Node>(mapper: CompletionItemMapper<T>) => (relativeTo: Node): CompletionItemMapper<T> => (node) => {
  const importedPackage = parentPackage(node)
  const originalPackage = parentPackage(relativeTo)

  const result = mapper(node)
  if(
    importedPackage &&
    originalPackage &&
    isImportedIn(importedPackage, originalPackage)
  ) {
    result.detail = `Add import ${importedPackage.fileName ? relativeFilePath(packageToURI(importedPackage)) : importedPackage.name}${result.detail ? ` - ${result.detail}` : ''}`
    result.additionalTextEdits = (result.additionalTextEdits ?? []).concat(
      TextEdit.insert(Position.create(0, 0), `import ${importedPackage.name}.*\n`)
    )
  }

  return result
}
/**
 * We want
 * - first: methods belonging to the same file we are using
 * - then, concrete classes/singletons
 * - then, library methods having this order: 1. lang, 2. lib, 3. game
 * - and last: object
 */
const getSortText = (node: Node, method: Method) => {
  const methodContainer = parentModule(method)
  return formatSortText((node.sourceFileName === method.sourceFileName ? 1 : getLibraryIndex(method)) + additionalIndex(method, methodContainer))
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

const additionalIndex = (method: Method, methodContainer: Module): number => {
  if (methodContainer.fullyQualifiedName === OBJECT_CLASS) return 50
  if (methodContainer instanceof Class && methodContainer.isAbstract) return 5
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
      sortText: '001',
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
    sortText: '010',
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