import * as assert from 'assert'
import { commands, Range, Uri, CodeLens, Position } from 'vscode'
import { getDocumentURI, activate } from './helper'

suite('Should do code lenses', () => {
  const docUri = getDocumentURI('test.wtest')

  test('Shows program code lenses for Wollok Program file', async () => {
    await testCodeLenses(getDocumentURI('pepitaGame.wpgm'), [
      new CodeLens(
        new Range(new Position(0, 0), new Position(2, 1)),
        {
          title: 'Run game',
          command: 'wollok.run.game',
          arguments: ['pepitaGame.juego'],
        },
      ),
      new CodeLens(
        new Range(new Position(0, 0), new Position(2, 1)),
        {
          title: 'Run program',
          command: 'wollok.run.program',
          arguments: ['pepitaGame.juego'],
        },
      ),
    ])
  })

  test('Shows test code lenses for Wollok Test file', async () => {
    await testCodeLenses(docUri, [
      new CodeLens(
        new Range(new Position(0, 0), new Position(0, 0)),
        {
          title: 'Run all tests',
          command: 'wollok.run.test',
          arguments: [null, 'test', null, null],
        },
      ),
      new CodeLens(
        new Range(new Position(0, 0), new Position(4, 1)),
        {
          title: 'Run describe',
          command: 'wollok.run.test',
          arguments: [null, 'test', 'pepita test', null],
        },
      ),
      new CodeLens(
        new Range(new Position(1, 4), new Position(4, 0)),
        {
          title: 'Run test',
          command: 'wollok.run.test',
          arguments: [null, 'test', 'pepita test', 'pepita is happy'],
        },
      ),
    ])
  })

  test('Shows test code lenses for Wollok Definition file', async () => {
    await testCodeLenses(getDocumentURI('pepita.wlk'), [
        {
          range : {
            c : {
              c : 0,
              e : 0,
            },
            e : {
              c : 4,
              e : 0,
            },
          },
          command : {
            arguments : [
              'pepita.Pepita',
            ],
            command : 'wollok.start.repl',
            title : 'Run in REPL',
          },
        },
        {
          range: {
            c : {
              c : 4,
              e : 0,
            },
            e : {
              c : 6,
              e : 0,
            },
          },
          command: {
            arguments: [
              'pepita.a',
            ],
            command: 'wollok.start.repl',
            title: 'Run in REPL',
          },
        },
    ])
  })
})

async function testCodeLenses(
  docUri: Uri,
  expectedCodeLensesList: CodeLens[],
) {
  await activate(docUri)

  // Executing the command `vscode.executeCodeLensProvider` to simulate triggering code lenses
  const actualCodeLensesList = (await commands.executeCommand(
    'vscode.executeCodeLensProvider',
    docUri,
  )) as CodeLens[] | null

  assert.deepEqual(
    actualCodeLensesList,
    expectedCodeLensesList,
    'Code lenses mismatch',
  )
}
