import { CodeLens, CodeLensParams, Position, Range } from 'vscode-languageserver'
import { Describe, Node, Package, Test, Program, Environment, is } from 'wollok-ts'
import { getWollokFileExtension, packageFromURI, toVSCRange } from '../utils/text-documents'
import { removeQuotes } from '../utils/strings'

export const codeLenses = (environment: Environment) => (params: CodeLensParams): CodeLens[] | null => {
  const fileExtension = getWollokFileExtension(params.textDocument.uri)
  const file = packageFromURI(params.textDocument.uri, environment)
  if (!file) return null

  switch (fileExtension) {
    case 'wpgm':
      return getProgramCodeLenses(file)
    case 'wtest':
      return getTestCodeLenses(file)
    default:
      return null
  }
}

export const getProgramCodeLenses = (file: Package): CodeLens[] =>
  file.members.filter(is(Program)).flatMap(program => [
    {
      range: toVSCRange(program.sourceMap!),
      command: {
        command: 'wollok.run.game',
        title: 'Run game',
        arguments: [program.fullyQualifiedName],
      },
    },
    {
      range: toVSCRange(program.sourceMap!),
      command: {
        command: 'wollok.run.program',
        title: 'Run program',
        arguments: [program.fullyQualifiedName],
      },
    },
  ])


export const getTestCodeLenses = (file: Package): CodeLens[] => {
  const runAllTests = buildRunAllTestsCodeLens(file)

  return [
    runAllTests
    ,
    ...file
      .descendants
      .filter(isTesteable)
      .map(node => buildTestCodeLens(file, node)),
  ]
}

const buildRunAllTestsCodeLens = (file: Package): CodeLens =>
  buildTestsCodeLens(
    Range.create(Position.create(0, 0), Position.create(0, 0)),
    'wollok.run.test',
    'Run all tests',
    [null, file.name, null, null]
  )


const buildTestCodeLens = (file: Package, node: Test | Describe): CodeLens => {
  const describe = node.is(Describe) ? node.name : node.parent?.is(Describe) ? node.parent.name : null
  const test = node.is(Test) ? node.name : null

  return buildTestsCodeLens(
    toVSCRange(node.sourceMap!),
    'wollok.run.test',
    `Run ${node.is(Test) ? 'test' : 'describe'}`,
    [
      null,
      file.name,
      describe ? removeQuotes(describe) : null,
      test ? removeQuotes(test) : null,
    ]
  )
}

const buildTestsCodeLens = (range: Range, command: string, title: string, args: [string|null, string|null, string|null, string|null]):  CodeLens => ({
  range,
  command: {
    command,
    title,
    arguments: args,
  },
})

function isTesteable(node: Node): node is Test | Describe {
  return node.is(Test) || node.is(Describe)
}