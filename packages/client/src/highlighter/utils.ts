  // ================================================================================================
  //
  // Uncomment this to have quick answer by running
  // yarn run test:highlighter
  //
  // ================================================================================================
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