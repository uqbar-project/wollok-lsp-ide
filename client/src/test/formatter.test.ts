import * as assert from 'assert'
import { commands, Uri } from 'vscode'
import { getDocumentURI, activate, document } from './helper'

/** ATTENTION
 * These tests are NOT ATOMIC, they depend on each other, order matters. (Resolve TODO)
 * */
suite('Should format', () => {
  const formatterURI = getDocumentURI('formatter.wlk')

  //TODO: Restart server status after each test

  test('format document', async () => {
    await testFormat(formatterURI, `object pepita {\n  var energia = 100\n}`)
  })
})


async function testFormat(uri: Uri, expected: string): Promise<void> {
  await activate(uri)
  await commands.executeCommand('editor.action.formatDocument')
  assert.equal(document.getText(), expected)
}