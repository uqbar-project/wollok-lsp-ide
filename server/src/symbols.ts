import { DocumentSymbol, SymbolKind, WorkspaceSymbol } from 'vscode-languageserver'
import { Environment, Field, Method, Module, Node, Package, Program, Test, Variable } from 'wollok-ts'
import { toVSCRange } from './utils/text-documents'
import { workspacePackage } from './utils/wollok'

type Symbolyzable = Program | Test | Module | Variable | Field | Method | Test

export const documentSymbolsFor = (document: Package): DocumentSymbol[] =>
  (document.members.filter(isSymbolyzable) as Symbolyzable[]).map(documentSymbol)

export const workspaceSymbolsFor = (environment: Environment, query: string): WorkspaceSymbol[] =>
  (workspacePackage(environment).filter(isSymbolyzable) as Array<Symbolyzable>)
    .filter(node => node.sourceFileName() && node.sourceMap)
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
    node.is('Module') ? node.members.filter(m => m.sourceMap).map(documentSymbol) : undefined
  )
}

const workspaceSymbol = (node: Symbolyzable): WorkspaceSymbol => WorkspaceSymbol.create(
  node.name!,
  symbolKind(node),
  node.sourceFileName()!,
  toVSCRange(node.sourceMap!)
)

const isSymbolyzable = (node: Node): node is Symbolyzable => node.is('Program') || node.is('Test') || node.is('Module') || node.is('Variable') || node.is('Field') || node.is('Method') || node.is('Test')

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