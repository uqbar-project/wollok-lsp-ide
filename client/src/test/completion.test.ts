import * as assert from 'assert'
import { commands, CompletionItemKind, CompletionList, Position, Uri } from 'vscode'
import { getDocumentURI, activate } from './helper'

const WOLLOK_AUTOCOMPLETE = 'wollok_autocomplete'

suite('Should do completion', () => {
  const docUri = getDocumentURI('completion.wlk')
  const fileCompletion = {
    items: [
      { label: 'class', kind: CompletionItemKind.Class },
      { label: 'describe', kind: CompletionItemKind.Event },
      { label: 'method (with effect)', kind: CompletionItemKind.Method },
      { label: 'method (without effect)', kind: CompletionItemKind.Method },
      { label: 'object', kind: CompletionItemKind.Text },
      { label: 'test', kind: CompletionItemKind.Event },
    ],
  }

  test('Completes Wollok file', async () => {
    await testCompletion(docUri, new Position(0, 0), fileCompletion)
  })

  test('Completes unparsed node', async () => {
    await testCompletion(docUri, new Position(2, 3), fileCompletion)
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

  const wollokCompletionList = actualCompletionList.items.filter(completionElement => completionElement.detail === WOLLOK_AUTOCOMPLETE)
  assert.equal(expectedCompletionList.items.length, wollokCompletionList.length, JSON.stringify(actualCompletionList))
  expectedCompletionList.items.forEach((expectedItem, i) => {
    const actualItem = wollokCompletionList[i]
    assert.equal(actualItem.label, expectedItem.label)
    assert.equal(actualItem.kind, expectedItem.kind)
  })
}