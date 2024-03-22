import { CodeLens, CodeLensParams, Position, Range } from 'vscode-languageserver'
import { Describe, Node, Package, Test, Program, Environment, is, PROGRAM_FILE_EXTENSION, TEST_FILE_EXTENSION, WOLLOK_FILE_EXTENSION, Class, Singleton } from 'wollok-ts'
import { getWollokFileExtension, packageFromURI, toVSCRange } from '../utils/text-documents'
import { removeQuotes } from '../utils/strings'
import { COMMAND_RUN_GAME, COMMAND_RUN_PROGRAM, COMMAND_RUN_TEST, COMMAND_START_REPL } from '../constants'

export const codeLenses = (environment: Environment) => (params: CodeLensParams): CodeLens[] | null => {
  const fileExtension = getWollokFileExtension(params.textDocument.uri)
  const file = packageFromURI(params.textDocument.uri, environment)
  if (!file) return null

  switch (fileExtension) {
    case PROGRAM_FILE_EXTENSION:
      return getProgramCodeLenses(file)
    case TEST_FILE_EXTENSION:
      return getTestCodeLenses(file)
    case WOLLOK_FILE_EXTENSION:
      return getWollokFileCodeLenses(file)
    default:
      return null
  }
}

export const getProgramCodeLenses = (file: Package): CodeLens[] =>
  file.members.filter(is(Program)).flatMap(program => [
    {
      range: toVSCRange(program.sourceMap!),
      command: {
        command: COMMAND_RUN_GAME,
        title: 'Run game',
        arguments: [program.fullyQualifiedName],
      },
    },
    {
      range: toVSCRange(program.sourceMap!),
      command: {
        command: COMMAND_RUN_PROGRAM,
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
    COMMAND_RUN_TEST,
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

export const getWollokFileCodeLenses = (file: Package): CodeLens[] =>
  file.members.filter(isWollokDefinition).flatMap(definition => [
    // TODO: armar una función para crear un command, pasarle command y title
    {
      range: toVSCRange(definition.sourceMap!),
      command: {
        command: COMMAND_START_REPL,
        title: 'Run in REPL',
        arguments: [definition.fullyQualifiedName],
      },
    },
  ])

const isTesteable = (node: Node): node is Test | Describe =>
  node.is(Test) || node.is(Describe)

const isWollokDefinition = (node: Node): node is Class | Singleton =>
  node.is(Class) || node.is(Singleton)