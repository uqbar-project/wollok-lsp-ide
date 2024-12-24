import { excludeNullish, parse } from 'wollok-ts'
import { readFileSync } from 'fs'
import { processCode } from '../../highlighter/tokenProvider'
import { WollokNodePlotter } from '../../highlighter/utils'
import { expect } from 'expect'

suite('an object sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    const filePath = 'src/test/highlighter/highlighter-samples/objectSample.wlk'
    const parsedFile = parse.File(filePath)
    const docText = readFileSync(filePath, { encoding: 'utf-8' })
    const tp = parsedFile.tryParse(docText)
    const splittedLines = docText.split('\n')
    processed = excludeNullish(processCode(tp.members[0], splittedLines))

  })

  test('highlights object keyword', () => {
    const keywordsTokens = processed.filter(token => token.tokenType === 'keyword')
    expect(keywordsTokens.length).toBe(8)

    const objectRange = keywordsTokens[0].range
    expect(objectRange.start).toEqual({ line: 0, column: 0 })
    expect(objectRange.end).toEqual({ line: 0, column: 6 })

    const varRange = keywordsTokens[1].range
    expect(varRange.start).toEqual({ line: 1, column: 2 })
    expect(varRange.end).toEqual({ line: 1, column: 5 })

    const constRange = keywordsTokens[2].range
    expect(constRange.start).toEqual({ line: 2, column: 2 })
    expect(constRange.end).toEqual({ line: 2, column: 7 })

    const methodFlyRange = keywordsTokens[3].range
    expect(methodFlyRange.start).toEqual({ line: 4, column: 2 })
    expect(methodFlyRange.end).toEqual({ line: 4, column: 8 })

    const equalRange = keywordsTokens[4].range
    expect(equalRange.start).toEqual({ line: 5, column: 11 })
    expect(equalRange.end).toEqual({ line: 5, column: 12 })

    const methodRealEnergyRange = keywordsTokens[5].range
    expect(methodRealEnergyRange.start).toEqual({ line: 8, column: 2 })
    expect(methodRealEnergyRange.end).toEqual({ line: 8, column: 8 })

    const selfRange = keywordsTokens[6].range
    expect(selfRange.start).toEqual({ line: 8, column: 33 })
    expect(selfRange.end).toEqual({ line: 8, column: 37 })

    const methodNameValueRange = keywordsTokens[7].range
    expect(methodNameValueRange.start).toEqual({ line: 9, column: 2 })
    expect(methodNameValueRange.end).toEqual({ line: 9, column: 8 })
  })

  test('highlights properties', () => {
    console.info(JSON.stringify(processed.filter(token => token.tokenType === 'property')))
    const propertyTokens = processed.filter(token => token.tokenType === 'property')
    expect(propertyTokens.length).toBe(7)
  })

})