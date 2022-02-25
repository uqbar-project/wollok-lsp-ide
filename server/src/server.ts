import { CompletionItem,
  CompletionItemKind,
  createConnection,
  InitializeParams,
  ProposedFeatures,
  TextDocumentPositionParams,
  TextDocuments,
  TextDocumentSyncKind } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { validateTextDocument } from './linter'
import { initializeSettings, settingsChanged } from './settings'

export const WOLLOK_AUTOCOMPLETE = 'wollok_autocomplete'

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

connection.onInitialize((params: InitializeParams) => {
  initializeSettings(connection, params.capabilities)

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: { resolveProvider: true },
    },
  }
})

connection.onDidChangeConfiguration(change => {
  settingsChanged(connection, change)

  documents.all().forEach(validateTextDocument(connection))
})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
  validateTextDocument(connection)(change.document)
})

connection.onDidChangeWatchedFiles(_change => {
  // Monitored files have change in VSCode
  connection.console.log('We received an file change event')
})

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return [
      {
        label: 'class',
        kind: CompletionItemKind.Class,
        data: 1,
        detail: WOLLOK_AUTOCOMPLETE,
        insertText: 'class ClassName {\n}',
      },
      {
        label: 'object',
        kind: CompletionItemKind.Text,
        data: 2,
        detail: WOLLOK_AUTOCOMPLETE,
        insertText: 'object objectName {\n}',
      },
      {
        label: 'method (with effect)',
        kind: CompletionItemKind.Method,
        data: 3,
        detail: WOLLOK_AUTOCOMPLETE,
        insertText: 'method methodName() {\n}',
      },
      {
        label: 'method (without effect)',
        kind: CompletionItemKind.Method,
        data: 4,
        detail: WOLLOK_AUTOCOMPLETE,
        insertText: 'method methodName() = value',
      },
      {
        label: 'describe',
        kind: CompletionItemKind.Event,
        data: 5,
        detail: WOLLOK_AUTOCOMPLETE,
        insertText: `describe "a group of tests" {
  test "something" {
    assert.that(true)
  }
}
`,
      },
    ]
  }
)

// This handler resolves additional information for the item selected in the completion list.
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    // if (item.data === 1) {
    //   item.detail = 'TypeScript details'
    //   item.documentation = 'TypeScript documentation'
    // }
    return item
  }
)

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.textDocument.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.textDocument.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`)
})
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`)
})
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`)
})
*/

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

// Listen on the connection
connection.listen()