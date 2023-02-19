import { CodeLens } from 'vscode-languageserver'
import { Describe, Node, Package, Test } from 'wollok-ts'
import { toVSCPosition } from './utils/text-documents'

export const getCodeLenses = (file: Package): CodeLens[] =>
  [
    {
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      command: {
        command: 'wollok.run.tests',
        title: 'Run all tests',
        arguments: [file.name],
      },
    },
    ...file
      .filter(isTesteable)
      .map(n => ({
        range: { start: toVSCPosition(n.sourceMap!.start), end: toVSCPosition(n.sourceMap!.end) },
        command: {
          command: 'wollok.run.tests',
          title: `Run ${n.is('Test') ? 'test' : 'describe'}`,
          arguments: [
          // @ToDo Had to use workaround because package fqn is absolute in the lsp.
            (n as Test | Describe).fullyQualifiedName().replace(file.fullyQualifiedName(), file.name),
          ],
        },
      }))]


function isTesteable(node: Node): node is Test | Describe {
  return node.is('Test') || node.is('Describe')
}