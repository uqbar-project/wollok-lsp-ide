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
          title: 'Run program',
          command: 'wollok.run.program',
          arguments: ['pepitaGame.juego'],
        },
      ),
      new CodeLens(
        new Range(new Position(0, 0), new Position(2, 1)),
        {
          title: 'Debug program',
          command: 'wollok.debug',
          arguments: ['pepitaGame.juego'],
        }
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
          arguments: [null, 'test.wtest', null, null],
        },
      ),
      new CodeLens(
        new Range(new Position(0, 0), new Position(4, 1)),
        {
          title: 'Run describe',
          command: 'wollok.run.test',
          arguments: [null, 'test.wtest', 'pepita test', null],
        },
      ),
      new CodeLens(
        new Range(new Position(1, 4), new Position(3, 5)),
        {
          title: 'Run test',
          command: 'wollok.run.test',
          arguments: [null, 'test.wtest', 'pepita test', 'pepita is happy'],
        },
      ),
      new CodeLens(
        new Range(new Position(1, 4), new Position(3, 5)),
        {
          title: 'Debug test',
          command: 'wollok.debug',
          arguments: ['test."pepita test"."pepita is happy"'],
        }
      ),
    ])
  })

  test('Shows test code lenses for Wollok Definition file', async () => {
    await testCodeLenses(getDocumentURI('pepita.wlk'), [
      new CodeLens(
        new Range(new Position(0, 0), new Position(2, 1)),
        {
          title : 'Run in REPL',
          command : 'wollok.start.repl',
          arguments : ['pepita.Pepita'],
        },
      ),
      new CodeLens(
        new Range(new Position(4, 0), new Position(4, 10)),
        {
          title: 'Run in REPL',
          command: 'wollok.start.repl',
          arguments: ['pepita.a'],
        },
      ),
      new CodeLens(
        new Range(new Position(6, 0), new Position(8, 1)),
        {
          title: 'Run in REPL',
          command: 'wollok.start.repl',
          arguments: ['pepita.MixinName'],
        },
      ),
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
