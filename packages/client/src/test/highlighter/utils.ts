import { excludeNullish, parse } from 'wollok-ts'
import { readFileSync } from 'fs'
import { processCode, processComments } from '../../highlighter/tokenProvider'
import { WollokNodePlotter } from '../../highlighter/utils'

export const readFileForTokenProvider = (filePath: string): WollokNodePlotter[] => {
  const parsedFile = parse.File(filePath)
  const docText = readFileSync(filePath, { encoding: 'utf-8' })
  const parsedPackage = parsedFile.tryParse(docText)
  const splittedLines = docText.split('\n')
  return excludeNullish(processCode(parsedPackage.members[0], splittedLines)).concat(processComments(splittedLines))
}

export const processedByTokenType = (processed: WollokNodePlotter[], tokenType: string): IterableIterator<WollokNodePlotter> => processed.filter(token => token.tokenType === tokenType).values()
