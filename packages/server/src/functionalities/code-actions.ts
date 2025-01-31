import { CodeAction, CodeActionKind, CodeActionParams, Command } from 'vscode-languageserver'
import { Assignment, Class, Environment, Field, Mixin, Node, possiblyReferenced, print, Problem, Reference, Singleton, validate, Variable } from 'wollok-ts'
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
  const fixer = fixers[problem.code]
  return fixer ? fixer(problem.node) : []
}


// FIXERS //
type Fixer = (node: Node) => CodeActionResponse
const fixers: Record<string, Fixer> = {
  missingReference: fixByImporting,
  shouldReferenceToObjects: fixByImporting,
  shouldDefineConstInsteadOfVar: (variable: Field | Variable) =>  changeConstantValue(variable, true, false),
  shouldNotReassignConst: (assignment: Assignment) =>  changeConstantValue(assignment.variable.target, false, true),
}

function changeConstantValue(variable: Variable | Field, newValue: boolean, displayVarInTitle = false): CodeActionResponse {
  const copiedVar = variable.copy({ isConstant: newValue })
  return [{
    title: `Convert ${displayVarInTitle ? variable.name : ''} to ${newValue ? 'const' : 'var'}`,
    kind: CodeActionKind.QuickFix,
    isPreferred: true,
    edit: {
      changes: {
        [uriFromRelativeFilePath(variable.sourceFileName)]: [{
          newText: print(copiedVar),
          range: toVSCRange(variable.sourceMap!),
        }],
      },
    },
  }]

}

function fixByImporting(node: Reference<Node>): CodeActionResponse {
  const targets = possiblyReferenced(node, node.environment).filter(isImportableNode)

  return targets.map<CodeActionResponse[number]>(target => {
    return {
    title: `Import from ${target.sourceFileName}`,
    kind: CodeActionKind.QuickFix,
    isPreferred: true,
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