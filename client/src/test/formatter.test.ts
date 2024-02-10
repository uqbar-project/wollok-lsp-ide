import * as assert from 'assert'
import { commands, Uri } from 'vscode'
import { activate, document, getDocumentURI } from './helper'
import * as os from 'os'

/** ATTENTION
 * These tests are NOT ATOMIC, they depend on each other, order matters. (Resolve TODO)
 * */
suite('Should format', () => {
  const formatterURI = getDocumentURI('formatter.wlk')
  const malformedMemberURI = getDocumentURI('malformedMember.wlk')
  //TODO: Restart server status after each test

  test('format document', async () => {
    await testFormat(formatterURI, `object pepita {${os.EOL}  var energia = 100${os.EOL}}`)
  })

  test('abort format on error', async () => {
    await activate(malformedMemberURI)
    const originalText = document.getText()

    await testFormat(malformedMemberURI, originalText)
  })
})

async function testFormat(uri: Uri, expected: string): Promise<void> {
  await activate(uri)
  await commands.executeCommand('editor.action.formatDocument')
  assert.equal(document.getText(), expected)
}