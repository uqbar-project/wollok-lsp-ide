import { CompletionItem, CompletionItemKind, Connection, Diagnostic, DiagnosticSeverity, InsertTextFormat, Position, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { buildEnvironment, Node, validate } from 'wollok-ts'
import { Problem } from 'wollok-ts/dist/validator'
import { completionsForNode, NodeCompletion } from './autocomplete'
import { reportMessage } from './reporter'

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const buildSeverity = (problem: Problem) =>
  problem.level === 'Error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning

const createDiagnostic = (textDocument: TextDocument, problem: Problem) => {
  const source = problem.source
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
  const startLine = node.sourceMap?.start?.line
  const endLine = node.sourceMap?.end?.line
  return node.sourceFileName() == uri && startLine && endLine &&
  (startLine - 1 <= position.line && position.line <= endLine - 1 ||
    startLine - 1 == position.line && position.line == endLine - 1 &&
      (node?.sourceMap?.start?.offset || 0) <= position.character && position.character <= endLine
  )
}

const getNodesByPosition = (textDocumentPosition: TextDocumentPositionParams): Node[] => {
  const result: Node[] = []
  environment.forEach(node => { if (node.sourceFileName() && include(node, textDocumentPosition)) result.push(node) })
  return result
}

const createCompletionItem = (position: Position) => (base: NodeCompletion): CompletionItem => ({
  ...base,
  kind: CompletionItemKind.Method,
  insertTextFormat: InsertTextFormat.Snippet,
  sortText: 'b',
  textEdit: {
    ...base?.textEdit,
    range: {
      start: position,
      end: position,
    },
  },
})

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

let environment = buildEnvironment([])

export const validateTextDocument = (connection: Connection) => async (textDocument: TextDocument): Promise<void> => {
  const text = textDocument.getText()

  const file: { name: string, content: string } = {
    name: textDocument.uri,
    content: text,
  }

  const start = new Date().getTime()

  environment = buildEnvironment([file], environment)

  const endEnvironment = new Date().getTime()

  const problems = validate(environment)

  console.info('o- environment time ', endEnvironment - start)

  const diagnostics: Diagnostic[] = problems.map(problem => createDiagnostic(textDocument, problem))
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })

  const endValidation = new Date().getTime()
  console.info('o- validation time ', endValidation - endEnvironment)
}

export const completions = (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const { position } = textDocumentPosition
  const cursorNode = getNodesByPosition(textDocumentPosition).reverse()[0]
  return completionsForNode(cursorNode).map(createCompletionItem(position))
}