import { WollokNodePlotter } from '../../highlighter/utils'
import { expect } from 'expect'
import { processedByTokenType, readFileForTokenProvider } from './utils'

suite('literals sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    processed = readFileForTokenProvider('src/test/highlighter/highlighter-samples/literalsSample.wlk')
  })

  test('highlights keywords', () => {
    const keywordsTokens = processedByTokenType(processed, 'keyword')

    const nextRange = () => keywordsTokens.next().value.range

    const classRange = nextRange()
    expect(classRange.start).toEqual({ line: 0, column: 0 })
    expect(classRange.end).toEqual({ line: 0, column: 5 })

    const var1Range = nextRange()
    expect(var1Range.start).toEqual({ line: 1, column: 2 })
    expect(var1Range.end).toEqual({ line: 1, column: 5 })

    const var2Range = nextRange()
    expect(var2Range.start).toEqual({ line: 2, column: 2 })
    expect(var2Range.end).toEqual({ line: 2, column: 5 })

    const const1Range = nextRange()
    expect(const1Range.start).toEqual({ line: 3, column: 2 })
    expect(const1Range.end).toEqual({ line: 3, column: 7 })

    const var3Range = nextRange()
    expect(var3Range.start).toEqual({ line: 4, column: 2 })
    expect(var3Range.end).toEqual({ line: 4, column: 5 })

    const const2Range = nextRange()
    expect(const2Range.start).toEqual({ line: 5, column: 2 })
    expect(const2Range.end).toEqual({ line: 5, column: 7 })

    const newRange = nextRange()
    expect(newRange.start).toEqual({ line: 5, column: 15 })
    expect(newRange.end).toEqual({ line: 5, column: 18 })

    const var4Range = nextRange()
    expect(var4Range.start).toEqual({ line: 6, column: 2 })
    expect(var4Range.end).toEqual({ line: 6, column: 5 })
  })

  test('highlights property names', () => {
    const propertyTokens = processedByTokenType(processed, 'property')

    const nextRange = () => propertyTokens.next().value.range

    const energyVarRange = nextRange()
    expect(energyVarRange.start).toEqual({ line: 1, column: 6 })
    expect(energyVarRange.end).toEqual({ line: 1, column: 12 })

    const bigEnergyVarRange = nextRange()
    expect(bigEnergyVarRange.start).toEqual({ line: 2, column: 6 })
    expect(bigEnergyVarRange.end).toEqual({ line: 2, column: 15 })

    const nombreConstRange = nextRange()
    expect(nombreConstRange.start).toEqual({ line: 3, column: 8 })
    expect(nombreConstRange.end).toEqual({ line: 3, column: 12 })

    const happyVarRange = nextRange()
    expect(happyVarRange.start).toEqual({ line: 4, column: 6 })
    expect(happyVarRange.end).toEqual({ line: 4, column: 11 })

    const bornConstRange = nextRange()
    expect(bornConstRange.start).toEqual({ line: 5, column: 8 })
    expect(bornConstRange.end).toEqual({ line: 5, column: 12 })

    const classInNewRange = nextRange()
    expect(classInNewRange.start).toEqual({ line: 5, column: 19 })
    expect(classInNewRange.end).toEqual({ line: 5, column: 23 })

    const closureVarRange = nextRange()
    expect(closureVarRange.start).toEqual({ line: 6, column: 6 })
    expect(closureVarRange.end).toEqual({ line: 6, column: 13 })
  })

  test('highlights class', () => {
    const classTokens = processedByTokenType(processed, 'class')

    const nextRange = () => classTokens.next().value.range

    const classRange = nextRange()
    expect(classRange.start).toEqual({ line: 0, column: 6 })
    expect(classRange.end).toEqual({ line: 0, column: 10 })
  })

  test('highlights numbers', () => {
    const numberTokens = processedByTokenType(processed, 'number')

    const nextRange = () => numberTokens.next().value.range

    const energyValueRange = nextRange()
    expect(energyValueRange.start).toEqual({ line: 1, column: 15 })
    expect(energyValueRange.end).toEqual({ line: 1, column: 18 })

    const bigEnergyValueRange = nextRange()
    expect(bigEnergyValueRange.start).toEqual({ line: 2, column: 18 })
    expect(bigEnergyValueRange.end).toEqual({ line: 2, column: 31 })

    const twoAsParameterRange = nextRange()
    expect(twoAsParameterRange.start).toEqual({ line: 6, column: 35 })
    expect(twoAsParameterRange.end).toEqual({ line: 6, column: 36 })
  })

  test('highlights strings', () => {
    const methodTokens = processedByTokenType(processed, 'string')

    const nextRange = () => methodTokens.next().value.range

    const nameValueRange = nextRange()
    expect(nameValueRange.start).toEqual({ line: 3, column: 15 })
    expect(nameValueRange.end).toEqual({ line: 3, column: 23 })
  })


  test('highlights boolean', () => {
    console.info(JSON.stringify(processed.filter(t => t.tokenType === 'enum')))
    const operatorTokens = processedByTokenType(processed, 'enum')

    const nextRange = () => operatorTokens.next().value.range

    const booleanRange = nextRange()
    expect(booleanRange.start).toEqual({ line: 4, column: 14 })
    expect(booleanRange.end).toEqual({ line: 4, column: 18 })
  })

  test('highlights parameter', () => {
    const variableTokens = processedByTokenType(processed, 'parameter')

    const nextRange = () => variableTokens.next().value.range

    const parameterInClosureDefinitionRange = nextRange()
    expect(parameterInClosureDefinitionRange.start).toEqual({ line: 6, column: 18 })
    expect(parameterInClosureDefinitionRange.end).toEqual({ line: 6, column: 23 })

    const parameterInClosureUseRange = nextRange()
    expect(parameterInClosureUseRange.start).toEqual({ line: 6, column: 27 })
    expect(parameterInClosureUseRange.end).toEqual({ line: 6, column: 32 })
  })

  test('highlights operator', () => {
    const operatorTokens = processedByTokenType(processed, 'operator')

    const nextRange = () => operatorTokens.next().value.range

    const lessThanOperatorRange = nextRange()
    expect(lessThanOperatorRange.start).toEqual({ line: 6, column: 33 })
    expect(lessThanOperatorRange.end).toEqual({ line: 6, column: 34 })
  })

})