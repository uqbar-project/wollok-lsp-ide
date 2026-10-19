import { DocumentSymbol, DocumentSymbolParams, SymbolKind, WorkspaceSymbol, WorkspaceSymbolParams } from 'vscode-languageserver'
import { Environment, Field, Method, Module, Node, Package, Program, projectPackages, Test, Variable } from 'wollok-ts'
import { ClientConfigurations } from '../server'
import { logger } from '../utils/logger'
import { packageFromURI, toVSCRange, uriFromRelativeFilePath } from '../utils/text-documents'

type Symbolyzable = Program | Test | Module | Variable | Field | Method | Test

export const documentSymbols = (environment: Environment, config: ClientConfigurations) => (params: DocumentSymbolParams): DocumentSymbol[] => {
  const document = packageFromURI(params.textDocument.uri, environment)
  if (!document){
    logger.error(`✘ Could not produce symbols: document ${params.textDocument.uri} not found`)
    return []
  }
  return documentSymbolsFor(document, config)
}

export const workspaceSymbols = (
  environment: Environment
) => (params: WorkspaceSymbolParams): WorkspaceSymbol[] => workspaceSymbolsFor(environment, params.query)


const documentSymbolsFor = (document: Package, config: ClientConfigurations): DocumentSymbol[] =>
  (document.members.filter(isSymbolyzable) as Symbolyzable[]).map(documentSymbol(config))

const workspaceSymbolsFor = (environment: Environment, query: string): WorkspaceSymbol[] =>
  projectPackages(environment)
    .flatMap(_package => _package.descendants).filter(isSymbolyzable)
    .filter(node => node.sourceFileName && node.sourceMap)
    .filter(node => node.name?.toLowerCase().includes(query.toLowerCase())) // TODO: can we simplify to a single filter? Maybe extract the function
    .map(workspaceSymbol)


const documentSymbol = (config: ClientConfigurations) => (node: Symbolyzable): DocumentSymbol => {
  const range = toVSCRange(node.sourceMap!)
  return DocumentSymbol.create(
    documentSymbolText(node, config.typeSystem.enabled),
    undefined,
    symbolKind(node),
    range,
    range,
    'members' in node ? node.members.filter(m => m.sourceMap).map(documentSymbol(config)) : undefined
  )
}

const documentSymbolText = (node: Symbolyzable, typeSystemEnabled = false): string => {
  const base = node.is(Method)
    ? `${node.name}(${node.parameters.map(parameter => parameter.name).join(', ')})`
    : node.name!
  return typeSystemEnabled ? `${base}: ${node.type.name}` : base
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