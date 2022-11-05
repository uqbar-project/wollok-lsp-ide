import { expect } from 'expect'
import { Environment } from 'wollok-ts'
import { between } from '../utils/text-documents'
import { buildPepitaEnvironment } from './utils/wollok-test-utils'

describe('text document utilities', () => {
  let pepitaEnvironment: Environment

  beforeEach(() => {
    pepitaEnvironment = buildPepitaEnvironment()
  })


  describe('between', () => {
    it('should return true when position is between start and end lines', () => {
      expect(between({ line: 2, character: 0 }, { line: 1, character: 0 }, { line: 3, character: 0 })).toBe(true)
    })

    it('should return false when position is outside start and end lines', () => {
      expect(between({ line: 5, character: 0 }, { line: 1, character: 0 }, { line: 3, character: 0 })).toBe(false)
    })

    it('should return true when position is on start line and after start character', () => {
      expect(between({ line: 1, character: 4 }, { line: 1, character: 2 }, { line: 4, character: 3 })).toBe(true)
    })

    it('should return false when position is on start line and after before character', () => {
      expect(between({ line: 1, character: 1 }, { line: 1, character: 2 }, { line: 4, character: 3 })).toBe(false)
    })

    it('should return true when position is on finish line and before end character', () => {
      expect(between({ line: 4, character: 1 }, { line: 1, character: 2 }, { line: 4, character: 3 })).toBe(true)
    })

    it('should return false when position is on end line and after end character', () => {
      expect(between({ line: 4, character: 4 }, { line: 1, character: 2 }, { line: 4, character: 3 })).toBe(false)
    })

    it('should return false when position is on both end and start line and position is outside of character range', () => {
      expect(between({ line: 4, character: 32 }, { line: 4, character: 8 }, { line: 4, character: 18 })).toBe(false)
    })

  })
})