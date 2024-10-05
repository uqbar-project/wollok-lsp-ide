import * as assert from 'assert'
import { commands, Location, LocationLink, Position, Range, Uri } from 'vscode'
import { activate, getDocumentURI } from './helper'

/** ATTENTION
 * These tests are NOT ATOMIC, they depend on each other, order matters. (Resolve TODO)
 * */
suite('Should go to definitions', () => {

  test('go to method definition', async () => {
      const definitionURI = getDocumentURI('definition.wlk')
      await testDefinition(definitionURI, new Position(8, 8), [
        new Location(definitionURI, new Range(new Position(0, 0), new Position(4, 1))),
      ])
  })

  test ('can navigate to a property definition', async () => {
    const definitionURI = getDocumentURI('definition.wlk')
    await testDefinition(definitionURI, new Position(18, 29), [
      new Location(definitionURI, new Range(new Position(13, 1), new Position(13, 22))),
    ])
  })
})

async function testDefinition(uri: Uri, at: Position, expected: Array<Location | LocationLink>): Promise<void> {
  await activate(uri)
  const result = await commands.executeCommand('vscode.executeDefinitionProvider', uri, at)
  uri['_formatted'] = null
  assert.deepEqual(result, expected)
}