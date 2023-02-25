import { CodeLens, CodeLensParams, CompletionContext, CompletionItem, Connection, Diagnostic, DiagnosticSeverity, DocumentSymbol, DocumentSymbolParams, Location, Position, TextDocumentIdentifier, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { buildEnvironment, Environment, is, Node, Package, Problem, validate } from 'wollok-ts'
import { reportMessage } from './reporter'
import { updateDocumentSettings } from './settings'
import { getNodesByPosition, nodeToLocation } from './utils/text-documents'
import { getNodeDefinition } from './definition'
import { TimeMeasurer } from './timeMeasurer'
import { completeMessages } from './autocomplete/send-completion'
import { completionsForNode } from './autocomplete/node-completion'
import { getCodeLenses } from './code-lens'
import { symbolsFor } from './document-symbols'

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
  const content = textDocument.getText()
  try {
    const timeMeasurer = new TimeMeasurer()

    const file: { name: string, content: string } = {
      name: uri,
      content: content,
    }
    environment = buildEnvironment([file], environment)
    const problems = validate(environment)
    timeMeasurer.addTime('build environment for file')

    const diagnostics: Diagnostic[] = problems
      .filter(problem => problem.node.sourceFileName() == uri)
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

export const completions = (position: Position, textDocument: TextDocumentIdentifier, context?: CompletionContext): CompletionItem[] => {

  if(context?.triggerCharacter === '.') {
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


export const codeLenses = (params: CodeLensParams): CodeLens[] => {
  const testsPackage = findPackage(params.textDocument.uri)
  if(!testsPackage) return []
  return getCodeLenses(testsPackage)
}

export const documentSymbols = (params: DocumentSymbolParams): DocumentSymbol[] => {
  const document = findPackage(params.textDocument.uri)
  if(!document) throw new Error('Could not produce symbols: document not found')
  return symbolsFor(document)
}


const findPackage = (uri: string): Package | undefined =>
  environment
    .filter(is('Package'))
    .find(p => (p as Package).sourceFileName() === uri) as Package | undefined