import { HighlightingResult, WollokNodePlotter, WollokPosition, WollokRange, WollokTokenKinds } from './definitions'

/* ====================================================================================== */
/*                                    Helpers for plotter                                 */
/* ====================================================================================== */
export function plotSingleLine(start: { ln, col, len }, kind: string): WollokNodePlotter {
  return {
    range: createRange(start.ln, start.col, start.len),
    tokenType: WollokTokenKinds[kind],
    tokenModifiers: ['declaration'],
  }
}

export function plotMultiline(start: WollokPosition, end: WollokPosition, kind: string): WollokNodePlotter {
  return {
    range: {
      start,
      end,
    },
    tokenType: WollokTokenKinds[kind],
    tokenModifiers: ['declaration'],
  }
}

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