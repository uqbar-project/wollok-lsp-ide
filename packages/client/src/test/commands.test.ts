import * as assert from 'assert'
import { afterEach, beforeEach } from 'mocha'
import * as sinon from 'sinon'
import { ShellExecution, ShellQuotedString, ShellQuoting, Task, Uri, workspace } from 'vscode'
import { initProject, runAllTests, runProgram, runTest, startRepl } from '../commands'
import { activate, getDocumentURI, getFolderURI } from './helper'
import { DEFAULT_GAME_PORT, DEFAULT_REPL_PORT } from '../../../server/src/settings'

suite('Should run commands', () => {
  const folderURI = getFolderURI()
  const pepitaURI = getDocumentURI('pepita.wlk')

  const configuration = {
    gamePortNumber: DEFAULT_GAME_PORT,
    replPortNumber: DEFAULT_REPL_PORT,
    'cli-path': '/usr/bin/wollok-ts-cli',
    'dynamicDiagram.dynamicDiagramDarkMode': true,
    'dynamicDiagram.openDynamicDiagramOnRepl': true,
  }

  beforeEach(() => {
    sinon.stub(workspace, 'getConfiguration').value((_configuration: string) => ({
      get: (_value: string) => configuration[_value],
    }))
  })

  afterEach(() => {
    sinon.restore()
  })

  test('run program', () =>
    testCommand(
      pepitaURI,
      () => runProgram()('file.program'),
      [
        'run',
        quoted('file.program'),
        '--skipValidations',
        '-p',
        quoted(folderURI.fsPath),
      ],
    )
  )

  test('run game', () =>
    testCommand(
      pepitaURI,
      () => runProgram(true)('file.program'),
      [
        'run',
        '-g',
        '--port',
        DEFAULT_GAME_PORT.toString(),
        quoted('file.program'),
        '--skipValidations',
        '-p',
        quoted(folderURI.fsPath),
      ],
    )
  )

  test('runs tests', () => {
    const testArgs: [null, string, string, string] = [null, 'tests.wtest', 'tests de pepita', 'something']

    return testCommand(
      pepitaURI,
      () => runTest(testArgs),
      [
        'test',
        '-f',
        quoted('tests.wtest'),
        '-d',
        quoted('tests de pepita'),
        '-t',
        quoted('something'),
        '--skipValidations',
        '-p',
        quoted(folderURI.fsPath),
      ],
    )
  })

  test('run all tests', () =>
    testCommand(
      pepitaURI,
      runAllTests,
      [
        'test',
        '--skipValidations',
        '-p',
        quoted(folderURI.fsPath),
      ],
    )
  )

  test('repl on current file', () =>
    testCommand(
      pepitaURI,
      startRepl,
      [
        'repl',
        quoted(pepitaURI.fsPath),
        '--skipValidations',
        '--port',
        DEFAULT_REPL_PORT.toString(),
        '--darkMode',
        '', // do not open dynamic diagram
        '-p',
        quoted(folderURI.fsPath),
      ],
    )
  )

  test('create a new project in the workspace directory', () =>
    testCommand(
      pepitaURI,
      initProject,
      [
        'init',
        '-p',
        quoted(folderURI.fsPath),
      ],
    )
  )

  test('run verbose', () => {
    configuration['verbose'] = true
    return testCommand(
      pepitaURI,
      () => runProgram()('file.program'),
      [
        'run',
        quoted('file.program'),
        '--skipValidations',
        '--verbose',
        '-p',
        quoted(folderURI.fsPath),
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
  for (let i = 0; i < execution.args.length; i++) {
    assertCommandSegmentMatches(execution.args[i], expectedArgs[i])
  }
}


function assertCommandSegmentMatches(actual: string | ShellQuotedString, expected: string | ShellQuotedString) {
  assert.equal(typeof actual, typeof expected)
  if (typeof actual === 'string') {
    assert.equal(actual, expected)
  } else {
    assert.equal(actual.value, (expected as ShellQuotedString).value)
    assert.equal(actual.quoting, (expected as ShellQuotedString).quoting)
  }
}

function quoted(aString: string): ShellQuotedString {
  return { quoting: ShellQuoting.Strong, value: aString }
}