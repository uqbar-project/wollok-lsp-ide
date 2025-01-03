import { excludeNullish, parse } from 'wollok-ts'
import { readFileSync } from 'fs'
import { processCode, processComments } from '../../highlighter/tokenProvider'
import { WollokNodePlotter } from '../../highlighter/utils'

const validateHighlighter = (wollokNodesPlotter: WollokNodePlotter[]) =>
  wollokNodesPlotter.every(wollokNodePlotter => {
    const { range } = wollokNodePlotter
    return !!range && range.start && range.end
  })

export const readFileForTokenProvider = (filePath: string): WollokNodePlotter[] => {
  const parsedFile = parse.File(filePath)
  const docText = readFileSync(filePath, { encoding: 'utf-8' })
  const parsedPackage = parsedFile.tryParse(docText)
  const splittedLines = docText.split('\n')
  const processed = excludeNullish(processCode(parsedPackage.members[0], splittedLines)).concat(processComments(splittedLines))
  validateHighlighter(processed)
  return processed.sort((a, b) => a.range.start.line * 1000 + a.range.start.column - b.range.start.line * 1000 - b.range.start.column)
}

export const processedByTokenType = (processed: WollokNodePlotter[], tokenType: string): IterableIterator<WollokNodePlotter> => processed.filter(token => token.tokenType === tokenType).values()
