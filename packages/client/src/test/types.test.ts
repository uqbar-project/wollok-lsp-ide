import * as assert from 'assert'
import { commands, DocumentSymbol, Hover, MarkdownString, Position, Range } from 'vscode'
import { activate, getDocumentURI, setConfiguration } from './helper'
import { testHover } from './hover.test'

suite('Types', () => {

  setup(() => setConfiguration('typeSystem.enabled', true))

  teardown(() => setConfiguration('typeSystem.enabled', false))

  test('on symbols', async () => {
    const docUri = getDocumentURI('types.wlk')
    await activate(docUri)

    const actualSymbolsList: DocumentSymbol[] = await commands.executeCommand(
      'vscode.executeDocumentSymbolProvider',
      docUri,
    )

    assert.deepStrictEqual(
      actualSymbolsList.map(symbol => symbol.children?.map(s => s.name)),
      [['fly(minutes, food): (Any, Any) => Number']],
    )
  })

  test('on hover', async () => {
    await testHover(
      getDocumentURI('hover.wlk'),
      new Position(1, 8),
      new Hover(
        [
          new MarkdownString('\n```text\nField: Number\n```\n'),
          new MarkdownString('\n```wollok\nconst x = 2\n```\n'),
        ],
        new Range(new Position(1, 2), new Position(1, 13))
      )
    )
  })
})
