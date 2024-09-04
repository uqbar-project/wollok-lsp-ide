import * as assert from 'assert'
import * as sinon from 'sinon'
import { ShellExecution,ShellQuotedString, ShellQuoting, Task, Uri, env, workspace } from 'vscode'
import { runAllTests, runProgram, runTest, startRepl } from '../commands'
import { activate, getDocumentURI, getFolderURI } from './helper'
import { afterEach, beforeEach } from 'mocha'
import path = require('path')

suite('Should run commands', () => {
  const folderURI = getFolderURI()
  const pepitaURI = getDocumentURI('pepita.wlk')

  beforeEach(() => {
    sinon.stub(workspace, 'getConfiguration').value((_configuration: string) => ({
      get: (_value: string) => '/usr/bin/wollok-ts-cli',
    }))
  })

  afterEach(() => {
    sinon.restore()
  })

  test('run program', () => {
    return testCommand(
      pepitaURI,
      () => runProgram()(['file.program']),
      [
        'run',
        { quoting: ShellQuoting.Strong, value: 'file.program' },
        '--skipValidations',
        '-p',
        { quoting: ShellQuoting.Strong, value: folderURI.fsPath }
      ],
    )
  })

  test('run game', () => {
    return testCommand(
      pepitaURI,
      () => runProgram(true)(['file.program']),
      [ 
        'run', 
        '-g', 
        { quoting: ShellQuoting.Strong, value: 'file.program' },
        '--skipValidations',
        '-p',
        { quoting: ShellQuoting.Strong, value: folderURI.fsPath }
      ],
    )
  })

  test('runs tests', () => {

    const testArgs: [string, string, string, string] = [null, 'tests.wtest', 'tests de pepita', 'something']

    return testCommand(
      pepitaURI,
      () => runTest(testArgs),
      [
        'test', 
        '-f',
        { quoting: ShellQuoting.Strong, value: 'tests.wtest' },
        '-d',
        { quoting: ShellQuoting.Strong, value: 'tests de pepita' },
        '-t',
        { quoting: ShellQuoting.Strong, value: 'something' },
        '--skipValidations',
        '-p',
        { quoting: ShellQuoting.Strong, value:folderURI.fsPath }
      ],
    )
  })

  test('run all tests', () => {
    return testCommand(
      pepitaURI,
      runAllTests,
      [
        'test', 
        '--skipValidations',
        '-p',
        { quoting: ShellQuoting.Strong,value:folderURI.fsPath }
      ],
    )
  })

  test('repl on current file', () => {
      return testCommand(
        pepitaURI,
        startRepl,
        [
          'repl',
          { quoting: ShellQuoting.Strong,value:pepitaURI.fsPath },
          '--skipValidations',
          '--darkMode',
          '', // do not open dynamic diagram
          '-p',
          { quoting: ShellQuoting.Strong,value:folderURI.fsPath },
        ],
      )
  })
})

async function testCommand(
  docUri: Uri,
  command: () => Task,
  expectedArgs: Array<string | ShellQuotedString>
) {
  await activate(docUri)
  const task = command()
  const execution = task.execution as ShellExecution
  assert.equal(execution.args.length, expectedArgs.length, `Execution should have ${expectedArgs.length} arguments, but has ${execution.args.length}`)
  for(let i = 0; i < execution.args.length; i++){
    assertCommandSegmentMatches(execution.args[i], expectedArgs[i])
  }
}


function assertCommandSegmentMatches(actual: string | ShellQuotedString, expected: string | ShellQuotedString) {
  assert.equal(typeof actual, typeof expected)
  if(typeof actual === 'string'){
    assert.equal(actual, expected)
  } else {
    assert.equal(actual.value, (expected as ShellQuotedString).value)
    assert.equal(actual.quoting, (expected as ShellQuotedString).quoting)
  }
}