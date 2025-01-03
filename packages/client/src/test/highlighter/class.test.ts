import { WollokNodePlotter } from '../../highlighter/utils'
import { expect } from 'expect'
import { processedByTokenType, readFileForTokenProvider } from './utils'

suite('a class sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    processed = readFileForTokenProvider('src/test/highlighter/highlighter-samples/classSample.wlk')
  })

  test('highlights keywords', () => {
    const keywordsTokens = processedByTokenType(processed, 'keyword')

    const nextRange = () => keywordsTokens.next().value.range

    const classRange = nextRange()
    expect(classRange.start).toEqual({ line: 0, column: 0 })
    expect(classRange.end).toEqual({ line: 0, column: 5 })

    const commonVarRange = nextRange()
    expect(commonVarRange.start).toEqual({ line: 1, column: 2 })
    expect(commonVarRange.end).toEqual({ line: 1, column: 5 })

    const propertyVarRange = nextRange()
    expect(propertyVarRange.start).toEqual({ line: 2, column: 2 })
    expect(propertyVarRange.end).toEqual({ line: 2, column: 5 })

    const propertyKeywordRange = nextRange()
    expect(propertyKeywordRange.start).toEqual({ line: 2, column: 6 })
    expect(propertyKeywordRange.end).toEqual({ line: 2, column: 14 })

    const newDateRange = nextRange()
    expect(newDateRange.start).toEqual({ line: 2, column: 27 })
    expect(newDateRange.end).toEqual({ line: 2, column: 30 })

    const flyMethod = nextRange()
    expect(flyMethod.start).toEqual({ line: 4, column: 2 })
    expect(flyMethod.end).toEqual({ line: 4, column: 8 })

    const assignmentEqualToVarRange = nextRange()
    expect(assignmentEqualToVarRange.start).toEqual({ line: 5, column: 11 })
    expect(assignmentEqualToVarRange.end).toEqual({ line: 5, column: 12 })

    const isYoungMethodRange = nextRange()
    expect(isYoungMethodRange.start).toEqual({ line: 8, column: 2 })
    expect(isYoungMethodRange.end).toEqual({ line: 8, column: 8 })

    const constVariableYearsRange = nextRange()
    expect(constVariableYearsRange.start).toEqual({ line: 9, column: 4 })
    expect(constVariableYearsRange.end).toEqual({ line: 9, column: 9 })

    const newDateRangeInIsYoungMethodRange = nextRange()
    expect(newDateRangeInIsYoungMethodRange.start).toEqual({ line: 9, column: 18 })
    expect(newDateRangeInIsYoungMethodRange.end).toEqual({ line: 9, column: 21 })

    const returnValueForIsYoungMethodRange = nextRange()
    expect(returnValueForIsYoungMethodRange.start).toEqual({ line: 10, column: 4 })
    expect(returnValueForIsYoungMethodRange.end).toEqual({ line: 10, column: 10 })
  })

  test('highlights classes', () => {
    const classTokens = processedByTokenType(processed, 'class')

    const nextRange = () => classTokens.next().value.range

    const classRange = nextRange()
    expect(classRange.start).toEqual({ line: 0, column: 6 })
    expect(classRange.end).toEqual({ line: 0, column: 10 })

    const classInNewRange = nextRange()
    expect(classInNewRange.start).toEqual({ line: 2, column: 31 })
    expect(classInNewRange.end).toEqual({ line: 2, column: 35 })

    const classInNewRange2 = nextRange()
    expect(classInNewRange2.start).toEqual({ line: 9, column: 22 })
    expect(classInNewRange2.end).toEqual({ line: 9, column: 26 })
  })

  test('highlights properties', () => {
    const propertyTokens = processedByTokenType(processed, 'property')

    const nextRange = () => propertyTokens.next().value.range

    const energyDefinitionRange = nextRange()
    expect(energyDefinitionRange.start).toEqual({ line: 1, column: 6 })
    expect(energyDefinitionRange.end).toEqual({ line: 1, column: 12 })

    const birthdateDefinitionRange = nextRange()
    expect(birthdateDefinitionRange.start).toEqual({ line: 2, column: 15 })
    expect(birthdateDefinitionRange.end).toEqual({ line: 2, column: 24 })

    const energyInFlyMethodRange1 = nextRange()
    expect(energyInFlyMethodRange1.start).toEqual({ line: 5, column: 4 })
    expect(energyInFlyMethodRange1.end).toEqual({ line: 5, column: 10 })

    const energyInFlyMethodRange2 = nextRange()
    expect(energyInFlyMethodRange2.start).toEqual({ line: 5, column: 13 })
    expect(energyInFlyMethodRange2.end).toEqual({ line: 5, column: 19 })

    const birthdateInIsYoungMethodRange = nextRange()
    expect(birthdateInIsYoungMethodRange.start).toEqual({ line: 9, column: 40 })
    expect(birthdateInIsYoungMethodRange.end).toEqual({ line: 9, column: 49 })
  })

  test('highlights methods', () => {
    const methodTokens = processedByTokenType(processed, 'method')

    const nextRange = () => methodTokens.next().value.range

    const flyMethodRange = nextRange()
    expect(flyMethodRange.start).toEqual({ line: 4, column: 9 })
    expect(flyMethodRange.end).toEqual({ line: 4, column: 12 })

    const isYoungMethodRange = nextRange()
    expect(isYoungMethodRange.start).toEqual({ line: 8, column: 9 })
    expect(isYoungMethodRange.end).toEqual({ line: 8, column: 16 })

    const differenceMessageRange = nextRange()
    expect(differenceMessageRange.start).toEqual({ line: 9, column: 29 })
    expect(differenceMessageRange.end).toEqual({ line: 9, column: 39 })
  })

  test('highlights parameters', () => {
    const parameterTokens = processedByTokenType(processed, 'parameter')

    const nextRange = () => parameterTokens.next().value.range

    const minutesParameterRange = nextRange()
    expect(minutesParameterRange.start).toEqual({ line: 4, column: 13 })
    expect(minutesParameterRange.end).toEqual({ line: 4, column: 20 })

    const minutesUsageParameterRange = nextRange()
    expect(minutesUsageParameterRange.start).toEqual({ line: 5, column: 28 })
    expect(minutesUsageParameterRange.end).toEqual({ line: 5, column: 35 })
  })

  test('highlights operators', () => {
    const operatorTokens = processedByTokenType(processed, 'operator')

    const nextRange = () => operatorTokens.next().value.range

    const plusOperatorRange = nextRange()
    expect(plusOperatorRange.start).toEqual({ line: 5, column: 20 })
    expect(plusOperatorRange.end).toEqual({ line: 5, column: 21 })

    const multiplyOperatorRange = nextRange()
    expect(multiplyOperatorRange.start).toEqual({ line: 5, column: 26 })
    expect(multiplyOperatorRange.end).toEqual({ line: 5, column: 27 })

    const divideOperatorRange = nextRange()
    expect(divideOperatorRange.start).toEqual({ line: 9, column: 51 })
    expect(divideOperatorRange.end).toEqual({ line: 9, column: 52 })

    const lessThanOperatorRange = nextRange()
    expect(lessThanOperatorRange.start).toEqual({ line: 10, column: 17 })
    expect(lessThanOperatorRange.end).toEqual({ line: 10, column: 18 })
  })

  test('highlights local variables', () => {
    const operatorTokens = processedByTokenType(processed, 'variable')

    const nextRange = () => operatorTokens.next().value.range

    const yearsDefinitionRange = nextRange()
    expect(yearsDefinitionRange.start).toEqual({ line: 9, column: 10 })
    expect(yearsDefinitionRange.end).toEqual({ line: 9, column: 15 })

    const yearsInMessageRange = nextRange()
    expect(yearsInMessageRange.start).toEqual({ line: 10, column: 11 })
    expect(yearsInMessageRange.end).toEqual({ line: 10, column: 16 })
  })

  test('highlights numbers', () => {
    const numberTokens = processedByTokenType(processed, 'number')

    const nextRange = () => numberTokens.next().value.range

    const numberAsAValueOfFieldRange = nextRange()
    expect(numberAsAValueOfFieldRange.start).toEqual({ line: 1, column: 15 })
    expect(numberAsAValueOfFieldRange.end).toEqual({ line: 1, column: 18 })

    const numberAsValueOfParameter1Range = nextRange()
    expect(numberAsValueOfParameter1Range.start).toEqual({ line: 2, column: 42 })
    expect(numberAsValueOfParameter1Range.end).toEqual({ line: 2, column: 43 })

    const numberAsValueOfParameter2Range = nextRange()
    expect(numberAsValueOfParameter2Range.start).toEqual({ line: 2, column: 53 })
    expect(numberAsValueOfParameter2Range.end).toEqual({ line: 2, column: 54 })

    const numberAsValueOfParameter3Range = nextRange()
    expect(numberAsValueOfParameter3Range.start).toEqual({ line: 2, column: 63 })
    expect(numberAsValueOfParameter3Range.end).toEqual({ line: 2, column: 67 })

    const numberAsReceiverOfMessageRange = nextRange()
    expect(numberAsReceiverOfMessageRange.start).toEqual({ line: 5, column: 23 })
    expect(numberAsReceiverOfMessageRange.end).toEqual({ line: 5, column: 25 })

    const numberAsParameterOfOperator1Range = nextRange()
    expect(numberAsParameterOfOperator1Range.start).toEqual({ line: 9, column: 53 })
    expect(numberAsParameterOfOperator1Range.end).toEqual({ line: 9, column: 56 })

    const numberAsParameterOfOperator2Range = nextRange()
    expect(numberAsParameterOfOperator2Range.start).toEqual({ line: 10, column: 19 })
    expect(numberAsParameterOfOperator2Range.end).toEqual({ line: 10, column: 20 })
  })

})
