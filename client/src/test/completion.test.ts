/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode'
import * as assert from 'assert'
import { getDocUri, activate } from './helper'

suite('Should do completion', () => {
  const docUri = getDocUri('completion.txt')

  test('Completes JS/TS in txt file', async () => {
    await testCompletion(docUri, new vscode.Position(0, 0), {
      items: [
        { label: 'class', kind: vscode.CompletionItemKind.Class },
        { label: 'describe', kind: vscode.CompletionItemKind.Event },
        { label: 'method (with effect)', kind: vscode.CompletionItemKind.Method },
        { label: 'method (without effect)', kind: vscode.CompletionItemKind.Method },
        { label: 'object', kind: vscode.CompletionItemKind.Module },
      ],
    })
  })
})

async function testCompletion(
  docUri: vscode.Uri,
  position: vscode.Position,
  expectedCompletionList: vscode.CompletionList
) {
  await activate(docUri)

  // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
  const actualCompletionList = (await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    docUri,
    position
  )) as vscode.CompletionList

  assert.equal(expectedCompletionList.items.length, actualCompletionList.items.length)
  expectedCompletionList.items.forEach((expectedItem, i) => {
    const actualItem = actualCompletionList.items[i]
    assert.equal(actualItem.label, expectedItem.label)
    assert.equal(actualItem.kind, expectedItem.kind)
  })
}