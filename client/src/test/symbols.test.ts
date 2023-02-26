import * as assert from 'assert'
import { commands, CompletionList, DocumentSymbol, Uri } from 'vscode'
import { activate, getDocumentURI } from './helper'


suite('Should do completion', () => {
  const docUri = getDocumentURI('pepita.wlk')

  test('Provides document symbols', async () => {
    await testSymbols(docUri, [])
  })
})

async function testSymbols(
  docUri: Uri,
  expectedCompletionList: Array<DocumentSymbol>
) {
  await activate(docUri)

  // Executing the command `executeDocumentSymbolProvider` to simulate triggering documnet symbols search
  const actualSymbolsList = (await commands.executeCommand(
    'vscode.executeDocumentSymbolProvider',
    docUri
  )) as CompletionList

  assert.equal(actualSymbolsList.items.length, expectedCompletionList.length)
}