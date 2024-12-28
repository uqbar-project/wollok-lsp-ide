import { WollokNodePlotter } from '../../highlighter/utils'
import { expect } from 'expect'
import { processedByTokenType, readFileForTokenProvider } from './utils'

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

    const wkoRange = nextRange()
    expect(wkoRange.start).toEqual({ line: 4, column: 0 })
    expect(wkoRange.end).toEqual({ line: 4, column: 6 })

    const wkoInheritsClassRange = nextRange()
    expect(wkoInheritsClassRange.start).toEqual({ line: 4, column: 14 })
    expect(wkoInheritsClassRange.end).toEqual({ line: 4, column: 22 })

    const classRange = nextRange()
    expect(classRange.start).toEqual({ line: 6, column: 0 })
    expect(classRange.end).toEqual({ line: 6, column: 5 })

    const classInheritsSuperclassRange = nextRange()
    expect(classInheritsSuperclassRange.start).toEqual({ line: 6, column: 18 })
    expect(classInheritsSuperclassRange.end).toEqual({ line: 6, column: 26 })

    const constForUnnamedObjectRange = nextRange()
    expect(constForUnnamedObjectRange.start).toEqual({ line: 8, column: 0 })
    expect(constForUnnamedObjectRange.end).toEqual({ line: 8, column: 5 })

    const unnamedObjectRange = nextRange()
    expect(unnamedObjectRange.start).toEqual({ line: 8, column: 17 })
    expect(unnamedObjectRange.end).toEqual({ line: 8, column: 23 })

    const unnamedObjectInheritsSuperclassRange = nextRange()
    expect(unnamedObjectInheritsSuperclassRange.start).toEqual({ line: 8, column: 24 })
    expect(unnamedObjectInheritsSuperclassRange.end).toEqual({ line: 8, column: 32 })
  })

  test('highlights class names', () => {
    console.info(JSON.stringify(processed.filter(t => t.tokenType === 'class')))
    const keywordsTokens = processedByTokenType(processed, 'class')

    const nextRange = () => keywordsTokens.next().value.range

    const birdClassRange = nextRange()
    expect(birdClassRange.start).toEqual({ line: 0, column: 6 })
    expect(birdClassRange.end).toEqual({ line: 0, column: 10 })

    const birdAsSuperclassOfPepitaRange = nextRange()
    expect(birdAsSuperclassOfPepitaRange.start).toEqual({ line: 4, column: 23 })
    expect(birdAsSuperclassOfPepitaRange.end).toEqual({ line: 4, column: 27 })

    const mockingBirdClassRange = nextRange()
    expect(mockingBirdClassRange.start).toEqual({ line: 6, column: 6 })
    expect(mockingBirdClassRange.end).toEqual({ line: 6, column: 17 })

    const birdAsSuperclassOfMockingBirdRange = nextRange()
    expect(birdAsSuperclassOfMockingBirdRange.start).toEqual({ line: 6, column: 27 })
    expect(birdAsSuperclassOfMockingBirdRange.end).toEqual({ line: 6, column: 31 })

    const birdAsSuperclassOfUnnamedObjectRange = nextRange()
    expect(birdAsSuperclassOfUnnamedObjectRange.start).toEqual({ line: 8, column: 33 })
    expect(birdAsSuperclassOfUnnamedObjectRange.end).toEqual({ line: 8, column: 37 })
  })

  test('highlights wko names', () => {
    const keywordsTokens = processedByTokenType(processed, 'object')

    const nextRange = () => keywordsTokens.next().value.range

    const pepitaWKORange = nextRange()
    expect(pepitaWKORange.start).toEqual({ line: 4, column: 7 })
    expect(pepitaWKORange.end).toEqual({ line: 4, column: 13 })
  })

  test('highlights properties', () => {
    const keywordsTokens = processedByTokenType(processed, 'property')

    const nextRange = () => keywordsTokens.next().value.range

    const energyVarFromBirdRange = nextRange()
    expect(energyVarFromBirdRange.start).toEqual({ line: 1, column: 6 })
    expect(energyVarFromBirdRange.end).toEqual({ line: 1, column: 12 })
  })

  test('highlights variables', () => {
    const keywordsTokens = processedByTokenType(processed, 'variable')

    const nextRange = () => keywordsTokens.next().value.range

    const unnamedObjectConstRange = nextRange()
    expect(unnamedObjectConstRange.start).toEqual({ line: 8, column: 6 })
    expect(unnamedObjectConstRange.end).toEqual({ line: 8, column: 14 })
  })

  test('highlights numbers', () => {
    const keywordsTokens = processedByTokenType(processed, 'number')

    const nextRange = () => keywordsTokens.next().value.range

    const numberForVariableEnergyRange = nextRange()
    expect(numberForVariableEnergyRange.start).toEqual({ line: 1, column: 15 })
    expect(numberForVariableEnergyRange.end).toEqual({ line: 1, column: 17 })

    const numberForNamedArgumentInPepitaRange = nextRange()
    expect(numberForNamedArgumentInPepitaRange.start).toEqual({ line: 4, column: 37 })
    expect(numberForNamedArgumentInPepitaRange.end).toEqual({ line: 4, column: 40 })

    const numberForNamedArgumentInMockingBirdRange = nextRange()
    expect(numberForNamedArgumentInMockingBirdRange.start).toEqual({ line: 6, column: 41 })
    expect(numberForNamedArgumentInMockingBirdRange.end).toEqual({ line: 6, column: 44 })

    const numberForNamedArgumentInUnnamedObjectRange = nextRange()
    expect(numberForNamedArgumentInUnnamedObjectRange.start).toEqual({ line: 8, column: 47 })
    expect(numberForNamedArgumentInUnnamedObjectRange.end).toEqual({ line: 8, column: 49 })
  })

})