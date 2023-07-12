import * as assert from 'assert'
import { commands, Range, Uri } from 'vscode'
import { CodeLens } from 'vscode-languageclient'
import { getDocumentURI, activate } from './helper'

type PositionJSON = {
  /**
   * Line
   */
  c: number
  /**
   * Character
   */
  e: number
}
type CodeLensJSON = Omit<CodeLens, 'range'> & {
  range: { c: PositionJSON; e: PositionJSON }
}
type CodeLensLSPAnswer = CodeLensJSON[] | null

suite('Should do code lenses', () => {
  const docUri = getDocumentURI('test.wtest')

  test('Shows test code lenses for Wollok Test file', async () => {
    await testCodeLenses(docUri, [
      {
        range: {
          c: {
            e: 0,
            c: 0,
          },
          e: {
            e: 0,
            c: 0,
          },
        },
        command: {
          title: 'Run all tests',
          command: 'wollok.run.tests',
          arguments: ['test'],
        },
      },
      {
        range: {
          c: {
            c: 0,
            e: 0,
          },
          e: {
            c: 4,
            e: 1,
          },
        },
        command: {
          title: 'Run describe',
          command: 'wollok.run.tests',
          arguments: ['test."pepita test"'],
        },
      },
      {
        range: {
          c: {
            c: 1,
            e: 4,
          },
          e: {
            c: 4,
            e: 0,
          },
        },
        command: {
          title: 'Run test',
          command: 'wollok.run.tests',
          arguments: ['test."pepita test"."pepita is happy"'],
        },
      },
    ])
  })
  test('Shows no code lenses for Wollok file', async () => {
    await testCodeLenses(getDocumentURI('pepita.wlk'), [])
  })
})

async function testCodeLenses(
  docUri: Uri,
  expectedCodeLensesList: CodeLensLSPAnswer,
) {
  await activate(docUri)

  // Executing the command `vscode.executeCodeLensProvider` to simulate triggering code lenses
  const actualCodeLensesList = (await commands.executeCommand(
    'vscode.executeCodeLensProvider',
    docUri,
  )) as (CodeLens & { range: Range })[] | null

  assert.deepEqual(
    actualCodeLensesList,
    expectedCodeLensesList,
    'Code lenses mismatch',
  )
}
