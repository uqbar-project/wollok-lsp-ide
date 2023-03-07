import { CodeLens, CodeLensParams, CompletionContext, CompletionItem, Connection, Diagnostic, DiagnosticSeverity, DocumentSymbol, DocumentSymbolParams, Location, Position, TextDocumentIdentifier, TextDocumentPositionParams, WorkspaceSymbol, WorkspaceSymbolParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { buildEnvironment, Environment, Node, Package, Problem, validate } from 'wollok-ts'
import { is, List } from 'wollok-ts/dist/extensions'
import { completionsForNode } from './autocomplete/node-completion'
import { completeMessages } from './autocomplete/send-completion'
import { getProgramCodeLenses, getTestCodeLenses } from './code-lens'
import { getNodeDefinition } from './definition'
import { reportMessage } from './reporter'
import { updateDocumentSettings } from './settings'
import { documentSymbolsFor, workspaceSymbolsFor } from './symbols'
import { TimeMeasurer } from './timeMeasurer'
import { getNodesByPosition, getWollokFileExtension, nodeToLocation } from './utils/text-documents'
import { isNodeURI, wollokURI, workspacePackage } from './utils/wollok'

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
    source: problem.node.sourceFileName,
  } as Diagnostic
}

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

const sendDiagnistics = (connection: Connection, problems: List<Problem>, documents: TextDocument[]): void => {
  for (const document of documents) {
    const diagnostics: Diagnostic[] = problems
      .filter(problem => isNodeURI(problem.node, document.uri))
      .map(problem => createDiagnostic(document, problem))

    const uri = wollokURI(document.uri)
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

export const completions = (position: Position, textDocument: TextDocumentIdentifier, context?: CompletionContext): CompletionItem[] => {

  if (context?.triggerCharacter === '.') {
    // ignore dot
    position.character -= 1
    return completeMessages(environment, stableNode(position, textDocument))
  } else {
    return completionsForNode(stableNode(position, textDocument))
  }
}

function stableNode(position: Position, textDocument: TextDocumentIdentifier): Node {
  const cursorNode = getNodesByPosition(environment, { position, textDocument }).reverse()[0]
  return findFirstStableNode(cursorNode)
}

export const definition = (textDocumentPosition: TextDocumentPositionParams): Location[] => {
  const cursorNodes = getNodesByPosition(environment, textDocumentPosition)
  const definitions = getNodeDefinition(environment)(cursorNodes.reverse()[0])
  return definitions.map(nodeToLocation)
}


export const codeLenses = (params: CodeLensParams): CodeLens[] | null => {
  const fileExtension = getWollokFileExtension(params.textDocument.uri)
  const file = findPackage(params.textDocument.uri)
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

export const documentSymbols = (params: DocumentSymbolParams): DocumentSymbol[] => {
  // ToDo this is a temporal fix for https://github.com/uqbar-project/wollok-lsp-ide/issues/61
  if(!workspacePackage(environment)){
    return []
  }
  const document = findPackage(params.textDocument.uri)
  if (!document) throw new Error('Could not produce symbols: document not found')
  return documentSymbolsFor(document)
}

export const workspaceSymbols = (params: WorkspaceSymbolParams): WorkspaceSymbol[] =>
  workspaceSymbolsFor(environment, params.query)

const findPackage = (uri: string): Package | undefined =>
  environment
    .descendants
    .filter(is(Package))
    .find(p => isNodeURI(p, uri))