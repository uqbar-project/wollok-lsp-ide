import { expect } from 'expect'
import { processedByTokenType, readFileForTokenProvider } from './utils'
import { WollokNodePlotter } from '../../highlighter/definitions'

suite('comments & annotations sample', () => {

  let processed: WollokNodePlotter[]

  setup(() => {
    processed = readFileForTokenProvider('src/test/highlighter/highlighter-samples/commentsAndAnnotationsSample.wlk')
  })

  test('highlights keywords', () => {
    const keywordsTokens = processedByTokenType(processed, 'keyword')

    const nextRange = () => keywordsTokens.next().value.range

    const wkoRange = nextRange()
    expect(wkoRange.start).toEqual({ line: 0, column: 0 })
    expect(wkoRange.end).toEqual({ line: 0, column: 6 })

    const methodInWkoRange = nextRange()
    expect(methodInWkoRange.start).toEqual({ line: 2, column: 2 })
    expect(methodInWkoRange.end).toEqual({ line: 2, column: 8 })

    const classRange = nextRange()
    expect(classRange.start).toEqual({ line: 10, column: 0 })
    expect(classRange.end).toEqual({ line: 10, column: 5 })

    const overrideInMethodRange = nextRange()
    expect(overrideInMethodRange.start).toEqual({ line: 12, column: 2 })
    expect(overrideInMethodRange.end).toEqual({ line: 12, column: 10 })

    const methodInClassRange = nextRange()
    expect(methodInClassRange.start).toEqual({ line: 12, column: 11 })
    expect(methodInClassRange.end).toEqual({ line: 12, column: 17 })

    const nativeInMethodRange = nextRange()
    expect(nativeInMethodRange.start).toEqual({ line: 12, column: 53 })
    expect(nativeInMethodRange.end).toEqual({ line: 12, column: 59 })
  })

  test('highlights objects', () => {
    const objectTokens = processedByTokenType(processed, 'object')

    const nextRange = () => objectTokens.next().value.range

    const wkoRange = nextRange()
    expect(wkoRange.start).toEqual({ line: 0, column: 7 })
    expect(wkoRange.end).toEqual({ line: 0, column: 13 })
  })

  test('highlights classes', () => {
    const classTokens = processedByTokenType(processed, 'class')

    const nextRange = () => classTokens.next().value.range

    const classRange = nextRange()
    expect(classRange.start).toEqual({ line: 10, column: 6 })
    expect(classRange.end).toEqual({ line: 10, column: 10 })
  })

  test('highlights methods', () => {
    const methodTokens = processedByTokenType(processed, 'method')

    const nextRange = () => methodTokens.next().value.range

    const methodInWkoRange = nextRange()
    expect(methodInWkoRange.start).toEqual({ line: 2, column: 9 })
    expect(methodInWkoRange.end).toEqual({ line: 2, column: 18 })

    const methodInClassRange = nextRange()
    expect(methodInClassRange.start).toEqual({ line: 12, column: 18 })
    expect(methodInClassRange.end).toEqual({ line: 12, column: 21 })
  })

  test('highlights comments', () => {
    const parameterTokens = processedByTokenType(processed, 'comment')

    const nextRange = () => parameterTokens.next().value.range

    const commentSingleLineRange = nextRange()
    expect(commentSingleLineRange.start).toEqual({ line: 3, column: 4 })
    expect(commentSingleLineRange.end).toEqual({ line: 3, column: 19 })

    const multilineComment1_1Range = nextRange()
    expect(multilineComment1_1Range.start).toEqual({ line: 7, column: 0 })
    expect(multilineComment1_1Range.end).toEqual({ line: 7, column: 2 })

    const multilineComment1_2Range = nextRange()
    expect(multilineComment1_2Range.start).toEqual({ line: 8, column: 0 })
    expect(multilineComment1_2Range.end).toEqual({ line: 8, column: 13 })

    const multilineComment1_3Range = nextRange()
    expect(multilineComment1_3Range.start).toEqual({ line: 9, column: 0 })
    expect(multilineComment1_3Range.end).toEqual({ line: 9, column: 2 })

    const multilineComment2_1Range = nextRange()
    expect(multilineComment2_1Range.start).toEqual({ line: 15, column: 0 })
    expect(multilineComment2_1Range.end).toEqual({ line: 15, column: 2 })

    const multilineComment2_2Range = nextRange()
    expect(multilineComment2_2Range.start).toEqual({ line: 16, column: 0 })
    expect(multilineComment2_2Range.end).toEqual({ line: 16, column: 15 })

    const multilineComment2_3Range = nextRange()
    expect(multilineComment2_3Range.start).toEqual({ line: 17, column: 0 })
    expect(multilineComment2_3Range.end).toEqual({ line: 17, column: 2 })
  })

  test('highlights annotations', () => {
    const parameterTokens = processedByTokenType(processed, 'decorator')

    const nextRange = () => parameterTokens.next().value.range

    const notExpectDecoratorRange = nextRange()
    expect(notExpectDecoratorRange.start).toEqual({ line: 1, column: 2 })
    expect(notExpectDecoratorRange.end).toEqual({ line: 1, column: 12 })

    const methodTypeDecoratorRange = nextRange()
    expect(methodTypeDecoratorRange.start).toEqual({ line: 11, column: 2 })
    expect(methodTypeDecoratorRange.end).toEqual({ line: 11, column: 7 })

    const parameterTypeDecoratorRange = nextRange()
    expect(parameterTypeDecoratorRange.start).toEqual({ line: 12, column: 22 })
    expect(parameterTypeDecoratorRange.end).toEqual({ line: 12, column: 27 })
  })

})
