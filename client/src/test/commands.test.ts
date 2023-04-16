import * as assert from 'assert'
import * as sinon from 'sinon'
import { ShellExecution, Task, Uri } from 'vscode'
import { runAllTests, runProgram, runTests, startRepl } from '../commands'
import { activate, getDocumentURI, getFolderURI } from './helper'

suite('Should run commands', () => {
  const folderURI = getFolderURI()
  const pepitaURI = getDocumentURI('pepita.wlk')

  test('run program', async () => {
    await testCommand(pepitaURI, () => runProgram('file.program'), ` run 'file.program' --skipValidations -p ${folderURI.fsPath}`)
  })

  suite('run tests', () => {
    const testFQN = 'tests."tests de pepita"."something"'
    const testFQNWindows = 'tests.\\"tests de pepita\\".\\"something\\"'

    async function runCommandOnPlatform(platform: string, expectedCommand: string) {
      sinon.stub(process, 'platform').value(platform)
      await testCommand(pepitaURI, () => runTests(testFQN), ` test '${expectedCommand}' --skipValidations -p ${folderURI.fsPath}`)
      sinon.restore()
    }

    test('on Linux', () => runCommandOnPlatform('linux', testFQN))
    test('on Mac', () => runCommandOnPlatform('darwin', testFQN))
    test('on Windows', () => runCommandOnPlatform('win32', testFQNWindows))
  })

  test('run all tests', async () => {
    await testCommand(pepitaURI, runAllTests, ` test --skipValidations -p ${folderURI.fsPath}`)
  })

  test('repl on current file', async () => {
    await testCommand(pepitaURI, startRepl, ` repl ${pepitaURI.fsPath} -p ${folderURI.fsPath}`)
  })
})

async function testCommand(docUri: Uri, command: () => Task, expectedCommand: string) {
  await activate(docUri)
  const task = command()
  const execution = task.execution as ShellExecution
  assert.equal(execution.commandLine, expectedCommand)
}