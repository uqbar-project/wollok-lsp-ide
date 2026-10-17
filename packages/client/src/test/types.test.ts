import * as assert from 'assert'
import { commands, DocumentSymbol } from 'vscode'
import { activate, getDocumentURI, setConfiguration } from './helper'

suite('Types', () => {
  const docUri = getDocumentURI('types.wlk')

  teardown(() => setConfiguration('typeSystem.enabled', false))


  test('on symbols', async () => {
    await setConfiguration('typeSystem.enabled', true)
    await activate(docUri, 8000)

    const actualSymbolsList: DocumentSymbol[] = await commands.executeCommand(
      'vscode.executeDocumentSymbolProvider',
      docUri,
    )

    assert.deepStrictEqual(
      actualSymbolsList.map(symbol => symbol.children?.map(s => s.name)),
      [['fly(minutes, food): (Any, Any) => Number']],
    )
  })
})
