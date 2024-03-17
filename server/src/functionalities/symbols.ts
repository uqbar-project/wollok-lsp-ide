import { DocumentSymbol, DocumentSymbolParams, SymbolKind, WorkspaceSymbol, WorkspaceSymbolParams } from 'vscode-languageserver'
import { Environment, Field, Method, Module, Node, Package, Program, Test, Variable } from 'wollok-ts'
import { logger } from '../utils/logger'
import { packageFromURI, toVSCRange, uriFromRelativeFilePath } from '../utils/text-documents'
import { workspacePackage } from '../utils/vm/wollok'

type Symbolyzable = Program | Test | Module | Variable | Field | Method | Test

export const documentSymbols = (environment: Environment) => (params: DocumentSymbolParams): DocumentSymbol[] => {
  // ToDo this is a temporal fix for https://github.com/uqbar-project/wollok-lsp-ide/issues/61
  if (!workspacePackage(environment)) {
    return []
  }
  const document = packageFromURI(params.textDocument.uri, environment)
  if (!document){
    logger.error('Could not produce symbols: document not found')
    return []
  }
  return documentSymbolsFor(document)
}

export const workspaceSymbols = (
  environment: Environment
) => (params: WorkspaceSymbolParams): WorkspaceSymbol[] => workspaceSymbolsFor(environment, params.query)


const documentSymbolsFor = (document: Package): DocumentSymbol[] =>
  (document.members.filter(isSymbolyzable) as Symbolyzable[]).map(documentSymbol)

const workspaceSymbolsFor = (environment: Environment, query: string): WorkspaceSymbol[] =>
  workspacePackage(environment).descendants.filter(isSymbolyzable)
    .filter(node => node.sourceFileName && node.sourceMap)
    .filter(node => node.name?.toLowerCase().includes(query.toLowerCase()))
    .map(workspaceSymbol)


const documentSymbol = (node: Symbolyzable): DocumentSymbol => {
  const range = toVSCRange(node.sourceMap!)
  return DocumentSymbol.create(
    node.name!,
    undefined,
    symbolKind(node),
    range,
    range,
    'members' in node ? node.members.filter(m => m.sourceMap).map(documentSymbol) : undefined
  )
}

const workspaceSymbol = (node: Symbolyzable): WorkspaceSymbol => WorkspaceSymbol.create(
  node.name!,
  symbolKind(node),
  uriFromRelativeFilePath(node.sourceFileName!),
  toVSCRange(node.sourceMap!)
)

const isSymbolyzable = (node: Node): node is Symbolyzable =>
  [Program, Test, Module, Variable, Field, Method].some(t => node.is(t))


const symbolKind = (node: Node): SymbolKind => {
  switch (node.kind) {
    case 'Class':
      return SymbolKind.Class
    case 'Singleton':
      return SymbolKind.Class
    case 'Mixin':
      return SymbolKind.Enum
    case 'Method':
      return SymbolKind.Method
    case 'Field':
      return SymbolKind.Field
    case 'Variable':
      return SymbolKind.Variable
    case 'Parameter':
      return SymbolKind.Variable
    case 'Package':
      return SymbolKind.Package
    case 'Test':
      return SymbolKind.Event
    case 'Describe':
      return SymbolKind.Array
    default:
      return SymbolKind.Variable
  }
}