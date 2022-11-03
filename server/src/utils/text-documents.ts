import { Location, Position, TextDocumentPositionParams } from 'vscode-languageserver'
import { Environment, Node, SourceIndex } from 'wollok-ts'

// TODO: Refactor
const include = (node: Node, { position, textDocument: { uri } }: TextDocumentPositionParams) => {
  if (!node.sourceFileName()) return false
  if (node.kind === 'Package') {
    return uri.includes(node.sourceFileName()!)
  }
  const startLine = node.sourceMap?.start?.line
  const endLine = node.sourceMap?.end?.line
  return uri.includes(node.sourceFileName()!) && startLine && endLine &&
    (startLine - 1 <= position.line && position.line <= endLine + 1 ||
      startLine - 1 == position.line && position.line == endLine + 1 &&
      (node?.sourceMap?.start?.offset || 0) <= position.character && position.character <= endLine
    )
}

// TODO: Use map instead of forEach
export const getNodesByPosition = (environment: Environment, textDocumentPosition: TextDocumentPositionParams): Node[] => {
  const result: Node[] = []
  environment.forEach(node => {
    if (node.sourceFileName() && include(node, textDocumentPosition)) result.push(node)
  })
  return result
}

const toVSCPosition = (position: SourceIndex): Position => {
  const max0 = (n: number) => n < 0 ? 0 : n

  return {
    line: max0(position.line - 1),
    character: max0(position.column - 1),
  }
}

export const nodeToLocation = (node: Node): Location => {
  if(!node.sourceMap || !node.sourceFileName()){
    throw new Error('No source map found for node')
  }

  return {
    uri: node.sourceFileName()!,
    range: {
      start: toVSCPosition(node.sourceMap.start),
      end: toVSCPosition(node.sourceMap.end),
    },
  }
}