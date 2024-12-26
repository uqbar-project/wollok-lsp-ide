import { excludeNullish, parse } from 'wollok-ts'
import { readFileSync } from 'fs'
import { processCode } from '../../highlighter/tokenProvider'
import { WollokNodePlotter } from '../../highlighter/utils'
import { expect } from 'expect'

const readFileForTokenProvider = (filePath: string) => {
  const parsedFile = parse.File(filePath)
  const docText = readFileSync(filePath, { encoding: 'utf-8' })
  const tp = parsedFile.tryParse(docText)
  const splittedLines = docText.split('\n')
  return excludeNullish(processCode(tp.members[0], splittedLines))
}

suite('an object sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    processed = readFileForTokenProvider('src/test/highlighter/highlighter-samples/objectSample.wlk')
  })

  test('highlights object keyword', () => {
    const keywordsTokens = processed.filter(token => token.tokenType === 'keyword').values()

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
    console.info(JSON.stringify(processed.filter(token => token.tokenType === 'property')))
    const propertyTokens = processed.filter(token => token.tokenType === 'property')
    expect(propertyTokens.length).toBe(6)
  })

})

suite('a class sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    processed = readFileForTokenProvider('src/test/highlighter/highlighter-samples/classSample.wlk')
  })

  test('highlights class keyword', () => {
    const keywordsTokens = processed.filter(token => token.tokenType === 'keyword').values()

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

  test('highlights properties', () => {
    const propertyTokens = processed.filter(token => token.tokenType === 'property')
    expect(propertyTokens.length).toBe(5)
  })

  test('highlights class name', () => {
    const classTokens = processed.filter(token => token.tokenType === 'class').values()

    const nextRange = () => classTokens.next().value.range

    const classRange = nextRange()
    expect(classRange.start).toEqual({ line: 0, column: 6 })
    expect(classRange.end).toEqual({ line: 0, column: 10 })
  })

  test('highlights property name', () => {
    console.info(JSON.stringify(processed.filter(token => token.tokenType === 'property')))
    const propertyTokens = processed.filter(token => token.tokenType === 'property').values()

    const nextRange = () => propertyTokens.next().value.range

    const energyDefinitionRange = nextRange()
    expect(energyDefinitionRange.start).toEqual({ line: 1, column: 6 })
    expect(energyDefinitionRange.end).toEqual({ line: 1, column: 12 })

    const birthdateDefinitionRange = nextRange()
    expect(birthdateDefinitionRange.start).toEqual({ line: 2, column: 15 })
    expect(birthdateDefinitionRange.end).toEqual({ line: 2, column: 24 })

    // ==> está duplicado!!!
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

})