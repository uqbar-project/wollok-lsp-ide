/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CompletionItem,
  CompletionItemKind, createConnection, DidChangeConfigurationNotification, InitializeParams, InitializeResult, ProposedFeatures, TextDocumentPositionParams, TextDocuments, TextDocumentSyncKind } from 'vscode-languageserver/node'
import { validateTextDocument } from './linter'

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

let hasConfigurationCapability = false
let hasWorkspaceFolderCapability = false
let hasDiagnosticRelatedInformationCapability = false

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  )
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  )
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
  )

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: { resolveProvider: true },
    },
  }
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = { workspaceFolders: { supported: true } }
  }
  return result
})

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(DidChangeConfigurationNotification.type, undefined)
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.')
    })
  }
})

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 }
let globalSettings: ExampleSettings = defaultSettings

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map()

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear()
  } else {
    globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		)
  }

  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument(connection))
})

// function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
//   if (!hasConfigurationCapability) {
//     return Promise.resolve(globalSettings)
//   }
//   let result = documentSettings.get(resource)
//   if (!result) {
//     result = connection.workspace.getConfiguration({
//       scopeUri: resource,
//       section: 'languageServerExample',
//     })
//     documentSettings.set(resource, result)
//   }
//   return result
// }

// Only keep settings for open documents
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri)
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

export const WOLLOK_AUTOCOMPLETE = 'wollok_autocomplete'

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