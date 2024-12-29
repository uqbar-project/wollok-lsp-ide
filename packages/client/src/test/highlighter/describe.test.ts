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
  })

  test('highlights property names', () => {
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

  // test('highlights properties', () => {
  //   const keywordsTokens = processedByTokenType(processed, 'property')

  //   const nextRange = () => keywordsTokens.next().value.range

  //   const energyVarFromBirdRange = nextRange()
  //   expect(energyVarFromBirdRange.start).toEqual({ line: 1, column: 6 })
  //   expect(energyVarFromBirdRange.end).toEqual({ line: 1, column: 12 })
  // })

  // test('highlights variables', () => {
  //   const keywordsTokens = processedByTokenType(processed, 'variable')

  //   const nextRange = () => keywordsTokens.next().value.range

  //   const unnamedObjectConstRange = nextRange()
  //   expect(unnamedObjectConstRange.start).toEqual({ line: 8, column: 6 })
  //   expect(unnamedObjectConstRange.end).toEqual({ line: 8, column: 14 })
  // })

  // test('highlights numbers', () => {
  //   const keywordsTokens = processedByTokenType(processed, 'number')

  //   const nextRange = () => keywordsTokens.next().value.range

  //   const numberForVariableEnergyRange = nextRange()
  //   expect(numberForVariableEnergyRange.start).toEqual({ line: 1, column: 15 })
  //   expect(numberForVariableEnergyRange.end).toEqual({ line: 1, column: 17 })

  //   const numberForNamedArgumentInPepitaRange = nextRange()
  //   expect(numberForNamedArgumentInPepitaRange.start).toEqual({ line: 4, column: 37 })
  //   expect(numberForNamedArgumentInPepitaRange.end).toEqual({ line: 4, column: 40 })

  //   const numberForNamedArgumentInMockingBirdRange = nextRange()
  //   expect(numberForNamedArgumentInMockingBirdRange.start).toEqual({ line: 6, column: 41 })
  //   expect(numberForNamedArgumentInMockingBirdRange.end).toEqual({ line: 6, column: 44 })

  //   const numberForNamedArgumentInUnnamedObjectRange = nextRange()
  //   expect(numberForNamedArgumentInUnnamedObjectRange.start).toEqual({ line: 8, column: 47 })
  //   expect(numberForNamedArgumentInUnnamedObjectRange.end).toEqual({ line: 8, column: 49 })
  // })

})