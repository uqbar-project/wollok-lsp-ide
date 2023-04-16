import * as assert from 'assert'
import { ShellExecution, Task, Uri } from 'vscode'
import { startRepl } from '../commands'
import { activate, getDocumentURI, getFolderURI } from './helper'

suite('Should run commands', () => {
  const folderURI = getFolderURI()
  const pepitaURI = getDocumentURI('pepita.wlk')

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