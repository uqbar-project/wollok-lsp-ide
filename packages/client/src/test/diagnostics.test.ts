import * as assert from 'assert'
import { DiagnosticSeverity, languages, Uri } from 'vscode'
import { getDocumentURI, activate } from './helper'
import { Position, Range } from 'vscode-languageclient'

/** ATTENTION
 * These tests are NOT ATOMIC, they depend on each other, order matters. (Resolve TODO)
 * */
suite('Should get diagnostics', () => {
  const lostURI = getDocumentURI('lost.wlk')
  const pepitaURI = getDocumentURI('pepita.wlk')
  const importerURI = getDocumentURI('importer.wlk')
  const importedURI = getDocumentURI('imported.wlk')
  const manoloURI = getDocumentURI('manolo.wlk')

  //TODO: Restart server status after each test

  test('on file with missing imports', async () => {
    await testDiagnostics(lostURI, [
      {
        code: 'missingReference',
        severity: DiagnosticSeverity.Error,
        range: Range.create(Position.create(0, 7), Position.create(0, 14)),
      },
    ])
  })

  test('after missing imports are solved', async () => {
    await testDiagnostics(importedURI, [])
    await testDiagnostics(importerURI, [])
  })

  test('Diagnoses lower / uppercase names for objects', async () => {
    await testDiagnostics(pepitaURI, [
      {
        code: 'nameShouldBeginWithLowercase',
        severity: DiagnosticSeverity.Warning,
        range: Range.create(Position.create(0, 7), Position.create(0, 13)),
      },
      {
        code: 'nameShouldBeginWithUppercase',
        severity: DiagnosticSeverity.Warning,
        range: Range.create(Position.create(4, 6), Position.create(4, 7)),
      },
    ])
  })

  test('Should trim diagnostics', async () => {
    await testDiagnostics(manoloURI, [
      {
        code: 'shouldNotDefineUnusedVariables',
        severity: DiagnosticSeverity.Warning,
        range: Range.create(Position.create(1, 6), Position.create(1, 7)),
      },
    ])
  })
})

interface TestDiagnostic {
  code: string
  severity: DiagnosticSeverity
  range: Range
}

async function testDiagnostics(
  docUri: Uri,
  expectedDiagnostics: TestDiagnostic[],
) {
  await activate(docUri)

  const actualDiagnostics = languages.getDiagnostics(docUri)

  assert.equal(
    actualDiagnostics.length,
    expectedDiagnostics.length,
    'Diagnostics length differ',
  )

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i]
    assert.equal(
      actualDiagnostic.code,
      expectedDiagnostic.code,
      'Diagnostic code failed',
    )
    assert.equal(
      actualDiagnostic.severity,
      expectedDiagnostic.severity,
      'Diagnostic severity failed',
    )
    positionEquals(actualDiagnostic.range.start, expectedDiagnostic.range.start)
    positionEquals(actualDiagnostic.range.end, expectedDiagnostic.range.end)
  })
}

function positionEquals(actual: Position, expected: Position){
  assert.equal(
    actual.character,
    expected.character,
    `Expected character ${expected.character} but got ${actual.character}`
  )
  assert.equal(
    actual.line,
    expected.line,
    `Expected line ${expected.line} but got ${actual.line}`
  )
}