import { CompletionItem, CompletionItemKind, Connection, Diagnostic, DiagnosticSeverity, InsertTextFormat, Location, Position, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { buildEnvironment, Environment, Node, Package, Problem, validate } from 'wollok-ts'
import { completionsForNode, NodeCompletion } from './autocomplete'
import { reportMessage } from './reporter'
import { updateDocumentSettings } from './settings'
import { getNodesByPosition, nodeToLocation } from './utils/text-documents'
import { getNodeDefinition } from './definition'
import { TimeMeasurer } from './timeMeasurer'
import { List } from 'wollok-ts/dist/extensions'

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

const wollokURI = (uri: string) => uri.replace('file:///', '')

const sendDiagnistics = (connection: Connection, problems: List<Problem>, documents: TextDocument[]) => {
  for (const document of documents) {
    const uri = wollokURI(document.uri)
    const diagnostics: Diagnostic[] = problems
      .filter(problem => problem.node.sourceFileName() == uri)
      .map(problem => createDiagnostic(document, problem))
    connection.sendDiagnostics({ uri, diagnostics })
  }
}

const rebuildTextDocument = (document: TextDocument) => {
  const uri = wollokURI(document.uri)
  const content = document.getText()
  const file: { name: string, content: string } = {
    name: uri,
    content: content,
  }
  environment = buildEnvironment([file], environment)
}

export const validateTextDocument = (connection: Connection, allDocuments: TextDocument[]) => async (textDocument: TextDocument): Promise<void> => {
  await updateDocumentSettings(connection)

  try {
    const timeMeasurer = new TimeMeasurer()

    rebuildTextDocument(textDocument)
    const problems = validate(environment)
    timeMeasurer.addTime('build environment for file')

    sendDiagnistics(connection, problems, allDocuments)
    timeMeasurer.addTime('validation time')

    timeMeasurer.finalReport()
  } catch (e) {
    // TODO: Generate a high-level function
    const uri = wollokURI(textDocument.uri)
    const content = textDocument.getText()
  
    connection.sendDiagnostics({
      uri: uri, diagnostics: [
        createDiagnostic(textDocument, {
          level: 'error',
          code: 'FileCouldNotBeValidated',
          node: { sourceFileName: () => uri },
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
  const cursorNode = getNodesByPosition(environment, textDocumentPosition).reverse()[0]
  const stableNode = findFirstStableNode(cursorNode)
  return completionsForNode(stableNode).map(createCompletionItem(position))
}

export const definition = (textDocumentPosition: TextDocumentPositionParams): Location[] => {
  const cursorNodes = getNodesByPosition(environment, textDocumentPosition)
  const definitions = getNodeDefinition(environment)(cursorNodes.reverse()[0])
  return definitions.map(nodeToLocation)
}