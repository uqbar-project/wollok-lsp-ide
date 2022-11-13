import path from 'path'
import { CompletionItem, CompletionItemKind, Connection, Diagnostic, DiagnosticSeverity, InsertTextFormat, Position, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { buildEnvironment, Environment, Node, Problem, validate } from 'wollok-ts'
import { completionsForNode, NodeCompletion } from './autocomplete'
import { reportMessage } from './reporter'
import { updateDocumentSettings } from './settings'
import { TimeMeasurer } from './timeMeasurer'

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const buildSeverity = (problem: Problem) =>
  problem.level === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning

const createDiagnostic = (textDocument: TextDocument, problem: Problem) => {
  const source = problem.sourceMap
  const range = {
    start: textDocument.positionAt(source ? source.start.offset : 0),
    end: textDocument.positionAt(source ? source.end.offset : 0),
  }
  return {
    severity: buildSeverity(problem),
    range,
    code: problem.code,
    message: reportMessage(problem),
    source: problem.node.sourceFileName(),
  } as Diagnostic
}


// TODO: Refactor and move to utils
const include = (node: Node, { position, textDocument: { uri } }: TextDocumentPositionParams) => {
  if (!node.sourceFileName()) return false
  if (node.kind === 'Package') {
    return uri.includes(node.sourceFileName()!)
  }
  const startLine = node.sourceMap?.start?.line
  const endLine = node.sourceMap?.end?.line
  return uri.includes(node.sourceFileName()!) && startLine && endLine &&
    (startLine - 1 <= position.line && position.line <= endLine + 1 ||
      startLine - 1 == position.line && position.line == endLine + 1 &&
      (node?.sourceMap?.start?.offset || 0) <= position.character && position.character <= endLine
    )
}

// TODO: Use map instead of forEach
const getNodesByPosition = (textDocumentPosition: TextDocumentPositionParams): Node[] => {
  const result: Node[] = []
  environment.forEach(node => {
    if (node.sourceFileName() && include(node, textDocumentPosition)) result.push(node)
  })
  return result
}

const createCompletionItem = (_position: Position) => (base: NodeCompletion): CompletionItem => ({
  kind: CompletionItemKind.Method,
  sortText: 'b',
  insertTextFormat: InsertTextFormat.Snippet,
  insertText: base.textEdit.newText,
  label: base.label,
})

function findFirstStableNode(node: Node): Node {
  if (!node.problems || node.problems.length === 0) {
    return node
  }
  if (node.parent.kind === 'Environment') {
    throw new Error('No stable node found')
  }
  return findFirstStableNode(node.parent)
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

let environment: Environment

export const resetEnvironment = (): void => {
  environment = buildEnvironment([])
}

export const validateTextDocument = (connection: Connection) => async (textDocument: TextDocument): Promise<void> => {
  await updateDocumentSettings(connection)

  const uri = textDocument.uri
  const name = path.basename(uri)
  const content = textDocument.getText()
  try {
    const timeMeasurer = new TimeMeasurer()

    const file: { name: string, content: string } = { name, content }
    environment = buildEnvironment([file], environment)
    const problems = validate(environment)
    timeMeasurer.addTime('build environment for file')

    const diagnostics: Diagnostic[] = problems
      .filter(problem => problem.node.sourceFileName() == name)
      .map(problem => createDiagnostic(textDocument, problem))

    connection.sendDiagnostics({ uri, diagnostics })
    timeMeasurer.addTime('validation time')

    timeMeasurer.finalReport()
  } catch (e) {
    // TODO: Generate a high-level function
    connection.sendDiagnostics({
      uri: textDocument.uri, diagnostics: [
        createDiagnostic(textDocument, {
          level: 'error',
          code: 'FileHasParsingProblems',
          node: { sourceFileName: () => textDocument.uri },
          values: [],
          sourceMap: {
            start: {
              line: 1,
              offset: 0,
            }, end: {
              line: Number.MAX_VALUE,
              offset: content.length - 1,
            },
          },
        } as unknown as Problem),
      ],
    })
  }
}

export const completions = (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const { position } = textDocumentPosition
  const cursorNode = getNodesByPosition(textDocumentPosition).reverse()[0]
  const stableNode = findFirstStableNode(cursorNode)
  return completionsForNode(stableNode).map(createCompletionItem(position))
}