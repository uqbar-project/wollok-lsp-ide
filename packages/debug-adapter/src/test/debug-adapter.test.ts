import * as path from 'path'
import { DebugClient } from '@vscode/debugadapter-testsupport'
import { DebugProtocol } from '@vscode/debugprotocol'
import { assert } from 'chai'
const DEBUG_ADAPTER = path.resolve(__dirname, 'start-debug-session.js')
const FIXTURES_ROOT = path.resolve(__dirname, '../../../../packages/debug-adapter/src/test/fixtures')
const PROGRAM = path.resolve(FIXTURES_ROOT, 'aProgram.wpgm')
const TEST_FILE = path.resolve(FIXTURES_ROOT, 'aTest.wtest')
const WLK = path.resolve(FIXTURES_ROOT, 'anObject.wlk')


describe('debug adapter', function () {
  let dc: DebugClient

  this.beforeEach( function () {
    dc = new DebugClient('node', DEBUG_ADAPTER, 'wollok', { stdio: 'pipe' }, true)
    return dc.start()
  })

  this.afterEach( function () { return dc.stop() })

  it('unknown request should produce error', function () {
    dc.send('illegal_request').then(() => assert.fail('Expected to throw an error'))
  })

  describe('launching', () => {
    it('starting a program without breakpoints should just execute said program', function (){
      return Promise.all([
        dc.launch({
          "stopOnEntry": false,
          "target": {
            "file": PROGRAM,
            "type": "program",
            "program": "aWollokProgram",
          },
        }),
        dc.configurationDoneRequest(),
        dc.waitForEvent('terminated', 3000),
      ])
    })

    it('starting a program with stopOnEntry option should stop on the first line', async function (){
      await Promise.all([
        dc.launch({
          "stopOnEntry": true,
          "target": {
            "file": PROGRAM,
            "type": "program",
            "program": "aWollokProgram",
          },
        }),
        dc.configurationDoneRequest(),
        dc.waitForEvent('stopped', 3000),
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
          "target": {
            "file": PROGRAM,
            type: "program",
            "program": "aWollokProgram",
          },
        },
        { line: 4, path: PROGRAM, column: 3, verified: true },
        { column: 3, path: PROGRAM, line: 4 },
        { column: 3, path: PROGRAM, line: 4, verified: true },
      )
    })

    it('in-line breakpoint locations', async () => {
      await Promise.all([
        dc.launch({
          "stopOnEntry": true,
          "target": {
            "file": PROGRAM,
            "type": "program",
            "program": "aWollokProgram",
          },
        }),
        dc.configurationDoneRequest(),
      ])

      const response = await dc.send('breakpointLocations', {
        source: { path: PROGRAM },
        line: 4,
      })

      const expectedBreakpoints = [
        { line: 4, column: 3, lineEnd: 4, columnEnd: 21 },
        { line: 4, column: 15, lineEnd: 4, columnEnd: 21 },
      ]

      assert.equal(response.body.breakpoints.length, expectedBreakpoints.length)
      for(const expected of expectedBreakpoints) {
        assert.deepInclude(response.body.breakpoints, expected)
      }
    })
  })

  describe('stopped at breakpoint', function () {
    this.beforeEach(function () {
      return dc.hitBreakpoint(
        {
          "stopOnEntry": false,
          "target": {
            "file": PROGRAM,
            "type": "program",
            "program": "aWollokProgram",
          },
        },
        { line: 5, path: WLK },
        { column: 5, line: 5, path: WLK },
        { column: 5, line: 5, path: WLK, verified: true },
      )
    })

    it('should respond stack trace for all frames', async function () {
      const { body } = await dc.stackTraceRequest({ threadId: 1 })
      testStackTrace([
        { line: 5, column: 5, sourceFile: WLK },
        { line: 5, column: 14, sourceFile: PROGRAM },
        { line: 3, column: 1, sourceFile: PROGRAM },
      ], body)
    })

    it('should respond with the scopes for a context', async function () {
      await dc.stackTraceRequest({ threadId: 1 })
      const { body: { scopes } } = await dc.scopesRequest({ frameId: 3 }) // first frame

      assert.equal(scopes.length, 3)

      assert.match(scopes[0].name, /.*pepita\.fly\(minutes\)/)
      assert.match(scopes[1].name, /.*anObject\.pepita/)
      assert.equal(scopes[2].name, 'root')
    })

    it('should respond the variables for a scope', async function () {
      await dc.stackTraceRequest({ threadId: 1 })
      const { body: { scopes } } = await dc.scopesRequest({ frameId: 3 }) // first frame
      const expectedVariables = [
        { scopeId: scopes[0].variablesReference, variables: ['minutes'] },
        { scopeId: scopes[1].variablesReference, variables: ['energy'] },
        { scopeId: scopes[2].variablesReference, variables: ['wollok.game.game'] },
      ]

      await Promise.all(expectedVariables.map(async ({ scopeId: variablesReference, variables: expectedVariables }) => {
        const { body: { variables: actualVariables } } = await dc.variablesRequest({
          variablesReference,
        })

        for(const expectedVariable of expectedVariables){
          assert(actualVariables.map(variable => variable.name).includes(expectedVariable))
        }
      }))
    })
  })

  describe.skip('finished execution', function (){
    it('finishing with errors', async function (){
      setTimeout(() => dc.configurationDoneRequest(), 100)
      await dc.launch({
        "stopOnEntry": false,
        "target": {
          "file": TEST_FILE,
          type: "test",
          "describe": "some tests",
          "test": "breaks",
        },
      })

      await Promise.all([
          dc.assertOutput('stderr', "My exception message", 3000),
          dc.waitForEvent('terminated', 2000),
      ])
    })

    it('finishing without errors', async function (){
      setTimeout(() => dc.configurationDoneRequest(), 100)
      await dc.launch({
      "stopOnEntry": false,
      "target": {
          "file": TEST_FILE,
          type: "test",
          "describe": "some tests",
          "test": "does not break",
        },
      })
      await Promise.all([
        dc.assertOutput('stdout', "Finished executing without errors", 3000),
        dc.waitForEvent('terminated', 2000),
      ])
    })
  })
})


function testStackTrace(expected: { line: number, column: number, sourceFile: string }[], actual: DebugProtocol.StackTraceResponse['body'] ){
  assert.equal(actual.totalFrames, expected.length, `expected ${expected.length} frames but got ${actual.totalFrames}`)
  for(let i = 0; i < expected.length; i++){
    assert.equal(actual.stackFrames[i].column, expected[i].column)
    assert.equal(actual.stackFrames[i].line, expected[i].line)
    assert.equal(actual.stackFrames[i].source?.path, expected[i].sourceFile)
  }
}