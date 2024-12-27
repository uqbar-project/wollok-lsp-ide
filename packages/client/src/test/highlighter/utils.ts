import { excludeNullish, parse } from 'wollok-ts'
import { readFileSync } from 'fs'
import { processCode } from '../../highlighter/tokenProvider'
import { WollokNodePlotter } from '../../highlighter/utils'

export const readFileForTokenProvider = (filePath: string): WollokNodePlotter[] => {
  const parsedFile = parse.File(filePath)
  const docText = readFileSync(filePath, { encoding: 'utf-8' })
  const tp = parsedFile.tryParse(docText)
  const splittedLines = docText.split('\n')
  return excludeNullish(processCode(tp.members[0], splittedLines))
}

export const processedByTokenType = (processed: WollokNodePlotter[], tokenType: string): ArrayIterator<WollokNodePlotter> => processed.filter(token => token.tokenType === tokenType).values()
