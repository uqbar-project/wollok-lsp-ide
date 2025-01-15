import { expect } from 'expect'
import { processedByTokenType, readFileForTokenProvider } from './utils'
import { WollokNodePlotter } from '../../highlighter/definitions'

suite('a mixin sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    processed = readFileForTokenProvider('src/test/highlighter/highlighter-samples/mixinSample.wlk')
  })

  test('highlights keywords', () => {
    const keywordsTokens = processedByTokenType(processed, 'keyword')

    const nextRange = () => keywordsTokens.next().value.range

    const mixinRange = nextRange()
    expect(mixinRange.start).toEqual({ line: 0, column: 0 })
    expect(mixinRange.end).toEqual({ line: 0, column: 5 })

    const varInMixinRange = nextRange()
    expect(varInMixinRange.start).toEqual({ line: 1, column: 2 })
    expect(varInMixinRange.end).toEqual({ line: 1, column: 5 })

    const methodInMixinRange = nextRange()
    expect(methodInMixinRange.start).toEqual({ line: 3, column: 2 })
    expect(methodInMixinRange.end).toEqual({ line: 3, column: 8 })

    const assignmentRange = nextRange()
    expect(assignmentRange.start).toEqual({ line: 4, column: 11 })
    expect(assignmentRange.end).toEqual({ line: 4, column: 12 })

    const propertyKeywordRange = nextRange()
    expect(propertyKeywordRange.start).toEqual({ line: 8, column: 0 })
    expect(propertyKeywordRange.end).toEqual({ line: 8, column: 5 })

    const inheritsRange = nextRange()
    expect(inheritsRange.start).toEqual({ line: 8, column: 11 })
    expect(inheritsRange.end).toEqual({ line: 8, column: 19 })

    const varInClassRange = nextRange()
    expect(varInClassRange.start).toEqual({ line: 9, column: 2 })
    expect(varInClassRange.end).toEqual({ line: 9, column: 5 })

    const methodInClassRange = nextRange()
    expect(methodInClassRange.start).toEqual({ line: 11, column: 2 })
    expect(methodInClassRange.end).toEqual({ line: 11, column: 8 })

    const assignmentInMethod2Range = nextRange()
    expect(assignmentInMethod2Range.start).toEqual({ line: 12, column: 11 })
    expect(assignmentInMethod2Range.end).toEqual({ line: 12, column: 12 })
  })

  test('highlights classes', () => {
    const classTokens = processedByTokenType(processed, 'class')

    const nextRange = () => classTokens.next().value.range

    const mixinRange = nextRange()
    expect(mixinRange.start).toEqual({ line: 0, column: 6 })
    expect(mixinRange.end).toEqual({ line: 0, column: 11 })

    const classRange = nextRange()
    expect(classRange.start).toEqual({ line: 8, column: 6 })
    expect(classRange.end).toEqual({ line: 8, column: 10 })

    const inheritsFromMixinRange = nextRange()
    expect(inheritsFromMixinRange.start).toEqual({ line: 8, column: 20 })
    expect(inheritsFromMixinRange.end).toEqual({ line: 8, column: 25 })
  })

  test('highlights properties', () => {
    const propertyTokens = processedByTokenType(processed, 'property')

    const nextRange = () => propertyTokens.next().value.range

    const energyDefinitionRange = nextRange()
    expect(energyDefinitionRange.start).toEqual({ line: 1, column: 6 })
    expect(energyDefinitionRange.end).toEqual({ line: 1, column: 12 })

    const energyInFlyMethodRange1 = nextRange()
    expect(energyInFlyMethodRange1.start).toEqual({ line: 4, column: 4 })
    expect(energyInFlyMethodRange1.end).toEqual({ line: 4, column: 10 })

    const energyInFlyMethodRange2 = nextRange()
    expect(energyInFlyMethodRange2.start).toEqual({ line: 4, column: 13 })
    expect(energyInFlyMethodRange2.end).toEqual({ line: 4, column: 19 })

    const nameDefinitionRange = nextRange()
    expect(nameDefinitionRange.start).toEqual({ line: 9, column: 6 })
    expect(nameDefinitionRange.end).toEqual({ line: 9, column: 10 })

    const energyInEatMethodRange1 = nextRange()
    expect(energyInEatMethodRange1.start).toEqual({ line: 12, column: 4 })
    expect(energyInEatMethodRange1.end).toEqual({ line: 12, column: 10 })

    const energyInEatMethodRange2 = nextRange()
    expect(energyInEatMethodRange2.start).toEqual({ line: 12, column: 13 })
    expect(energyInEatMethodRange2.end).toEqual({ line: 12, column: 19 })
  })

  test('highlights methods', () => {
    const methodTokens = processedByTokenType(processed, 'method')

    const nextRange = () => methodTokens.next().value.range

    const flyMethodRange = nextRange()
    expect(flyMethodRange.start).toEqual({ line: 3, column: 9 })
    expect(flyMethodRange.end).toEqual({ line: 3, column: 12 })

    const eatMethodRange = nextRange()
    expect(eatMethodRange.start).toEqual({ line: 11, column: 9 })
    expect(eatMethodRange.end).toEqual({ line: 11, column: 12 })

    const eatUseRange = nextRange()
    expect(eatUseRange.start).toEqual({ line: 12, column: 27 })
    expect(eatUseRange.end).toEqual({ line: 12, column: 33 })
  })

  test('highlights parameters', () => {
    const parameterTokens = processedByTokenType(processed, 'parameter')

    const nextRange = () => parameterTokens.next().value.range

    const minutesParameterRange = nextRange()
    expect(minutesParameterRange.start).toEqual({ line: 3, column: 13 })
    expect(minutesParameterRange.end).toEqual({ line: 3, column: 20 })

    const minutesUsageParameterRange = nextRange()
    expect(minutesUsageParameterRange.start).toEqual({ line: 4, column: 27 })
    expect(minutesUsageParameterRange.end).toEqual({ line: 4, column: 34 })

    const foodParameterRange = nextRange()
    expect(foodParameterRange.start).toEqual({ line: 11, column: 13 })
    expect(foodParameterRange.end).toEqual({ line: 11, column: 17 })

    const foodUsageParameterRange = nextRange()
    expect(foodUsageParameterRange.start).toEqual({ line: 12, column: 22 })
    expect(foodUsageParameterRange.end).toEqual({ line: 12, column: 26 })
  })

  test('highlights operators', () => {
    const operatorTokens = processedByTokenType(processed, 'operator')

    const nextRange = () => operatorTokens.next().value.range

    const minusOperatorRange = nextRange()
    expect(minusOperatorRange.start).toEqual({ line: 4, column: 20 })
    expect(minusOperatorRange.end).toEqual({ line: 4, column: 21 })

    const multiplyOperatorRange = nextRange()
    expect(multiplyOperatorRange.start).toEqual({ line: 4, column: 25 })
    expect(multiplyOperatorRange.end).toEqual({ line: 4, column: 26 })

    const plusOperatorRange = nextRange()
    expect(plusOperatorRange.start).toEqual({ line: 12, column: 20 })
    expect(plusOperatorRange.end).toEqual({ line: 12, column: 21 })
  })

  test('highlights numbers', () => {
    const numberTokens = processedByTokenType(processed, 'number')

    const nextRange = () => numberTokens.next().value.range

    const numberAsAValueOfFieldRange = nextRange()
    expect(numberAsAValueOfFieldRange.start).toEqual({ line: 1, column: 15 })
    expect(numberAsAValueOfFieldRange.end).toEqual({ line: 1, column: 18 })

    const numberAsReceiverRange = nextRange()
    expect(numberAsReceiverRange.start).toEqual({ line: 4, column: 23 })
    expect(numberAsReceiverRange.end).toEqual({ line: 4, column: 24 })
  })

})
