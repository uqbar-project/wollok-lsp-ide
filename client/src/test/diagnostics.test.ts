import * as assert from 'assert'
import { DiagnosticSeverity, languages, Uri } from 'vscode'
import { getDocumentURI, activate } from './helper'

suite('Should get diagnostics', () => {
  const docUri = getDocumentURI('pepita.wlk')

  test('Diagnoses lowercase names for objects', async () => {
    await testDiagnostics(docUri, [
      { code: 'nameShouldBeginWithUppercase', severity: DiagnosticSeverity.Warning },
    ])
  })
})

interface TestDiagnostic {
  code: string,
  severity: DiagnosticSeverity
  // TODO: Use Range again for test comparison
}

async function testDiagnostics(docUri: Uri, expectedDiagnostics: TestDiagnostic[]) {
  await activate(docUri)

  console.error(docUri.toString())

  const actualDiagnostics = languages.getDiagnostics(docUri)

  assert.equal(actualDiagnostics.length, expectedDiagnostics.length, 'Diagnostics length differ ' + docUri.toString())

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i]
    assert.equal(actualDiagnostic.code, expectedDiagnostic.code, 'Diagnostic code failed')
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity, 'Diagnostic severity failed')
  })
}