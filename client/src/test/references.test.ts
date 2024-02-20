import * as assert from 'assert'
import { commands, Location, LocationLink, Position, Range, Uri } from 'vscode'
import { activate, getDocumentURI } from './helper'
import { beforeEach } from 'mocha'

/** ATTENTION
 * These tests are NOT ATOMIC, they depend on each other, order matters. (Resolve TODO)
 * */
suite('References', () => {
  let fileURI: Uri

  beforeEach(() => {
    fileURI = getDocumentURI('reference.wlk')
  })

  test('variable references', async () => {
      await testReferences(fileURI, new Position(13, 13), [
        new Location(fileURI, new Range(new Position(15, 22), new Position(15, 30))),
        new Location(fileURI, new Range(new Position(17, 23), new Position(17, 31))),
      ])
  })

  test('method references', async () => {
    await testReferences(fileURI, new Position(15, 13), [
      new Location(fileURI, new Range(new Position(4, 15), new Position(5, 2))),
      new Location(fileURI, new Range(new Position(25, 57), new Position(25, 76))),
    ])
  })

  test('method references when referencing singleton method', async () => {
    // alpiste.calorias() will never execute this method so it should not be a reference
    await testReferences(fileURI, new Position(21, 14), [
      new Location(fileURI, new Range(new Position(4, 15), new Position(5, 2))),
    ])
  })
})


async function testReferences(uri: Uri, at: Position, expected: Array<Location>): Promise<void> {
  await activate(uri)
  const result: Array<any> | null = await commands.executeCommand('vscode.executeReferenceProvider', uri, at)
  assert.deepEqual(result?.map(sanitizeUriFromLocation), expected.map(sanitizeUriFromLocation))
}

function sanitizeUriFromLocation(location: Location): object {
  return { ...location, uri: location.uri.path }
}