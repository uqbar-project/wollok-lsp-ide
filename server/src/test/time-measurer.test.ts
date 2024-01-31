import { expect } from 'expect'
import sinon from 'sinon'
import { TimeMeasurer } from '../time-measurer'
import { logger } from '../utils/logger'

describe('Time Measurer', () => {

  let clock: sinon.SinonFakeTimers
  let consoleInfoSpy: sinon.SinonStub

  beforeEach(async () => {
    clock = sinon.useFakeTimers()
    consoleInfoSpy = sinon.stub(logger, 'info')
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
    const firstConsoleArg = consoleInfoSpy.getCall(0).args[0]
    expect(firstConsoleArg.message).toEqual('⌛ process 1')
    expect(firstConsoleArg.timeElapsed).toEqual(200)
    const secondConsoleArg = consoleInfoSpy.getCall(1).args[0]
    expect(secondConsoleArg.message).toEqual('🕒 process 2')
    expect(secondConsoleArg.timeElapsed).toEqual(50)
  })

})