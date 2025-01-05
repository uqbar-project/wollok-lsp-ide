import { HighlightingResult, WollokNodePlotter, WollokPosition, WollokRange, WollokTokenKinds } from './definitions'

/* ====================================================================================== */
/*                                    Helpers for plotter                                 */
/* ====================================================================================== */
export const plotSingleLine = (start: { line: number, column: number, length: number }, kind: string): WollokNodePlotter => {
  return {
    range: createRange(start.line, start.column, start.length),
    tokenType: WollokTokenKinds[kind],
    tokenModifiers: ['declaration'],
  }
}

const range = (start: number, end: number) => Array.from({ length: end + 1 - start }, (value, key) => key + start)

export const plotRange = (document: string[], start: WollokPosition, end: WollokPosition, kind: string): WollokNodePlotter[] =>
  range(start.line, end.line).map((line: number) => {
    const currentLineLength = document[line].length
    return {
      range: {
        start: {
          line,
          column: line === start.line ? start.column : 0,
        },
        end: {
          line,
          column: line === end.line ? end.column : currentLineLength,
        },
      },
      tokenType: WollokTokenKinds[kind],
      tokenModifiers: ['declaration'],
    }
  })

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

export const getLineColumn = (text: string[], offset: number): WollokPosition => {
  let totalLength = 0
  let lineStartPos = 0
  for (let line = 0; line < text.length; line++) {
    totalLength += text[line].length + 1
    if (offset < totalLength) {
      const column = offset - lineStartPos
      return { line, column }
    }
    lineStartPos = totalLength
  }
}

export const mergeHighlightingResults = (highlightingResult1: HighlightingResult, highlightingResult2: HighlightingResult): HighlightingResult => ({
  result: (highlightingResult1.result ?? []).concat(highlightingResult2.result),
  references: (highlightingResult1.references ?? []).concat(highlightingResult2.references ?? []),
})