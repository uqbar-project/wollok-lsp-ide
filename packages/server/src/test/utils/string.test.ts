import { expect } from 'expect'
import { removeQuotes } from '../../utils/strings'

describe('string utils', () => {
  describe('removeQuotes', () => {
    it('should remove quotes from string', () => {
      expect(removeQuotes('"hello"')).toEqual('hello')
    })

    it('should not remove quotes from string if not at the beginning and end', () => {
      expect(removeQuotes('he"llo')).toEqual('he"llo')
    })
  })
})