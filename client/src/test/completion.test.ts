import * as assert from 'assert'
import { commands, CompletionItemKind, CompletionList, Position, Uri } from 'vscode'
import { getDocumentURI, activate } from './helper'

suite('Should do completion', () => {
  const docUri = getDocumentURI('completion.txt')

  test('Completes Wollok file', async () => {
    await testCompletion(docUri, new Position(0, 0), {
      items: [
        { label: 'class', kind: CompletionItemKind.Class },
        { label: 'describe', kind: CompletionItemKind.Event },
        { label: 'method (with effect)', kind: CompletionItemKind.Method },
        { label: 'method (without effect)', kind: CompletionItemKind.Method },
        { label: 'object', kind: CompletionItemKind.Text },
      ],
    })
  })
})

async function testCompletion(
  docUri: Uri,
  position: Position,
  expectedCompletionList: CompletionList
) {
  await activate(docUri)

  // Executing the command `executeCompletionItemProvider` to simulate triggering completion
  const actualCompletionList = (await commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    docUri,
    position
  )) as CompletionList

  assert.equal(expectedCompletionList.items.length, actualCompletionList.items.length)
  expectedCompletionList.items.forEach((expectedItem, i) => {
    const actualItem = actualCompletionList.items[i]
    assert.equal(actualItem.label, expectedItem.label)
    assert.equal(actualItem.kind, expectedItem.kind)
  })
}