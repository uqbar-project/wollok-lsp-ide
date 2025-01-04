import { expect } from 'expect'
import { processedByTokenType, readFileForTokenProvider } from './utils'
import { WollokNodePlotter } from '../../highlighter/definitions'

suite('inheritance sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    processed = readFileForTokenProvider('src/test/highlighter/highlighter-samples/inheritanceSample.wlk')
  })

  test('highlights keywords', () => {
    const keywordsTokens = processedByTokenType(processed, 'keyword')

    const nextRange = () => keywordsTokens.next().value.range

    const birdClassRange = nextRange()
    expect(birdClassRange.start).toEqual({ line: 0, column: 0 })
    expect(birdClassRange.end).toEqual({ line: 0, column: 5 })

    const energyVarRange = nextRange()
    expect(energyVarRange.start).toEqual({ line: 1, column: 2 })
    expect(energyVarRange.end).toEqual({ line: 1, column: 5 })

    const methodFlyRange = nextRange()
    expect(methodFlyRange.start).toEqual({ line: 2, column: 2 })
    expect(methodFlyRange.end).toEqual({ line: 2, column: 8 })

    const wkoRange = nextRange()
    expect(wkoRange.start).toEqual({ line: 5, column: 0 })
    expect(wkoRange.end).toEqual({ line: 5, column: 6 })

    const wkoInheritsClassRange = nextRange()
    expect(wkoInheritsClassRange.start).toEqual({ line: 5, column: 14 })
    expect(wkoInheritsClassRange.end).toEqual({ line: 5, column: 22 })

    const classRange = nextRange()
    expect(classRange.start).toEqual({ line: 7, column: 0 })
    expect(classRange.end).toEqual({ line: 7, column: 5 })

    const classInheritsSuperclassRange = nextRange()
    expect(classInheritsSuperclassRange.start).toEqual({ line: 7, column: 18 })
    expect(classInheritsSuperclassRange.end).toEqual({ line: 7, column: 26 })

    const constForUnnamedObjectRange = nextRange()
    expect(constForUnnamedObjectRange.start).toEqual({ line: 9, column: 0 })
    expect(constForUnnamedObjectRange.end).toEqual({ line: 9, column: 5 })

    const unnamedObjectRange = nextRange()
    expect(unnamedObjectRange.start).toEqual({ line: 9, column: 17 })
    expect(unnamedObjectRange.end).toEqual({ line: 9, column: 23 })

    const unnamedObjectInheritsSuperclassRange = nextRange()
    expect(unnamedObjectInheritsSuperclassRange.start).toEqual({ line: 9, column: 24 })
    expect(unnamedObjectInheritsSuperclassRange.end).toEqual({ line: 9, column: 32 })

    const overrideKeywordRange = nextRange()
    expect(overrideKeywordRange.start).toEqual({ line: 10, column: 2 })
    expect(overrideKeywordRange.end).toEqual({ line: 10, column: 10 })

    const overridenMethodInSubclassRange = nextRange()
    expect(overridenMethodInSubclassRange.start).toEqual({ line: 10, column: 11 })
    expect(overridenMethodInSubclassRange.end).toEqual({ line: 10, column: 17 })

    const supercallRange1 = nextRange()
    expect(supercallRange1.start).toEqual({ line: 11, column: 4 })
    expect(supercallRange1.end).toEqual({ line: 11, column: 9 })

    const supercallRange2 = nextRange()
    expect(supercallRange2.start).toEqual({ line: 12, column: 4 })
    expect(supercallRange2.end).toEqual({ line: 12, column: 9 })
  })

  test('highlights classes', () => {
    const keywordsTokens = processedByTokenType(processed, 'class')

    const nextRange = () => keywordsTokens.next().value.range

    const birdClassRange = nextRange()
    expect(birdClassRange.start).toEqual({ line: 0, column: 6 })
    expect(birdClassRange.end).toEqual({ line: 0, column: 10 })

    const birdAsSuperclassOfPepitaRange = nextRange()
    expect(birdAsSuperclassOfPepitaRange.start).toEqual({ line: 5, column: 23 })
    expect(birdAsSuperclassOfPepitaRange.end).toEqual({ line: 5, column: 27 })

    const mockingBirdClassRange = nextRange()
    expect(mockingBirdClassRange.start).toEqual({ line: 7, column: 6 })
    expect(mockingBirdClassRange.end).toEqual({ line: 7, column: 17 })

    const birdAsSuperclassOfMockingBirdRange = nextRange()
    expect(birdAsSuperclassOfMockingBirdRange.start).toEqual({ line: 7, column: 27 })
    expect(birdAsSuperclassOfMockingBirdRange.end).toEqual({ line: 7, column: 31 })

    const birdAsSuperclassOfUnnamedObjectRange = nextRange()
    expect(birdAsSuperclassOfUnnamedObjectRange.start).toEqual({ line: 9, column: 33 })
    expect(birdAsSuperclassOfUnnamedObjectRange.end).toEqual({ line: 9, column: 37 })
  })

  test('highlights wkos', () => {
    const keywordsTokens = processedByTokenType(processed, 'object')

    const nextRange = () => keywordsTokens.next().value.range

    const pepitaWKORange = nextRange()
    expect(pepitaWKORange.start).toEqual({ line: 5, column: 7 })
    expect(pepitaWKORange.end).toEqual({ line: 5, column: 13 })
  })

  test('highlights properties', () => {
    const keywordsTokens = processedByTokenType(processed, 'property')

    const nextRange = () => keywordsTokens.next().value.range

    const energyVarFromBirdRange = nextRange()
    expect(energyVarFromBirdRange.start).toEqual({ line: 1, column: 6 })
    expect(energyVarFromBirdRange.end).toEqual({ line: 1, column: 12 })

    const energyAsNamedParameterRange = nextRange()
    expect(energyAsNamedParameterRange.start).toEqual({ line: 5, column: 28 })
    expect(energyAsNamedParameterRange.end).toEqual({ line: 5, column: 34 })

    const energyAsNamedParameter2Range = nextRange()
    expect(energyAsNamedParameter2Range.start).toEqual({ line: 7, column: 32 })
    expect(energyAsNamedParameter2Range.end).toEqual({ line: 7, column: 38 })

    const energyAsNamedParameter3Range = nextRange()
    expect(energyAsNamedParameter3Range.start).toEqual({ line: 9, column: 38 })
    expect(energyAsNamedParameter3Range.end).toEqual({ line: 9, column: 44 })
  })

  test('highlights global variables', () => {
    const keywordsTokens = processedByTokenType(processed, 'variable')

    const nextRange = () => keywordsTokens.next().value.range

    const unnamedObjectConstRange = nextRange()
    expect(unnamedObjectConstRange.start).toEqual({ line: 9, column: 6 })
    expect(unnamedObjectConstRange.end).toEqual({ line: 9, column: 14 })
  })

  test('highlights numbers', () => {
    const keywordsTokens = processedByTokenType(processed, 'number')

    const nextRange = () => keywordsTokens.next().value.range

    const numberForVariableEnergyRange = nextRange()
    expect(numberForVariableEnergyRange.start).toEqual({ line: 1, column: 15 })
    expect(numberForVariableEnergyRange.end).toEqual({ line: 1, column: 17 })

    const numberForNamedArgumentInPepitaRange = nextRange()
    expect(numberForNamedArgumentInPepitaRange.start).toEqual({ line: 5, column: 37 })
    expect(numberForNamedArgumentInPepitaRange.end).toEqual({ line: 5, column: 40 })

    const numberForNamedArgumentInMockingBirdRange = nextRange()
    expect(numberForNamedArgumentInMockingBirdRange.start).toEqual({ line: 7, column: 41 })
    expect(numberForNamedArgumentInMockingBirdRange.end).toEqual({ line: 7, column: 44 })

    const numberForNamedArgumentInUnnamedObjectRange = nextRange()
    expect(numberForNamedArgumentInUnnamedObjectRange.start).toEqual({ line: 9, column: 47 })
    expect(numberForNamedArgumentInUnnamedObjectRange.end).toEqual({ line: 9, column: 49 })
  })

})