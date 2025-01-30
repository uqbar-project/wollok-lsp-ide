import { CodeAction, CodeActionParams, Command, Range } from 'vscode-languageserver'
import { BaseProblem, Class, Entity, Environment, Import, Mixin, Node, print, Problem, Reference, Singleton, validate } from 'wollok-ts'
import { possiblyReferenced } from 'wollok-ts'
import { writeImportFor } from '../utils/imports'
import { getNodesByPosition, toVSCRange, uriFromRelativeFilePath } from '../utils/text-documents'

type CodeActionResponse = Array<Command | CodeAction>

export const codeActions = (environment: Environment) => (params: CodeActionParams): CodeActionResponse => {
  const possibleNodes = getNodesByPosition(environment, { position: params.range.start, textDocument: params.textDocument })

  const problems = validate(possibleNodes.reverse()[0])
  const fixers = problems.flatMap(problem => matchProblemWithFixers(problem))
  return fixers
}

const isImportableNode = (node: Node): node is Singleton | Class | Mixin => node.is(Singleton) || node.is(Class) || node.is(Mixin)

const matchProblemWithFixers = (problem: Problem): CodeActionResponse => {
  switch(problem.code) {
    case 'missingReference':
    case 'shouldReferenceToObjects':
      return fixShouldReferenceToObjects(problem.node as Reference<Node>)
    default:
      return []
  }
}


// FIXERS //
const fixShouldReferenceToObjects = (node: Reference<Node>): CodeActionResponse => {
  const targets = possiblyReferenced(node, node.environment).filter(isImportableNode)

  return targets.map<CodeActionResponse[number]>(target => {
    return {
    title: `Import from ${target.sourceFileName}\n`,
    edit: {
      changes: {
        [uriFromRelativeFilePath(node.sourceFileName)]: [{
          newText: `${writeImportFor(target)}\n`,
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
        }],
      },
    },
  }})
}