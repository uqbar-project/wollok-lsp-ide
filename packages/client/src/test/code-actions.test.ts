import * as assert from 'assert'
import { commands, Range, Uri, CodeLens, CodeAction, Position, CodeActionKind, WorkspaceEdit } from 'vscode'
import { getDocumentURI, activate } from './helper'

suite('Should do code actions', () => {
  const missingReferenceDoc = getDocumentURI('missingReference.wlk')
  const codeActionsDoc = getDocumentURI('codeActions.wlk')

  test('Gets quick fixes for missingReference', async () => {
    const quickfix = new CodeAction('Import from imported.wlk', CodeActionKind.QuickFix)
    quickfix.edit = new WorkspaceEdit()
    quickfix.edit.insert(missingReferenceDoc, new Position(0, 0), `import imported.obj\n`)
    quickfix.isPreferred = true
    await testCodeActions(
      missingReferenceDoc,
      new Range(new Position(2, 13), new Position(2, 13)),
      [quickfix]
    )
  })

  test('Gets quick fixes for shouldDefineConstInsteadOfVar', async () => {
    const quickfix = new CodeAction('Convert to const', CodeActionKind.QuickFix)
    quickfix.edit = new WorkspaceEdit()
    quickfix.edit.replace(codeActionsDoc, new Range(new Position(1, 2), new Position(1, 9)), `const bar`)
    quickfix.isPreferred = true
    await testCodeActions(
      codeActionsDoc,
      new Range(new Position(1, 8), new Position(1, 8)),
      [quickfix]
    )
  })

  test('Gets quick fixes for shouldNotReassignConst', async () => {
    const quickfix = new CodeAction('Convert quux to var', CodeActionKind.QuickFix)
    quickfix.edit = new WorkspaceEdit()
    quickfix.edit.replace(codeActionsDoc, new Range(new Position(8, 4), new Position(8, 18)), `var quux = 2`)
    quickfix.isPreferred = true
    await testCodeActions(
      codeActionsDoc,
      new Range(new Position(9, 7), new Position(9, 7)),
      [quickfix]
    )
  })
})
async function testCodeActions(
  docUri: Uri,
  triggerRange: Range,
  expectedCodeActionList: CodeAction[],
) {
  await activate(docUri)
  docUri['_fsPath']  = docUri.fsPath
  const actualCodeActions = (await commands.executeCommand(
    'vscode.executeCodeActionProvider',
    docUri,
    triggerRange,
  )) as CodeLens[] | null

  assert.deepEqual(
    actualCodeActions,
    expectedCodeActionList,
    'Code actions mismatch',
  )
}
