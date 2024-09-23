import { expect } from 'expect'
import { consoleFormat, ignorePrivate, removePrivate } from '../utils/logger'
import { format } from 'winston'

describe('logger format tests', () => {

  describe('format for console', () => {

    it('takes by default message value', () => {
      const info = { level: 'info', message: 'hello', value: 2, ok: true }
      consoleFormat.transform(info)
      expect(getMessage(info)).toEqual('hello')
    })

    it('also logs elapsed time if present', () => {
      const info = { level: 'info', message: 'hello', value: 2, ok: true, timeElapsed: 25 }
      consoleFormat.transform(info)
      expect(getMessage(info)).toEqual('hello | 25 ms')
    })

  })

  describe('ignore private', () => {

    it('passes the original info if it is not private', () => {
      const info = { level: 'info', message: 'hello', value: 2, ok: true }
      expect(getIgnorePrivate(info)).toEqual(info)
    })

    it('returns false if info is private', () => {
      const info = { level: 'info', message: 'hello', value: 2, ok: true, timeElapsed: 25, private: true }
      expect(getIgnorePrivate(info)).toEqual(false)
    })

  })

  describe('remove private', () => {

    it('removes private attribute', () => {
      const info = { level: 'info', message: 'hello', value: 2, ok: true }
      const originalInfo = { ...info }
      expect(getRemovePrivate({
        ...info,
        private: true,
      })).toEqual(originalInfo)
    })

  })

})

const getMessage = (info: any): string => {
  const [symMessage] = Object.getOwnPropertySymbols(info)
  return info[symMessage]
}

const getIgnorePrivate = (info: any) => format.combine(ignorePrivate(info)).transform(info)

const getRemovePrivate = (info: any) => format.combine(removePrivate(info)).transform(info)