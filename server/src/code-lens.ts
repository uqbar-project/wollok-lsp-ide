import { CodeLens, Position } from 'vscode-languageserver'
import { Describe, Node, Package, Test } from 'wollok-ts'
import { toVSCPosition } from './utils/text-documents'

export const getCodeLenses = (file: Package): CodeLens[] =>
  [
    buildTestCodeLens(
      {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      file.name,
      'Run all tests'
    ),
    ...file
      .filter(isTesteable)
      .map(n =>
        buildTestCodeLens(
          { start: toVSCPosition(n.sourceMap!.start), end: toVSCPosition(n.sourceMap!.end) },
          // @ToDo Had to use workaround because package fqn is absolute in the lsp.
          (n as Test | Describe).fullyQualifiedName().replace(file.fullyQualifiedName(), file.name),
          `Run ${n.is('Test') ? 'test' : 'describe'}`
        )
      ),
  ]


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