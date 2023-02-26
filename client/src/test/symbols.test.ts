import * as assert from 'assert'
import { commands, SymbolKind, Uri } from 'vscode'
import { DocumentSymbol, WorkspaceSymbol } from 'vscode-languageclient'
import { activate, getDocumentURI } from './helper'

type SymbolData = {kind: SymbolKind, name: string}

suite('Should do symbols', () => {
  const docUri = getDocumentURI('pepita.wlk')

  test('Provides document symbols', async () => {
    await testDocumentSymbols(docUri, [
      { name: 'Pepita', kind: SymbolKind.Class },
      { name: 'a', kind: SymbolKind.Class },

    ])
  })

  test('Provides workspace symbols', async () => {
    await testWorkspaceSymbols(docUri, [
      { name: '"pepita is happy"', kind: SymbolKind.Event },
    ], 'pepita is hap')
  })
})

async function testWorkspaceSymbols(
  docUri: Uri,
  expectedSymbolList: SymbolData[],
  query: string
) {
  await activate(docUri)

  // Executing the command `executeDocumentSymbolProvider` to simulate triggering documnet symbols search
  const actualSymbolsList: WorkspaceSymbol[]=
    await commands.executeCommand(
      'vscode.executeWorkspaceSymbolProvider',
      query
    )

  symbolsEqual(expectedSymbolList, actualSymbolsList)
}

async function testDocumentSymbols(
  docUri: Uri,
  expectedSymbolList: SymbolData[],
) {
  await activate(docUri)

  // Executing the command `executeDocumentSymbolProvider` to simulate triggering documnet symbols search
  const actualSymbolsList: DocumentSymbol[] | WorkspaceSymbol[]=
    await commands.executeCommand(
      'vscode.executeDocumentSymbolProvider',
      docUri
    )

  symbolsEqual(expectedSymbolList, actualSymbolsList)
}


function symbolsEqual(expectedSymbolList: {kind: SymbolKind, name: string}[], actualSymbolsList: DocumentSymbol[] | WorkspaceSymbol[]) {
  assert.strictEqual(actualSymbolsList.length, expectedSymbolList.length)
  expectedSymbolList.forEach((expectedSymbol, i) => {
    const actualSymbol = actualSymbolsList[i]
    assert.strictEqual(actualSymbol.kind, expectedSymbol.kind, 'kind mismatch')
    assert.strictEqual(actualSymbol.name, expectedSymbol.name, 'name mismatch')
  })
}