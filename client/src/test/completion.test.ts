import * as assert from 'assert'
import {
  commands,
  CompletionItemKind,
  CompletionList,
  Position,
  Uri,
} from 'vscode'
import { getDocumentURI, activate } from './helper'

suite('Should do completion', () => {

  const fileSnippets = {
    items: [
      {
        label: "import",
        kind: CompletionItemKind.File,
      }, {
        label: "object",
        kind: CompletionItemKind.Module,
      }, {
        label: "class",
        kind: CompletionItemKind.Class,
      }, {
        label: "const attribute",
        kind: CompletionItemKind.Field,
      },
    ],
  }

  test('Completes Wollok definition file', async () => {
    await testCompletion(getDocumentURI('completion.wlk'), new Position(0, 0), fileSnippets)
  })

  test('Completes Wollok test file', async () => {
      await testCompletion(getDocumentURI('completionTest.wtest'), new Position(0, 0), { items: [
        {
          label:"import",
          kind: CompletionItemKind.File,
        }, {
          label:"object",
          kind: CompletionItemKind.Module,
        }, {
          label:"class",
          kind: CompletionItemKind.Class,
        }, {
          label: "const attribute",
          kind: CompletionItemKind.Field,
        }, {
          label: "describe",
          kind: CompletionItemKind.Folder,
        }, {
          label: "test",
          kind: CompletionItemKind.Event,
        },
      ],
    })
  })

  test('Completes Wollok program file', async () => {
      await testCompletion(getDocumentURI('completionProgram.wpgm'), new Position(0, 0), { items: [
        {
          label:"import",
          kind: CompletionItemKind.File,
        }, {
          label: "const attribute",
          kind: CompletionItemKind.Field,
        }, {
          label: "program",
          kind: CompletionItemKind.Unit,
        },
      ],
    })
  })

  test('Completes unparsed node', async () => {
    await testCompletion(getDocumentURI('completion.wlk'), new Position(2, 3), fileSnippets)
  })

})

async function testCompletion(
  docUri: Uri,
  position: Position,
  expectedCompletionList: CompletionList,
) {
  await activate(docUri)

  // Executing the command `executeCompletionItemProvider` to simulate triggering completion
  const wollokCompletionList = (await commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    docUri,
    position,
  )) as CompletionList

  assert.equal(
    expectedCompletionList.items.length,
    wollokCompletionList.items.length,
    JSON.stringify(wollokCompletionList),
  )
  expectedCompletionList.items.forEach((expectedItem, i) => {
    const actualItem = wollokCompletionList.items[i]
    assert.equal(actualItem.label, expectedItem.label)
    assert.equal(actualItem.kind, expectedItem.kind)
  })
}
