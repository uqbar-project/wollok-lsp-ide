import {
  CodeLens,
  CodeLensParams,
  CompletionItem,
  CompletionParams,
  Connection,
  Diagnostic,
  DiagnosticSeverity,
  DocumentFormattingParams,
  DocumentSymbol,
  DocumentSymbolParams,
  Location,
  Position,
  TextDocumentIdentifier,
  TextDocumentPositionParams,
  TextEdit,
  WorkspaceSymbol,
  WorkspaceSymbolParams,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, Node, Package, Problem, SourceMap, validate } from 'wollok-ts'
import { List, is } from 'wollok-ts/dist/extensions'
import { write } from './formatter'
import { completionsForNode } from './functionalities/autocomplete/node-completion'
import { completeMessages } from './functionalities/autocomplete/send-completion'
import {
  getProgramCodeLenses,
  getTestCodeLenses,
} from './functionalities/code-lens'
import { getNodeDefinition } from './functionalities/definition'
import { reportMessage } from './functionalities/reporter'
import {
  documentSymbolsFor,
  workspaceSymbolsFor,
} from './functionalities/symbols'
import { updateDocumentSettings } from './settings'
import { TimeMeasurer } from './timeMeasurer'
import {
  getNodesByPosition,
  getWollokFileExtension,
  nodeToLocation,
  sourceMapToRange,
} from './utils/text-documents'
import { isNodeURI, wollokURI, workspacePackage } from './utils/vm/wollok'

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
    range,
    code: problem.code,
    message: reportMessage(problem),
    source: '',
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

export const completions = (
  params: CompletionParams,
  environment: Environment,
): CompletionItem[] => {
  const { position, textDocument, context } = params
  const selectionNode = cursorNode(environment, position, textDocument)

  if (context?.triggerCharacter === '.') {
    // ignore dot
    position.character -= 1
    return completeMessages(environment, findFirstStableNode(selectionNode))
  } else {
    return completionsForNode(findFirstStableNode(selectionNode))
  }
}

function cursorNode(
  environment: Environment,
  position: Position,
  textDocument: TextDocumentIdentifier,
): Node {
  return getNodesByPosition(environment, {
    position,
    textDocument,
  }).reverse()[0]
}

export const definition = (
  textDocumentPosition: TextDocumentPositionParams,
  environment: Environment,
): Location[] => {
  const cursorNodes = getNodesByPosition(environment, textDocumentPosition)
  const definitions = getNodeDefinition(environment)(cursorNodes.reverse()[0])
  return definitions.map(nodeToLocation)
}

export const codeLenses = (
  params: CodeLensParams,
  environment: Environment,
): CodeLens[] | null => {
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

export const formatDocument = (params: DocumentFormattingParams, environment: Environment): TextEdit[] => {
  const file = environment
    .descendants
    .find(n => n.is(Package) && n.sourceFileName === params.textDocument.uri) as Package | undefined

  if(!file){
    throw Error('Missing file information')
  }
  return [
    {
      range: sourceMapToRange(new SourceMap({ start: file.children[0].sourceMap!.start, end: file.children[file.children.length-1].sourceMap!.end })),
      newText: write(0)(file),
    },
  ]

}

export const documentSymbols = (
  params: DocumentSymbolParams,
  environment: Environment,
): DocumentSymbol[] => {
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
  params: WorkspaceSymbolParams,
  environment: Environment,
): WorkspaceSymbol[] => workspaceSymbolsFor(environment, params.query)

const findPackage = (
  uri: string,
  environment: Environment,
): Package | undefined =>
  environment.descendants.filter(is(Package)).find((p) => isNodeURI(p, uri))
