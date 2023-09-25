import { Location, Position, Range, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, Node, SourceIndex, SourceMap } from 'wollok-ts'

// TODO: Refactor
const include = (node: Node, { position, textDocument: { uri } }: TextDocumentPositionParams) => {
  if (!node.sourceFileName) return false
  if (node.kind === 'Package') {
    return uri.includes(node.sourceFileName)
  }
  if(!node.sourceMap) return false

  const startPosition = toVSCPosition(node.sourceMap.start)
  const endPosition = toVSCPosition(node.sourceMap.end)

  return uri.includes(node.sourceFileName!)
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

export const getNodesByPosition = (environment: Environment, textDocumentPosition: TextDocumentPositionParams): Node[] => {
  return environment.descendants.filter(node => !!node.sourceFileName && include(node, textDocumentPosition))
}

export const toVSCPosition = (position: SourceIndex): Position => {
  const max0 = (n: number) => n < 0 ? 0 : n

  return Position.create(
    max0(position.line - 1),
    max0(position.column - 1)
  )
}

export const toVSCRange = (sourceMap: SourceMap): Range =>
  Range.create(toVSCPosition(sourceMap.start), toVSCPosition(sourceMap.end))

export const nodeToLocation = (node: Node): Location => {
  if(!node.sourceMap || !node.sourceFileName){
    throw new Error('No source map found for node')
  }

  return {
    uri: node.sourceFileName!,
    range: toVSCRange(node.sourceMap),
  }
}

export function trimIn(range: Range, textDocument: TextDocument): Range {
  const start = textDocument.offsetAt(range.start)
  const end = textDocument.offsetAt(range.end)
  const text = textDocument.getText().substring(start, end)
  const trimmed = text.trim()
  const startOffset = text.indexOf(trimmed)
  const endOffset = startOffset + trimmed.length
  return Range.create(
    textDocument.positionAt(start + startOffset),
    textDocument.positionAt(start + endOffset),
  )
}


export const getWollokFileExtension = (uri: string): 'wlk' | 'wpgm' | 'wtest' => {
  const extension = uri.split('.').pop()
  if(!extension) throw new Error('Could not determine file extension')

  switch(extension) {
    case 'wlk':
    case 'wpgm':
    case 'wtest':
      return extension
    default:
      throw new Error('Invalid file extension')
  }
}