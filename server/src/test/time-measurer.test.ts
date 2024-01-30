import { expect } from 'expect'
import sinon from 'sinon'
import { TimeMeasurer } from '../time-measurer'
import { logger } from '../utils/logger'

describe('Time Measurer', () => {

  let clock: sinon.SinonFakeTimers
  let consoleLogSpy: sinon.SinonStub

  beforeEach(async () => {
    clock = sinon.useFakeTimers()
    consoleLogSpy = sinon.stub(logger, 'info')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('final report shows all intermediate times', () => {
    const timeMeasurer = new TimeMeasurer()
    clock.tick(200)
    timeMeasurer.addTime('process 1')
    clock.tick(50)
    timeMeasurer.addTime('process 2')
    timeMeasurer.finalReport()
    const firstMessage = consoleLogSpy.getCall(0).args[0].message
    expect(firstMessage).toEqual('⌛ process 1 | 200 ms')
    const secondMessage = consoleLogSpy.getCall(1).args[0].message
    expect(secondMessage).toEqual('🕒 process 2 | 50 ms')
  })

})