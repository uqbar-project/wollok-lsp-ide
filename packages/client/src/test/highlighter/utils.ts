import { readFileSync } from 'fs'
import { processDocument } from '../../highlighter/tokenProvider'
import { WollokNodePlotter } from '../../highlighter/definitions'

const validateHighlighter = (wollokNodesPlotter: WollokNodePlotter[]) =>
  wollokNodesPlotter.every(wollokNodePlotter => {
    const { range } = wollokNodePlotter
    return !!range && range.start && range.end
  })

export const readFileForTokenProvider = (filePath: string): WollokNodePlotter[] => {
  const textDocument = readFileSync(filePath, { encoding: 'utf-8' })
  const processed = processDocument(filePath, textDocument)
  validateHighlighter(processed)
  return processed.sort((a, b) => a.range.start.line * 1000 + a.range.start.column - b.range.start.line * 1000 - b.range.start.column)
}

export const processedByTokenType = (processed: WollokNodePlotter[], tokenType: string): IterableIterator<WollokNodePlotter> => processed.filter(token => token.tokenType === tokenType).values()
