import {
  CodeLens,
  CodeLensParams,
  CompletionItem,
  CompletionParams,
  Connection,
  Diagnostic,
  DiagnosticSeverity,
  DocumentSymbol,
  DocumentSymbolParams,
  Location,
  TextDocumentPositionParams,
  WorkspaceSymbol,
  WorkspaceSymbolParams,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, Import, Package, Problem, validate } from 'wollok-ts'
import { is, List } from 'wollok-ts/dist/extensions'
import { completionsForNode } from './functionalities/autocomplete/node-completion'
import { completeMessages } from './functionalities/autocomplete/send-completion'
import {
  getProgramCodeLenses,
  getTestCodeLenses,
} from './functionalities/code-lens'
import { getNodeDefinition } from './functionalities/definition'
import { reportValidationMessage } from './functionalities/reporter'
import { updateDocumentSettings } from './settings'
import {
  documentSymbolsFor,
  workspaceSymbolsFor,
} from './functionalities/symbols'
import { TimeMeasurer } from './timeMeasurer'
import {
  getNodesByPosition,
  getWollokFileExtension,
  nodeToLocation,
  trimIn,
} from './utils/text-documents'
import { isNodeURI, wollokURI, workspacePackage } from './utils/vm/wollok'
import { cursorNode } from './utils/text-documents'

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const buildSeverity = (problem: Problem) =>
  problem.level === 'error'
    ? DiagnosticSeverity.Error
    : DiagnosticSeverity.Warning

const createDiagnostic = (textDocument: TextDocument, problem: Problem) => {
  const source = problem.sourceMap
  const range = {
    start: textDocument.positionAt(source ? source.start.offset : 0),
    end: textDocument.positionAt(source ? source.end.offset : 0),
  }

  return {
    severity: buildSeverity(problem),
    range: trimIn(range, textDocument),
    code: problem.code,
    message: reportValidationMessage(problem),
    source: '',
  } as Diagnostic
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const sendDiagnostics = (
  connection: Connection,
  problems: List<Problem>,
  documents: TextDocument[],
): void => {
  for (const document of documents) {
    const diagnostics: Diagnostic[] = problems
      .filter((problem) => isNodeURI(problem.node, document.uri))
      .map((problem) => createDiagnostic(document, problem))

    const uri = wollokURI(document.uri)
    connection.sendDiagnostics({ uri, diagnostics })
  }
}

export const validateTextDocument =
  (connection: Connection, allDocuments: TextDocument[]) =>
  (textDocument: TextDocument) =>
  async (environment: Environment): Promise<void> => {
    await updateDocumentSettings(connection)

    try {
      const timeMeasurer = new TimeMeasurer()
      const problems = validate(environment)
      timeMeasurer.addTime('build environment for file')

      sendDiagnostics(connection, problems, allDocuments)
      timeMeasurer.addTime('validation time')

      timeMeasurer.finalReport()
    } catch (e) {
      // TODO: Generate a high-level function
      const uri = wollokURI(textDocument.uri)
      const content = textDocument.getText()

      connection.sendDiagnostics({
        uri: uri,
        diagnostics: [
          createDiagnostic(textDocument, {
            level: 'error',
            code: 'FileCouldNotBeValidated',
            node: { sourceFileName: () => uri },
            values: [],
            sourceMap: {
              start: {
                line: 1,
                offset: 0,
              },
              end: {
                line: Number.MAX_VALUE,
                offset: content.length - 1,
              },
            },
          } as unknown as Problem),
        ],
      })
    }
  }

export const completions = (environment: Environment) => (
  params: CompletionParams,
): CompletionItem[] => {
  const timeMeasurer = new TimeMeasurer()

  const { position, textDocument, context } = params
  const selectionNode = cursorNode(environment, position, textDocument)

  timeMeasurer.addTime(`Autocomplete - ${selectionNode?.kind}`)

  const autocompleteMessages = context?.triggerCharacter === '.' && !selectionNode.parent.is(Import)
  if (autocompleteMessages) {
    // ignore dot
    position.character -= 1
  }
  const result = autocompleteMessages ? completeMessages(environment, selectionNode) : completionsForNode(selectionNode)
  timeMeasurer.finalReport()
  return result
}

export const definition = (environment: Environment) => (
  textDocumentPosition: TextDocumentPositionParams
): Location[] => {
  const cursorNodes = getNodesByPosition(environment, textDocumentPosition)
  const definitions = getNodeDefinition(environment)(cursorNodes.reverse()[0])
  return definitions.map(nodeToLocation)
}

export const codeLenses = (environment: Environment) => (params: CodeLensParams): CodeLens[] | null => {
  const fileExtension = getWollokFileExtension(params.textDocument.uri)
  const file = findPackage(params.textDocument.uri, environment)
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

export const documentSymbols = (environment: Environment) => (params: DocumentSymbolParams): DocumentSymbol[] => {
  // ToDo this is a temporal fix for https://github.com/uqbar-project/wollok-lsp-ide/issues/61
  if (!workspacePackage(environment)) {
    return []
  }
  const document = findPackage(params.textDocument.uri, environment)
  if (!document)
    throw new Error('Could not produce symbols: document not found')
  return documentSymbolsFor(document)
}

export const workspaceSymbols = (
  environment: Environment
) => (params: WorkspaceSymbolParams): WorkspaceSymbol[] => workspaceSymbolsFor(environment, params.query)

const findPackage = (
  uri: string,
  environment: Environment,
): Package | undefined =>
  environment.descendants.filter(is(Package)).find((p) => isNodeURI(p, uri))
