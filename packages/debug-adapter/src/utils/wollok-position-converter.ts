import { SourceIndex, SourceMap } from 'wollok-ts'

export class WollokPositionConverter {
  constructor(
    private readonly lineStartsAt1: boolean,
    private readonly columnStartsAt1: boolean
  ) {}

  convertSourceMapToClient(sourceMap: SourceMap): {line: number, column: number, lineEnd: number, columnEnd: number} {
    const { line, column } = this.convertPositionToClient(sourceMap.start)
    const { line: lineEnd, column: columnEnd } = this.convertPositionToClient(sourceMap.end)
    return {
      line,
      column,
      lineEnd,
      columnEnd,
    }
  }

  convertPositionToClient(position: SourceIndex): { line: number, column: number } {
    return {
      line: this.convertDebuggerLineToClient(position.line),
      column: this.convertDebuggerColumnToClient(position.column),
    }
  }

  convertDebuggerLineToClient(line: number): number {
    return this.lineStartsAt1 ? line : line - 1
  }

  convertDebuggerColumnToClient(column: number): number {
    return this.columnStartsAt1 ? column > 0 ? column : 1 : column - 1
  }
}