import { CodeLens, Position, Range } from 'vscode-languageserver'
import { Describe, Node, Package, Test, Program } from 'wollok-ts'
import { is } from 'wollok-ts/dist/extensions'
import { toVSCRange } from './utils/text-documents'
import { fqnRelativeToPackage } from './utils/wollok'


export const getProgramCodeLenses = (file: Package): CodeLens[] =>
  file.members.filter(is(Program)).map(program => ({
    range: toVSCRange(program.sourceMap!),
    command: {
      command: 'wollok.run.program',
      title: 'Run program',
      arguments: [fqnRelativeToPackage(file, program)],
    },
  }))


export const getTestCodeLenses = (file: Package): CodeLens[] => {
  const runAllTests = buildTestCodeLens(
    Range.create(Position.create(0, 0), Position.create(0, 0)),
    file.name,
    'Run all tests'
  )

  return [
    runAllTests
    ,
    ...file
      .descendants
      .filter(isTesteable)
      .map(n =>
        buildTestCodeLens(
          toVSCRange(n.sourceMap!),
          fqnRelativeToPackage(file, n as Test | Describe),
          `Run ${n.is(Test) ? 'test' : 'describe'}`
        )
      ),
  ]
}

function buildTestCodeLens(range: Range, filter: string, title: string): CodeLens{
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
  return node.is(Test) || node.is(Describe)
}