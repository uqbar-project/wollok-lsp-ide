import { WollokNodePlotter } from '../../highlighter/utils'
import { expect } from 'expect'
import { processedByTokenType, readFileForTokenProvider } from './utils'

suite('a program sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    processed = readFileForTokenProvider('src/test/highlighter/highlighter-samples/programSample.wpgm')
  })

  test('highlights program keywords', () => {
    const keywordsTokens = processedByTokenType(processed, 'keyword')

    const nextRange = () => keywordsTokens.next().value.range

    const programRange = nextRange()
    expect(programRange.start).toEqual({ line: 0, column: 0 })
    expect(programRange.end).toEqual({ line: 0, column: 7 })

    const varKeywordRange = nextRange()
    expect(varKeywordRange.start).toEqual({ line: 1, column: 2 })
    expect(varKeywordRange.end).toEqual({ line: 1, column: 5 })

    const tryRange = nextRange()
    expect(tryRange.start).toEqual({ line: 2, column: 2 })
    expect(tryRange.end).toEqual({ line: 2, column: 5 })

    const ifKeywordRange = nextRange()
    expect(ifKeywordRange.start).toEqual({ line: 3, column: 4 })
    expect(ifKeywordRange.end).toEqual({ line: 3, column: 6 })

    const throwKeywordRange = nextRange()
    expect(throwKeywordRange.start).toEqual({ line: 3, column: 20 })
    expect(throwKeywordRange.end).toEqual({ line: 3, column: 25 })

    const newExceptionRange = nextRange()
    expect(newExceptionRange.start).toEqual({ line: 3, column: 26 })
    expect(newExceptionRange.end).toEqual({ line: 3, column: 29 })

    const catchFirstExceptionRange = nextRange()
    expect(catchFirstExceptionRange.start).toEqual({ line: 4, column: 4 })
    expect(catchFirstExceptionRange.end).toEqual({ line: 4, column: 9 })

    const catchSecondExceptionRange = nextRange()
    expect(catchSecondExceptionRange.start).toEqual({ line: 5, column: 4 })
    expect(catchSecondExceptionRange.end).toEqual({ line: 5, column: 9 })

    const thenAlwaysKeywordRange = nextRange()
    expect(thenAlwaysKeywordRange.start).toEqual({ line: 6, column: 4 })
    expect(thenAlwaysKeywordRange.end).toEqual({ line: 6, column: 15 })

    const assignmentKeywordRange = nextRange()
    expect(assignmentKeywordRange.start).toEqual({ line: 7, column: 10 })
    expect(assignmentKeywordRange.end).toEqual({ line: 7, column: 11 })

    const secondProgramRange = nextRange()
    expect(secondProgramRange.start).toEqual({ line: 11, column: 0 })
    expect(secondProgramRange.end).toEqual({ line: 11, column: 7 })

    const tryInSecondProgramRange = nextRange()
    expect(tryInSecondProgramRange.start).toEqual({ line: 12, column: 2 })
    expect(tryInSecondProgramRange.end).toEqual({ line: 12, column: 5 })

    const thenAlwaysWIthoutCatchRange = nextRange()
    expect(thenAlwaysWIthoutCatchRange.start).toEqual({ line: 14, column: 4 })
    expect(thenAlwaysWIthoutCatchRange.end).toEqual({ line: 14, column: 15 })
  })

  test('highlights class name', () => {
    const classTokens = processedByTokenType(processed, 'class')

    const nextRange = () => classTokens.next().value.range

    const newExceptionRange = nextRange()
    expect(newExceptionRange.start).toEqual({ line: 3, column: 30 })
    expect(newExceptionRange.end).toEqual({ line: 3, column: 39 })

    const classInCatchRange = nextRange()
    expect(classInCatchRange.start).toEqual({ line: 4, column: 13 })
    expect(classInCatchRange.end).toEqual({ line: 4, column: 28 })

    const classInCatch2Range = nextRange()
    expect(classInCatch2Range.start).toEqual({ line: 5, column: 13 })
    expect(classInCatch2Range.end).toEqual({ line: 5, column: 22 })
  })

  test('highlights properties', () => {
    const propertyTokens = processedByTokenType(processed, 'property')

    const nextRange = () => propertyTokens.next().value.range

    const firstProgramDefinitionRange = nextRange()
    expect(firstProgramDefinitionRange.start).toEqual({ line: 0, column: 8 })
    expect(firstProgramDefinitionRange.end).toEqual({ line: 0, column: 12 })

    const secondProgramDefinitionRange = nextRange()
    expect(secondProgramDefinitionRange.start).toEqual({ line: 11, column: 8 })
    expect(secondProgramDefinitionRange.end).toEqual({ line: 11, column: 19 })

    const consoleReferenceRange = nextRange()
    expect(consoleReferenceRange.start).toEqual({ line: 13, column: 4 })
    expect(consoleReferenceRange.end).toEqual({ line: 13, column: 11 })

    const consoleReference2Range = nextRange()
    expect(consoleReference2Range.start).toEqual({ line: 15, column: 4 })
    expect(consoleReference2Range.end).toEqual({ line: 15, column: 11 })
  })

  test('highlights methods', () => {
    const methodTokens = processedByTokenType(processed, 'method')

    const nextRange = () => methodTokens.next().value.range

    const printlnMessageRange = nextRange()
    expect(printlnMessageRange.start).toEqual({ line: 13, column: 12 })
    expect(printlnMessageRange.end).toEqual({ line: 13, column: 19 })

    const printlnMessage2Range = nextRange()
    expect(printlnMessage2Range.start).toEqual({ line: 15, column: 12 })
    expect(printlnMessage2Range.end).toEqual({ line: 15, column: 19 })
  })

  test('highlights parameters', () => {
    const parameterTokens = processedByTokenType(processed, 'parameter')

    const nextRange = () => parameterTokens.next().value.range

    const parameterCatchRange = nextRange()
    expect(parameterCatchRange.start).toEqual({ line: 4, column: 10 })
    expect(parameterCatchRange.end).toEqual({ line: 4, column: 11 })

    const parameterCatch2Range = nextRange()
    expect(parameterCatch2Range.start).toEqual({ line: 5, column: 10 })
    expect(parameterCatch2Range.end).toEqual({ line: 5, column: 11 })
  })

  test('highlights operators', () => {
    const operatorTokens = processedByTokenType(processed, 'operator')

    const nextRange = () => operatorTokens.next().value.range

    const greaterThanRange = nextRange()
    expect(greaterThanRange.start).toEqual({ line: 3, column: 8 })
    expect(greaterThanRange.end).toEqual({ line: 3, column: 9 })

    const assignmentRange = nextRange()
    expect(assignmentRange.start).toEqual({ line: 3, column: 15 })
    expect(assignmentRange.end).toEqual({ line: 3, column: 16 })
  })

  test('highlights local variables', () => {
    const operatorTokens = processedByTokenType(processed, 'variable')

    const nextRange = () => operatorTokens.next().value.range

    const countVariableRange = nextRange()
    expect(countVariableRange.start).toEqual({ line: 1, column: 6 })
    expect(countVariableRange.end).toEqual({ line: 1, column: 11 })

    const countInMessageRange = nextRange()
    expect(countInMessageRange.start).toEqual({ line: 3, column: 9 })
    expect(countInMessageRange.end).toEqual({ line: 3, column: 14 })

    const countInAssignmentRange = nextRange()
    expect(countInAssignmentRange.start).toEqual({ line: 7, column: 4 })
    expect(countInAssignmentRange.end).toEqual({ line: 7, column: 9 })
  })

  test('highlights numbers', () => {
    const numberTokens = processedByTokenType(processed, 'number')

    const nextRange = () => numberTokens.next().value.range

    const countInitializationRange = nextRange()
    expect(countInitializationRange.start).toEqual({ line: 1, column: 14 })
    expect(countInitializationRange.end).toEqual({ line: 1, column: 15 })

    const countComparisonRange = nextRange()
    expect(countComparisonRange.start).toEqual({ line: 3, column: 17 })
    expect(countComparisonRange.end).toEqual({ line: 3, column: 18 })

    const countValueInAssignmentRange = nextRange()
    expect(countValueInAssignmentRange.start).toEqual({ line: 7, column: 12 })
    expect(countValueInAssignmentRange.end).toEqual({ line: 7, column: 13 })
  })

})
