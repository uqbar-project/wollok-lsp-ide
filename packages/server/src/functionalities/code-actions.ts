import { CodeAction, CodeActionKind, CodeActionParams, Command, Diagnostic } from 'vscode-languageserver'
import { Assignment, Class, Environment, Field, Mixin, Node, possiblyReferenced, print, Problem, Reference, Singleton, validate, Variable } from 'wollok-ts'
import { writeImportFor } from '../utils/imports'
import { packageFromURI, rangeIncludes, toVSCRange, uriFromRelativeFilePath } from '../utils/text-documents'

type CodeActionResponse = Array<Command | CodeAction>

export const codeActions = (environment: Environment) => (params: CodeActionParams): CodeActionResponse => {
  const problems = validate(packageFromURI(params.textDocument.uri, environment))
  const problemsInRange = problems.filter(problem => rangeIncludes(toVSCRange(problem.sourceMap), params.range))
  if(problemsInRange.length === 0) return null
  return problemsInRange.flatMap(problem => {
    const fixer = fixers[problem.code]
    if (!fixer) return []
    const diagnostics = matchDiagnostics(problem, params.context.diagnostics)
    return fixer(problem.node).map(action => ({ ...action, diagnostics: diagnostics }))
  })
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
    title: `Convert ${displayVarInTitle ? variable.name + ' ' : ''}to ${newValue ? 'const' : 'var'}`,
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

function matchDiagnostics(problem: Problem, diagnostics: Diagnostic[]): Diagnostic[] {
  return diagnostics.filter(diagnostic => diagnostic.code === problem.code)
}

const isImportableNode = (node: Node): node is Singleton | Class | Mixin => node.is(Singleton) || node.is(Class) || node.is(Mixin)

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