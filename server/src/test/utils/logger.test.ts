import sinon from 'sinon'
import { logger } from '../../utils/logger'
import { expect } from 'expect'

let consoleInfoSpy: sinon.SinonStub

beforeEach(() => {
  consoleInfoSpy = sinon.stub(console, 'info')
})

afterEach(() => {
  sinon.restore()
})


it ('should log only a message to the console', async () => {
  logger.info({ message: 'an important message', timeElapsed: 200, ok: true })
  logger.info({ message: 'an important message', timeElapsed: 200, ok: true, private: true })
})
