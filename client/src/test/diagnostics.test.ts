import * as assert from 'assert'
import { Diagnostic, DiagnosticSeverity, languages, Position, Range, Uri } from 'vscode'
import { getDocumentURI, activate } from './helper'

suite('Should get diagnostics', () => {
  const docUri = getDocumentURI('pepita.txt')

  test('Diagnoses lowercase texts', async () => {
    await testDiagnostics(docUri, [
      { message: 'The name Pepita must start with lowercase', range: toRange(0, 7, 0, 13), severity: DiagnosticSeverity.Warning, source: 'ex' },
    ])
  })
})

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
  const start = new Position(sLine, sChar)
  const end = new Position(eLine, eChar)
  return new Range(start, end)
}

async function testDiagnostics(docUri: Uri, expectedDiagnostics: Diagnostic[]) {
  await activate(docUri)

  const actualDiagnostics = languages.getDiagnostics(docUri)

  assert.equal(actualDiagnostics.length, expectedDiagnostics.length)

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i]
    assert.equal(actualDiagnostic.message, expectedDiagnostic.message)
    assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range)
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity)
  })
}