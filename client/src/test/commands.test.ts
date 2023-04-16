import * as assert from 'assert'
import { ShellExecution, Task, Uri } from 'vscode'
import { runAllTests, runProgram, runTests, startRepl } from '../commands'
import { activate, getDocumentURI, getFolderURI } from './helper'

suite('Should run commands', () => {
  const folderURI = getFolderURI()
  const pepitaURI = getDocumentURI('pepita.wlk')

  test('run program', async () => {
    await testCommand(pepitaURI, () => runProgram('file.program'), ` run 'file.program' --skipValidations -p ${folderURI.fsPath}`)
  })

  test('run tests', async () => {
    await testCommand(pepitaURI, () => runTests('tests."tests de pepita"."something"'), ` test 'tests.\\"tests de pepita\\".\\"something\\"' --skipValidations -p ${folderURI.fsPath}`)
  })

  test('run all tests', async () => {
    await testCommand(pepitaURI, runAllTests, ` test -p ${folderURI.fsPath} --skipValidations`)
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