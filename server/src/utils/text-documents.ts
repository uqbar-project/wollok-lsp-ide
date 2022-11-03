import { Location, TextDocumentPositionParams } from 'vscode-languageserver'
import { Environment, Node } from 'wollok-ts'

// TODO: Refactor and move to utils
const include = (node: Node, { position, textDocument: { uri } }: TextDocumentPositionParams) => {
  const startLine = node.sourceMap?.start?.line
  const endLine = node.sourceMap?.end?.line
  if(node.kind === 'Package'){
    return uri === node.sourceFileName()
  }
  return node.sourceFileName() == uri && startLine && endLine &&
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

export const nodeToLocation = (node: Node): Location => {
  if(!node.sourceMap || !node.sourceFileName()){
    throw new Error('No source map found for node')
  }

  const max0 = (n: number) => n < 0 ? 0 : n
  return {
    uri: node.sourceFileName()!,
    range: {
      start: { line: max0(node.sourceMap.start.line - 1), character: max0(node.sourceMap.start.column - 1) },
      end: { line: max0(node.sourceMap.end.line - 1), character: max0(node.sourceMap.end.column - 1) },
    },
  }
}