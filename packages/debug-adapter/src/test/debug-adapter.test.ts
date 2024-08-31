import * as path from 'path'
import { DebugClient } from '@vscode/debugadapter-testsupport'
import * as assert from 'node:assert'
const DEBUG_ADAPTER = path.resolve('out/test/start-debug-session.js')

const FIXTURES_ROOT = path.resolve(__dirname, 'fixtures')
const PROGRAM = path.resolve(FIXTURES_ROOT, 'aProgram.wpgm')

let dc: DebugClient

before( function () {
  dc = new DebugClient('node', DEBUG_ADAPTER, 'wollok')
  return dc.start()
})

after( function () { return dc.stop() })

it('unknown request should produce error', function () {
  return assert.rejects(dc.send('illegal_request'))
})

describe('breakpoint', () => {
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
      dc.waitForEvent('terminated', 400),
    ])
  })
})
