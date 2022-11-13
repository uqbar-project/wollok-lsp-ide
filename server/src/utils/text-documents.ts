import { Location, Position, TextDocumentPositionParams } from 'vscode-languageserver'
import { Environment, Node, SourceIndex } from 'wollok-ts'

// TODO: Refactor
const include = (node: Node, { position, textDocument: { uri } }: TextDocumentPositionParams) => {
  if (!node.sourceFileName()) return false
  if (node.kind === 'Package') {
    return uri === node.sourceFileName()
  }
  if(!node.sourceMap) return false

  const startPosition = toVSCPosition(node.sourceMap.start)
  const endPosition = toVSCPosition(node.sourceMap.end)

  return uri.includes(node.sourceFileName()!)
    && node.sourceMap
    && between(position, startPosition, endPosition)
}

export const between = (pointer: Position, start: Position, end: Position): boolean => {
  const { line: linePointer, character: charPointer } = pointer
  const { line: lineStart, character: charStart } = start
  const { line: lineEnd, character: charEnd } = end

  if(lineStart === lineEnd && linePointer === lineStart) {
    return charPointer >= charStart && charPointer <= charEnd
  }

  return linePointer > lineStart
    && linePointer < lineEnd
    || (linePointer === lineStart
    && charPointer >= charStart
    || linePointer === lineEnd
    && charPointer <= charEnd)
}


// TODO: Use map instead of forEach
export const getNodesByPosition = (environment: Environment, textDocumentPosition: TextDocumentPositionParams): Node[] => {
  const result: Node[] = []
  environment.forEach(node => {
    if (node.sourceFileName() && include(node, textDocumentPosition)) result.push(node)
  })
  return result
}

export const toVSCPosition = (position: SourceIndex): Position => {
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