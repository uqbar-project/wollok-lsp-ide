import * as assert from 'assert'
import * as sinon from 'sinon'
import { ShellExecution, Task, Uri, env, workspace } from 'vscode'
import { runAllTests, runProgram, runTest, startRepl } from '../commands'
import { activate, getDocumentURI, getFolderURI } from './helper'
import { toPosix, toWin, Shell } from '../platform-string-utils'
import { afterEach, beforeEach } from 'mocha'

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

  test('run program', async () => {
    await onWindowsBash(() =>
      testCommand(
        pepitaURI,
        () => runProgram()('file.program'),
        ` run 'file.program' --skipValidations -p ${expectedPathByShell(
          'bash',
          folderURI.fsPath,
        )}`,
      ),
    )
  })

  test('run game', async () => {
    await onWindowsBash(() =>
      testCommand(
        pepitaURI,
        () => runProgram(true)('file.program'),
        ` run -g 'file.program' --skipValidations -p ${expectedPathByShell(
          'bash',
          folderURI.fsPath,
        )}`,
      ),
    )
  })

  suite('run tests', () => {
    const SEP = '<SEP>'
    const testCommandOptions = `-f tests -d ${SEP}tests de pepita${SEP} -t ${SEP}something${SEP}`

    const testArgs: [string, string, string, string] = [null, 'tests', 'tests de pepita', 'something']

    async function runCommandOnPlatform(
      platform: string,
      shell: Shell,
      expectedCommand: string,
    ) {
      sinon.stub(process, 'platform').value(platform)
      sinon.stub(env, 'shell').value(shell)
      const separator = shell == 'cmd' ? '"' : '\''
      await testCommand(
        pepitaURI,
        () => runTest(testArgs),
        ` test ${expectedCommand.replace(new RegExp(SEP, 'g'), separator)} --skipValidations -p ${expectedPathByShell(
          shell,
          folderURI.fsPath,
        )}`,
      )
      sinon.restore()
    }

    test('on Linux', () => runCommandOnPlatform('linux', 'bash', testCommandOptions))
    test('on Mac', () => runCommandOnPlatform('darwin', 'bash', testCommandOptions))
    test('on Windows with Command', () => runCommandOnPlatform('win32', 'cmd', testCommandOptions))
    test('on Windows with Powershell', () => runCommandOnPlatform('win32', 'pwsh', testCommandOptions))
    test('on Windows with Bash', () =>
      runCommandOnPlatform('win32', 'bash', testCommandOptions))
  })

  test('run all tests', async () => {
    await onWindowsBash(() =>
      testCommand(
        pepitaURI,
        runAllTests,
        ` test --skipValidations -p ${expectedPathByShell(
          'bash',
          folderURI.fsPath,
        )}`,
      ),
    )
  })

  test('repl on current file', async () => {
    await onWindowsBash(() =>
      testCommand(
        pepitaURI,
        startRepl,
        ` repl ${toPosix(
          pepitaURI.fsPath,
        )} --skipValidations --darkMode -p ${expectedPathByShell(
          'bash',
          folderURI.fsPath,
        )}`,
      ),
    )
  })
})

async function testCommand(
  docUri: Uri,
  command: () => Task,
  expectedCommand: string,
) {
  await activate(docUri)
  const task = command()
  const execution = task.execution as ShellExecution
  assert.ok(execution.commandLine.endsWith(expectedCommand), `[NOT MATCH]: [${execution.commandLine}] vs. [${expectedCommand}]`)
}

function expectedPathByShell(cmd: Shell, originalPath: string) {
  if (['bash', 'zsh'].includes(cmd)) {
    return toPosix(originalPath)
  } else {
    return toWin(originalPath)
  }
}

async function onWindowsBash(test: () => Promise<any>) {
  sinon.stub(process, 'platform').value('win32')
  sinon.stub(env, 'shell').value('bash')
  await test()
  sinon.restore()
}
