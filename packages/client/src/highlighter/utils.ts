import * as vscode from 'vscode'

export const createRange = (line: number, column: number, length: number): vscode.Range =>
  new vscode.Range(
    new vscode.Position(line, column),
    new vscode.Position(line, column + length),
  )

  export type NodePlotter = {
    range: vscode.Range
    tokenType: string
    tokenModifiers?: string[]
  }

// export const createRange = (line: number, column: number, length: number): Range =>
//   ({
//     start: {
//       line, column,
//     },
//     end: {
//       line,
//       column: column + length,
//     },
//   })

//   export type Position = {
//     line: number,
//     column: number,
//   }

//   export type Range = {
//     start: Position,
//     end: Position,
//   }

//   export type NodePlotter = {
//     range: Range
//     tokenType: string
//     tokenModifiers?: string[]
//   }