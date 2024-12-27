import { WollokNodePlotter } from '../../highlighter/utils'
import { expect } from 'expect'
import { processedByTokenType, readFileForTokenProvider } from './utils'

suite('an object sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    processed = readFileForTokenProvider('src/test/highlighter/highlighter-samples/objectSample.wlk')
  })

  test('highlights object keyword', () => {
    const keywordsTokens = processedByTokenType(processed, 'keyword')

    const nextRange = () => keywordsTokens.next().value.range

    const objectRange = nextRange()
    expect(objectRange.start).toEqual({ line: 0, column: 0 })
    expect(objectRange.end).toEqual({ line: 0, column: 6 })

    const varRange = nextRange()
    expect(varRange.start).toEqual({ line: 1, column: 2 })
    expect(varRange.end).toEqual({ line: 1, column: 5 })

    const propertyRange = nextRange()
    expect(propertyRange.start).toEqual({ line: 1, column: 6 })
    expect(propertyRange.end).toEqual({ line: 1, column: 14 })

    const constRange = nextRange()
    expect(constRange.start).toEqual({ line: 2, column: 2 })
    expect(constRange.end).toEqual({ line: 2, column: 7 })

    const methodFlyRange = nextRange()
    expect(methodFlyRange.start).toEqual({ line: 4, column: 2 })
    expect(methodFlyRange.end).toEqual({ line: 4, column: 8 })

    const equalRange = nextRange()
    expect(equalRange.start).toEqual({ line: 5, column: 11 })
    expect(equalRange.end).toEqual({ line: 5, column: 12 })

    const methodRealEnergyRange = nextRange()
    expect(methodRealEnergyRange.start).toEqual({ line: 8, column: 2 })
    expect(methodRealEnergyRange.end).toEqual({ line: 8, column: 8 })

    const selfRange = nextRange()
    expect(selfRange.start).toEqual({ line: 8, column: 33 })
    expect(selfRange.end).toEqual({ line: 8, column: 37 })

    const methodNameValueRange = nextRange()
    expect(methodNameValueRange.start).toEqual({ line: 9, column: 2 })
    expect(methodNameValueRange.end).toEqual({ line: 9, column: 8 })
  })

  test('highlights properties', () => {
    const propertyTokens = processedByTokenType(processed, 'property')

    const nextRange = () => propertyTokens.next().value.range

    const energyDefinitionRange = nextRange()
    expect(energyDefinitionRange.start).toEqual({ line: 1, column: 15 })
    expect(energyDefinitionRange.end).toEqual({ line: 1, column: 21 })

    const nameDefinitionRange = nextRange()
    expect(nameDefinitionRange.start).toEqual({ line: 2, column: 8 })
    expect(nameDefinitionRange.end).toEqual({ line: 2, column: 12 })

    const energyInAssignmentRange = nextRange()
    expect(energyInAssignmentRange.start).toEqual({ line: 5, column: 4 })
    expect(energyInAssignmentRange.end).toEqual({ line: 5, column: 10 })

    const energyInMessageRange = nextRange()
    expect(energyInMessageRange.start).toEqual({ line: 5, column: 13 })
    expect(energyInMessageRange.end).toEqual({ line: 5, column: 19 })

    const energyInMessage2Range = nextRange()
    expect(energyInMessage2Range.start).toEqual({ line: 8, column: 24 })
    expect(energyInMessage2Range.end).toEqual({ line: 8, column: 30 })

    const nameInMessageRange = nextRange()
    expect(nameInMessageRange.start).toEqual({ line: 9, column: 23 })
    expect(nameInMessageRange.end).toEqual({ line: 9, column: 27 })
  })

  test('highlights object name', () => {
    const classTokens = processedByTokenType(processed, 'object')

    const nextRange = () => classTokens.next().value.range

    const objectRange = nextRange()
    expect(objectRange.start).toEqual({ line: 0, column: 7 })
    expect(objectRange.end).toEqual({ line: 0, column: 13 })
  })

  test('highlights method names', () => {
    const methodTokens = processedByTokenType(processed, 'method')

    const nextRange = () => methodTokens.next().value.range

    const flyMethodRange = nextRange()
    expect(flyMethodRange.start).toEqual({ line: 4, column: 9 })
    expect(flyMethodRange.end).toEqual({ line: 4, column: 12 })

    const realEnergyRange = nextRange()
    expect(realEnergyRange.start).toEqual({ line: 8, column: 9 })
    expect(realEnergyRange.end).toEqual({ line: 8, column: 19 })

    const nameValueMessageRange = nextRange()
    expect(nameValueMessageRange.start).toEqual({ line: 8, column: 38 })
    expect(nameValueMessageRange.end).toEqual({ line: 8, column: 47 })

    const nameValueRange = nextRange()
    expect(nameValueRange.start).toEqual({ line: 9, column: 9 })
    expect(nameValueRange.end).toEqual({ line: 9, column: 18 })

    const lengthMessageRange = nextRange()
    expect(lengthMessageRange.start).toEqual({ line: 9, column: 28 })
    expect(lengthMessageRange.end).toEqual({ line: 9, column: 34 })
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

    const multiplyOperator2Range = nextRange()
    expect(multiplyOperator2Range.start).toEqual({ line: 8, column: 31 })
    expect(multiplyOperator2Range.end).toEqual({ line: 8, column: 32 })
  })


  test('highlights parameters', () => {
    const parameterTokens = processedByTokenType(processed, 'parameter')

    const nextRange = () => parameterTokens.next().value.range

    const minutesParameterRange = nextRange()
    expect(minutesParameterRange.start).toEqual({ line: 4, column: 13 })
    expect(minutesParameterRange.end).toEqual({ line: 4, column: 20 })
  })

  test('highlights numbers', () => {
    const numberTokens = processedByTokenType(processed, 'number')

    const nextRange = () => numberTokens.next().value.range

    const numberAsAValueOfFieldRange = nextRange()
    expect(numberAsAValueOfFieldRange.start).toEqual({ line: 1, column: 24 })
    expect(numberAsAValueOfFieldRange.end).toEqual({ line: 1, column: 27 })

    const numberAsReceiverOfMessageRange = nextRange()
    expect(numberAsReceiverOfMessageRange.start).toEqual({ line: 5, column: 23 })
    expect(numberAsReceiverOfMessageRange.end).toEqual({ line: 5, column: 25 })
  })

  test('highlights strings', () => {
    const numberTokens = processedByTokenType(processed, 'string')

    const nextRange = () => numberTokens.next().value.range

    const numberAsAValueOfFieldRange = nextRange()
    expect(numberAsAValueOfFieldRange.start).toEqual({ line: 2, column: 15 })
    expect(numberAsAValueOfFieldRange.end).toEqual({ line: 2, column: 23 })
  })


})
