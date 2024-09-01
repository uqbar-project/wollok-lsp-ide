import * as path from 'path'
import { DebugClient } from '@vscode/debugadapter-testsupport'
import * as assert from 'node:assert'
import { DebugProtocol } from '@vscode/debugprotocol'

const DEBUG_ADAPTER = path.resolve('out/test/start-debug-session.js')
const FIXTURES_ROOT = path.resolve(__dirname, 'fixtures')
const PROGRAM = path.resolve(FIXTURES_ROOT, 'aProgram.wpgm')
const WLK = path.resolve(FIXTURES_ROOT, 'anObject.wlk')

describe('debug adapter', function () {
  let dc: DebugClient

  this.beforeEach( function () {
    dc = new DebugClient('node', DEBUG_ADAPTER, 'wollok')
    return dc.start()
  })

  this.afterEach( function () { return dc.stop() })

  it('unknown request should produce error', function () {
    return assert.rejects(dc.send('illegal_request'))
  })

  describe('launching', () => {
    it('starting a program without breakpoints should just execute said program', function (){
      return Promise.all([
        dc.launch({
          "stopOnEntry": false,
          "file": PROGRAM,
          "target": {
            "program": "aWollokProgram",
          },
        }),
        dc.configurationDoneRequest(),
        dc.waitForEvent('terminated', 1000),
      ])
    })

    it('starting a program with stopOnEntry option should stop on the first line', async function (){
      await Promise.all([
        dc.launch({
          "stopOnEntry": true,
          "file": PROGRAM,
          "target": {
            "program": "aWollokProgram",
          },
        }),
        dc.configurationDoneRequest(),
        dc.waitForEvent('stopped', 1000),
      ])


      const stoppedStackTrace = await dc.stackTraceRequest({
        threadId: 1,
      })

      assert.equal(stoppedStackTrace.body.totalFrames, 2)
      assert.equal(stoppedStackTrace.body.stackFrames[0].line, 4)
      assert.equal(stoppedStackTrace.body.stackFrames[0].column, 3)
    })

    it('setting a breakpoint, launching and stopping on it', function () {
      return dc.hitBreakpoint(
        {
          "stopOnEntry": false,
          "file": PROGRAM,
          "target": {
            "program": "aWollokProgram",
          },
        },
        { line: 4, path: PROGRAM, column: 3, verified: true },
        { column: 3, path: PROGRAM, line: 4 },
        { column: 3, path: PROGRAM, line: 4, verified: true },
      )
    })
  })

  describe('stopped display', function () {
    this.beforeEach(function () {
      return Promise.all([
        dc.launch({
          "stopOnEntry": true,
          "file": PROGRAM,
          "target": {
            "program": "aWollokProgram",
          },
        }),
        dc.configurationDoneRequest(),
        dc.waitForEvent('stopped', 1000),
      ])
    })

    it('stack trace', async function () {
      const { body } = await dc.stackTraceRequest({ threadId: 1 })
      testStackTrace([
        { line: 4, column: 3, sourceFile: PROGRAM },
        { line: 3, column: 1, sourceFile: PROGRAM },
      ], body)
    })
  })
})


function testStackTrace(expected: { line: number, column: number, sourceFile: string }[], actual: DebugProtocol.StackTraceResponse['body'] ){
  assert.equal(expected.length, actual.totalFrames, `expected ${expected.length} frames but got ${actual.totalFrames}`)
  for(let i = 0; i < expected.length; i++){
    assert.equal(expected[i].column, actual.stackFrames[i].column)
    assert.equal(expected[i].line, actual.stackFrames[i].line)
    assert.equal(expected[i].sourceFile, actual.stackFrames[i].source?.path)
  }
}