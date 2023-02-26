import { CodeLens, Position } from 'vscode-languageserver'
import { Describe, Node, Package, Test } from 'wollok-ts'
import { toVSCRange } from './utils/text-documents'
import { fqnRelativeToPackage } from './utils/wollok'

export const getCodeLenses = (file: Package): CodeLens[] => {
  const runAllTests = buildTestCodeLens(
    {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
    file.name,
    'Run all tests'
  )

  return [
    runAllTests
    ,
    ...file
      .filter(isTesteable)
      .map(n =>
        buildTestCodeLens(
          toVSCRange(n.sourceMap!),
          fqnRelativeToPackage(file, n as Test | Describe),
          `Run ${n.is('Test') ? 'test' : 'describe'}`
        )
      ),
  ]
}


function buildTestCodeLens(range: {start: Position, end: Position}, filter: string, title: string): CodeLens{
  return {
    range,
    command: {
      command: 'wollok.run.tests',
      title: title,
      arguments: [filter],
    },
  }
}

function isTesteable(node: Node): node is Test | Describe {
  return node.is('Test') || node.is('Describe')
}