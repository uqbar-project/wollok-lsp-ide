import { CompletionItem, CompletionItemKind, Connection, Diagnostic, DiagnosticSeverity, InsertTextFormat, Position, TextDocument, TextDocumentPositionParams } from 'vscode-languageserver'
import { buildEnvironment, Node, Source, validate } from 'wollok-ts'
import { Problem } from 'wollok-ts/dist/validator'

import { reportMessage } from './reporter'
import { completionsForNode, NodeCompletion } from './autocomplete'

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
    source: problem.node.source?.file,
  } as Diagnostic
}


// TODO: To utils?
const include = (source: Source, { position, textDocument: { uri } }: TextDocumentPositionParams) =>
  source.file == uri &&
  (source.start.line - 1 <= position.line && position.line <= source.end.line - 1 ||
    (source.start.line - 1 == position.line && position.line == source.end.line - 1 &&
      source.start.offset <= position.character && position.character <= source.end.line
    ))

const getNodesByPosition = (textDocumentPosition: TextDocumentPositionParams): Node[] => {
  const result: Node[] = []
  environment.forEach(node => { if (node.source?.file && include(node.source, textDocumentPosition)) result.push(node) })
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
    }
  }
})

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

let environment = buildEnvironment([])

export const validateTextDocument = (connection: Connection) => async (textDocument: TextDocument) => {
  const text = textDocument.getText()

  const file: { name: string, content: string } = {
    name: textDocument.uri,
    content: text,
  }

  const start = new Date().getTime()

  environment = buildEnvironment([file], environment)

  const endEnvironment = new Date().getTime()

  const problems = validate(environment)

  console.log('o- environment time ', (endEnvironment - start))

  const diagnostics: Diagnostic[] = problems.map(problem => createDiagnostic(textDocument, problem))
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })

  const endValidation = new Date().getTime()
  console.log('o- validation time ', (endValidation - endEnvironment))
}

export const completions = (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const { position } = textDocumentPosition
  const cursorNode = getNodesByPosition(textDocumentPosition).reverse()[0]
  return completionsForNode(cursorNode).map(createCompletionItem(position))
}



