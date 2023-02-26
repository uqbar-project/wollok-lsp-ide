import * as assert from 'assert'
import { DiagnosticSeverity, languages, Uri } from 'vscode'
import { getDocumentURI, activate } from './helper'

/** ATTENTION
 * These tests are NOT ATOMIC, they depend on each other, order matters. (Resolve TODO)
 * */
suite('Should get diagnostics', () => {
  const pepitaURI = getDocumentURI('pepita.wlk')
  const importerURI = getDocumentURI('importer.wlk')
  const importedURI = getDocumentURI('imported.wlk')

  //TODO: Restart server status after each test

  test('on file with missing imports', async () => {
    await testDiagnostics(importerURI, [
      { code: 'missingReference', severity: DiagnosticSeverity.Error },
    ])
  })

  test('after missing imports are solved', async () => {
    await testDiagnostics(importedURI, [])
    await testDiagnostics(importerURI, [])
  })

  test('Diagnoses lower / uppercase names for objects', async () => {
    await testDiagnostics(pepitaURI, [
      { code: 'nameShouldBeginWithLowercase', severity: DiagnosticSeverity.Warning },
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

  const actualDiagnostics = languages.getDiagnostics(docUri)

  assert.equal(actualDiagnostics.length, expectedDiagnostics.length, 'Diagnostics length differ')

  expectedDiagnostics.forEach((expectedDiagnostic, i) => {
    const actualDiagnostic = actualDiagnostics[i]
    assert.equal(actualDiagnostic.code, expectedDiagnostic.code, 'Diagnostic code failed')
    assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity, 'Diagnostic severity failed')
  })
}