  // ================================================================================================
  //
  // Uncomment this to have quick answer by running
  // yarn run test:highlighter
  //
  // ================================================================================================

import { HighlightingResult } from './tokenProvider'

  //
export const createRange = (line: number, column: number, length: number): WollokRange =>
  ({
    start: {
      line, column,
    },
    end: {
      line,
      column: column + length,
    },
  })

export type WollokPosition = {
  line: number,
  column: number,
}

export type WollokRange = {
  start: WollokPosition,
  end: WollokPosition,
}

export type WollokNodePlotter = {
  range: WollokRange
  tokenType: string
  tokenModifiers?: string[]
}

export const getLineColumn = (text: string[], offset: number): [number, number] => {
  let totalLength = 0
  let lineStartPos = 0
  for (let line = 0; line < text.length; line++) {
    totalLength += text[line].length + 1
    if (offset < totalLength) {
      const column = offset - lineStartPos
      return [line, column]
    }
    lineStartPos = totalLength
  }
}

export const mergeHighlightingResults = (highlightingResult1: HighlightingResult, highlightingResult2: HighlightingResult): HighlightingResult => ({
  result: (highlightingResult1.result ?? []).concat(highlightingResult2.result),
  references: (highlightingResult1.references ?? []).concat(highlightingResult2.references ?? []),
})