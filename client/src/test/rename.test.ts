import * as assert from 'assert'
import { commands, Uri, Range, Position, WorkspaceEdit } from 'vscode'
import { activate, getDocumentURI } from './helper'
import { PrepareRenameResult } from 'vscode-languageclient'

suite('Should do renames', () => {
  const docUri = getDocumentURI('rename.wlk')

  test('Prepare renaming', async () => {
    await testPrepareRename(
      docUri,
      new Position(3, 18),
      { range: new Range(new Position(3, 15), new Position(3, 21)), placeholder: 'comida' },
    )
  })

  test('Renaming', async () => {
    const edition = new WorkspaceEdit()
    edition.replace(docUri, new Range(new Position(3, 15), new Position(3, 21)), 'unaComida')
    edition.replace(docUri, new Range(new Position(4, 24), new Position(4, 30)), 'unaComida')

    await testRename(
      docUri,
      { position: new Position(3, 18), newName: 'unaComida' },
      edition
    )
  })
})

async function testPrepareRename(
  docUri: Uri,
  query: Position,
  expected: PrepareRenameResult,
) {
  await activate(docUri)

  const result: PrepareRenameResult = await commands.executeCommand(
    'vscode.prepareRename',
    docUri,
    query,
  )

  assert.deepEqual(
    result,
    expected
  )
}

async function testRename(
  docUri: Uri,
  { position, newName }: {position: Position, newName: string},
  expected: WorkspaceEdit,
) {
  await activate(docUri)

  // hack, for some reason _fsPath is not set but is returned by command
  docUri['_fsPath'] = docUri.fsPath
  const result: WorkspaceEdit = await commands.executeCommand(
    'vscode.executeDocumentRenameProvider',
    docUri,
    position,
    newName
  )

  assert.deepEqual(result, expected)
}