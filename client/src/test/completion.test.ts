import * as assert from 'assert'
import {
  commands,
  CompletionItemKind,
  CompletionList,
  Uri,
  Position,
  TextEdit,
  Range,
} from 'vscode'
import { getDocumentURI, activate } from './helper'

suite('Should do completion', () => {

  const fileSnippets = {
    items: [
      {
        label: "import",
        kind: CompletionItemKind.File,
      }, {
        label: "const attribute",
        kind: CompletionItemKind.Field,
      }, {
        label: "object",
        kind: CompletionItemKind.Module,
      }, {
        label: "class",
        kind: CompletionItemKind.Class,
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
          label: "const attribute",
          kind: CompletionItemKind.Field,
        }, {
          label:"object",
          kind: CompletionItemKind.Module,
        }, {
          label:"class",
          kind: CompletionItemKind.Class,
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

  test('Completes and imports', async () => {
    await testCompletion(getDocumentURI('manolo.wlk'), new Position(4, 6), { items: [
        {
          label: "Pepita",
          kind: CompletionItemKind.Class,
          additionalTextEdits: [
            new TextEdit(new Range(new Position(0, 0), new Position(0, 0)), "import pepita.*\n"),
          ],
        },
      ],
    }, 'Pepita')
  })

})

async function testCompletion(
  docUri: Uri,
  position: Position,
  expectedCompletionList: CompletionList,
  filterByLabel?: string,
) {
  await activate(docUri)

  // Executing the command `executeCompletionItemProvider` to simulate triggering completion
  const wollokCompletionList = (await commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    docUri,
    position
  )) as CompletionList

  if(filterByLabel) {
    wollokCompletionList.items = wollokCompletionList.items.filter((item) => item.label === filterByLabel)
  }

  assert.equal(
    expectedCompletionList.items.length,
    wollokCompletionList.items.length,
    JSON.stringify(wollokCompletionList),
  )
  expectedCompletionList.items.forEach((expectedItem, i) => {
    const actualItem = wollokCompletionList.items[i]
    assert.deepEqual(actualItem.additionalTextEdits?.map(edit => edit.newText), expectedItem.additionalTextEdits?.map(edit => edit.newText))
    assert.equal(actualItem.label, expectedItem.label)
    assert.equal(actualItem.kind, expectedItem.kind)
  })
}
