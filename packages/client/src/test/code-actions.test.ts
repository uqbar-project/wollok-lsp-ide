import * as assert from 'assert'
import { commands, Range, Uri, CodeLens, CodeAction, Position, CodeActionKind, WorkspaceEdit } from 'vscode'
import { getDocumentURI, activate } from './helper'

suite('Should do code lenses', () => {
  const docUri = getDocumentURI('missingReference.wlk')

  test('Gets quick fixes for a missing reference', async () => {
    const quickfix = new CodeAction('Import from imported.wlk', CodeActionKind.QuickFix)
    quickfix.edit = new WorkspaceEdit()
    quickfix.edit.insert(docUri, new Position(0, 0), `import imported.obj\n`)
    quickfix.isPreferred = true
    await testCodeActions(
      docUri,
      new Range(new Position(3, 12), new Position(3, 15)),
      [quickfix]
    )
  })
})
async function testCodeActions(
  docUri: Uri,
  range: Range,
  expectedCodeActionList: CodeAction[],
) {
  await activate(docUri)
  docUri['_fsPath']  = docUri.fsPath
  const actualCodeActions = (await commands.executeCommand(
    'vscode.executeCodeActionProvider',
    docUri,
    range,
  )) as CodeLens[] | null

  assert.deepEqual(
    actualCodeActions,
    expectedCodeActionList,
    'Code actions mismatch',
  )
}
