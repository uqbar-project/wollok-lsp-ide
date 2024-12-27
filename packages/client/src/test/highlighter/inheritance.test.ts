import { WollokNodePlotter } from '../../highlighter/utils'
import { expect } from 'expect'
import { processedByTokenType, readFileForTokenProvider } from './utils'

suite('inheritance sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    processed = readFileForTokenProvider('src/test/highlighter/highlighter-samples/inheritanceSample.wlk')
  })

  test('highlights class keyword', () => {
    console.info(JSON.stringify(processed.filter(t => t.tokenType === 'keyword')))
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

})