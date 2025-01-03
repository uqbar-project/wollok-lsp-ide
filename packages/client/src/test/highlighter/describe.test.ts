import { WollokNodePlotter } from '../../highlighter/utils'
import { expect } from 'expect'
import { processedByTokenType, readFileForTokenProvider } from './utils'

suite('describe sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    processed = readFileForTokenProvider('src/test/highlighter/highlighter-samples/describeSample.wtest')
  })

  test('highlights keywords', () => {
    const keywordsTokens = processedByTokenType(processed, 'keyword')

    const nextRange = () => keywordsTokens.next().value.range

    const genericImportRange = nextRange()
    expect(genericImportRange.start).toEqual({ line: 0, column: 0 })
    expect(genericImportRange.end).toEqual({ line: 0, column: 6 })

    const specificImportRange = nextRange()
    expect(specificImportRange.start).toEqual({ line: 1, column: 0 })
    expect(specificImportRange.end).toEqual({ line: 1, column: 6 })

    const describeRange = nextRange()
    expect(describeRange.start).toEqual({ line: 3, column: 0 })
    expect(describeRange.end).toEqual({ line: 3, column: 8 })

    const varRange = nextRange()
    expect(varRange.start).toEqual({ line: 4, column: 2 })
    expect(varRange.end).toEqual({ line: 4, column: 5 })

    const testRange = nextRange()
    expect(testRange.start).toEqual({ line: 5, column: 2 })
    expect(testRange.end).toEqual({ line: 5, column: 6 })

    const ifWithoutElseRange = nextRange()
    expect(ifWithoutElseRange.start).toEqual({ line: 6, column: 4 })
    expect(ifWithoutElseRange.end).toEqual({ line: 6, column: 6 })

    const assignmentRange = nextRange()
    expect(assignmentRange.start).toEqual({ line: 6, column: 25 })
    expect(assignmentRange.end).toEqual({ line: 6, column: 26 })

    const constDefinition = nextRange()
    expect(constDefinition.start).toEqual({ line: 7, column: 4 })
    expect(constDefinition.end).toEqual({ line: 7, column: 9 })

    const ifWithElseRange = nextRange()
    expect(ifWithElseRange.start).toEqual({ line: 7, column: 25 })
    expect(ifWithElseRange.end).toEqual({ line: 7, column: 27 })

    const elseRange = nextRange()
    expect(elseRange.start).toEqual({ line: 7, column: 42 })
    expect(elseRange.end).toEqual({ line: 7, column: 46 })

    const onlyKeywordRange = nextRange()
    expect(onlyKeywordRange.start).toEqual({ line: 10, column: 2 })
    expect(onlyKeywordRange.end).toEqual({ line: 10, column: 6 })

    const test2Range = nextRange()
    expect(test2Range.start).toEqual({ line: 10, column: 7 })
    expect(test2Range.end).toEqual({ line: 10, column: 11 })
  })

  test('highlights properties', () => {
    const propertyTokens = processedByTokenType(processed, 'property')

    const nextRange = () => propertyTokens.next().value.range

    const referenceToGenericPackageRange = nextRange()
    expect(referenceToGenericPackageRange.start).toEqual({ line: 0, column: 7 })
    expect(referenceToGenericPackageRange.end).toEqual({ line: 0, column: 18 })

    const referenceToSpecificPackageRange = nextRange()
    expect(referenceToSpecificPackageRange.start).toEqual({ line: 1, column: 7 })
    expect(referenceToSpecificPackageRange.end).toEqual({ line: 1, column: 28 })

    const referenceToDescribeVariableRange = nextRange()
    expect(referenceToDescribeVariableRange.start).toEqual({ line: 4, column: 6 })
    expect(referenceToDescribeVariableRange.end).toEqual({ line: 4, column: 11 })

    const referenceToDescribeVariable2Range = nextRange()
    expect(referenceToDescribeVariable2Range.start).toEqual({ line: 6, column: 8 })
    expect(referenceToDescribeVariable2Range.end).toEqual({ line: 6, column: 13 })

    const referenceToDescribeVariable3Range = nextRange()
    expect(referenceToDescribeVariable3Range.start).toEqual({ line: 6, column: 19 })
    expect(referenceToDescribeVariable3Range.end).toEqual({ line: 6, column: 24 })

    const referenceToDescribeVariable4Range = nextRange()
    expect(referenceToDescribeVariable4Range.start).toEqual({ line: 7, column: 29 })
    expect(referenceToDescribeVariable4Range.end).toEqual({ line: 7, column: 34 })
  })

  test('highlights describes', () => {
    const describeTokens = processedByTokenType(processed, 'class')

    const nextRange = () => describeTokens.next().value.range

    const describeRange = nextRange()
    expect(describeRange.start).toEqual({ line: 3, column: 9 })
    expect(describeRange.end).toEqual({ line: 3, column: 24 })
  })

  test('highlights numbers', () => {
    const numberTokens = processedByTokenType(processed, 'number')

    const nextRange = () => numberTokens.next().value.range

    const valueForDescribeVariableRange = nextRange()
    expect(valueForDescribeVariableRange.start).toEqual({ line: 4, column: 14 })
    expect(valueForDescribeVariableRange.end).toEqual({ line: 4, column: 16 })

    const valueForParameterRange = nextRange()
    expect(valueForParameterRange.start).toEqual({ line: 6, column: 16 })
    expect(valueForParameterRange.end).toEqual({ line: 6, column: 17 })

    const valueForAssignmentRange = nextRange()
    expect(valueForAssignmentRange.start).toEqual({ line: 6, column: 27 })
    expect(valueForAssignmentRange.end).toEqual({ line: 6, column: 29 })

    const valueForParameter2Range = nextRange()
    expect(valueForParameter2Range.start).toEqual({ line: 7, column: 37 })
    expect(valueForParameter2Range.end).toEqual({ line: 7, column: 38 })

    const valueForAssignment2Range = nextRange()
    expect(valueForAssignment2Range.start).toEqual({ line: 7, column: 40 })
    expect(valueForAssignment2Range.end).toEqual({ line: 7, column: 41 })

    const valueForAssignment3Range = nextRange()
    expect(valueForAssignment3Range.start).toEqual({ line: 7, column: 47 })
    expect(valueForAssignment3Range.end).toEqual({ line: 7, column: 48 })

    const valuePassedInAssertRange = nextRange()
    expect(valuePassedInAssertRange.start).toEqual({ line: 8, column: 18 })
    expect(valuePassedInAssertRange.end).toEqual({ line: 8, column: 19 })
  })

  test('highlights methods', () => {
    const methodTokens = processedByTokenType(processed, 'method')

    const nextRange = () => methodTokens.next().value.range

    const testNameRange = nextRange()
    expect(testNameRange.start).toEqual({ line: 5, column: 7 })
    expect(testNameRange.end).toEqual({ line: 5, column: 18 })

    const messageRange = nextRange()
    expect(messageRange.start).toEqual({ line: 8, column: 11 })
    expect(messageRange.end).toEqual({ line: 8, column: 17 })

    const testNameRange2 = nextRange()
    expect(testNameRange2.start).toEqual({ line: 10, column: 12 })
    expect(testNameRange2.end).toEqual({ line: 10, column: 26 })

    const messageRange2 = nextRange()
    expect(messageRange2.start).toEqual({ line: 11, column: 11 })
    expect(messageRange2.end).toEqual({ line: 11, column: 18 })
  })

  test('highlights variables', () => {
    const variableTokens = processedByTokenType(processed, 'variable')

    const nextRange = () => variableTokens.next().value.range

    const localVariableRange = nextRange()
    expect(localVariableRange.start).toEqual({ line: 7, column: 10 })
    expect(localVariableRange.end).toEqual({ line: 7, column: 22 })

    const localVariableUseRange = nextRange()
    expect(localVariableUseRange.start).toEqual({ line: 8, column: 21 })
    expect(localVariableUseRange.end).toEqual({ line: 8, column: 33 })
  })

  test('highlights operators', () => {
    const operatorTokens = processedByTokenType(processed, 'operator')

    const nextRange = () => operatorTokens.next().value.range

    const lessThanOperatorRange = nextRange()
    expect(lessThanOperatorRange.start).toEqual({ line: 6, column: 14 })
    expect(lessThanOperatorRange.end).toEqual({ line: 6, column: 15 })

    const greaterThanOperatorRange = nextRange()
    expect(greaterThanOperatorRange.start).toEqual({ line: 7, column: 35 })
    expect(greaterThanOperatorRange.end).toEqual({ line: 7, column: 36 })
  })

  test('highlights booleans', () => {
    const booleanTokens = processedByTokenType(processed, 'enum')

    const nextRange = () => booleanTokens.next().value.range

    const describeRange = nextRange()
    expect(describeRange.start).toEqual({ line: 11, column: 19 })
    expect(describeRange.end).toEqual({ line: 11, column: 24 })
  })

})