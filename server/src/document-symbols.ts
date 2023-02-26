import { DocumentSymbol, Range, SymbolKind } from 'vscode-languageserver'
import { Entity, Field, Method, Node, Package, Test } from 'wollok-ts'
import { toVSCRange } from './utils/text-documents'

export const symbolsFor = (document: Package): DocumentSymbol[] =>
  document.members.map(documentSymbol)

const documentSymbol = (node: Entity | Field | Method | Test): DocumentSymbol => {
  const range = toVSCRange(node.sourceMap!)
  return DocumentSymbol.create(
    node.name!,
    undefined,
    symbolKind(node),
    range,
    range,
    node.is('Module') ? node.members.map(documentSymbol) : undefined
  )
}


const symbolKind = (node: Node): SymbolKind => {
  switch (node.kind) {
    case 'Class':
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