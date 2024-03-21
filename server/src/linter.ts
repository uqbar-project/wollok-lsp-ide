import {
  CompletionItem,
  CompletionParams,
  Connection,
  Diagnostic,
  DiagnosticSeverity,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, Import, List, Problem, validate } from 'wollok-ts'
import { completionsForNode } from './functionalities/autocomplete/node-completion'
import { completeMessages } from './functionalities/autocomplete/send-completion'
import { reportValidationMessage } from './functionalities/reporter'
import { updateDocumentSettings } from './settings'
import { TimeMeasurer } from './time-measurer'
import {
  cursorNode, isNodeURI, relativeFilePath, trimIn,
} from './utils/text-documents'

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

    const { uri } = document
    connection.sendDiagnostics({ uri, diagnostics })
  }
}

export const validateTextDocument =
  (connection: Connection, allDocuments: TextDocument[]) =>
    (textDocument: TextDocument) =>
      async (environment: Environment): Promise<void> => {
        await updateDocumentSettings(connection)

        try {
          const documentUri = relativeFilePath(textDocument.uri)
          const timeMeasurer = new TimeMeasurer()
          const problems = validate(environment)
          sendDiagnostics(connection, problems, allDocuments)
          timeMeasurer.addTime(`Validating ${documentUri}`)
          timeMeasurer.finalReport()
        } catch (e) {
          generateErrorForFile(connection, textDocument)
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

export const generateErrorForFile = (connection: Connection, textDocument: TextDocument): void => {
  const { uri } = textDocument
  const content = textDocument.getText()

  connection.sendDiagnostics({
    uri,
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