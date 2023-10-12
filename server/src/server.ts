import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  CompletionItem,
  createConnection,
  DidChangeConfigurationNotification,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node'
import {
  codeLenses,
  completions,
  definition,
  documentSymbols,
  validateTextDocument,
  workspaceSymbols,
} from './linter'
import { initializeSettings, WollokLSPSettings } from './settings'
import { EnvironmentProvider } from './utils/vm/environment-provider'

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

const environmentProvider: EnvironmentProvider = new EnvironmentProvider(
  connection,
)

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

let hasWorkspaceFolderCapability = false

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities

  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  )

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['.'],
        completionItem: { labelDetailsSupport: true },
      },
      codeLensProvider: { resolveProvider: true },
      referencesProvider: true,
      definitionProvider: true,
      documentSymbolProvider: true,
      workspaceSymbolProvider: true,
    },
  }
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = { workspaceFolders: { supported: true } }
  }
  return result
})

connection.onInitialized(() => {
  connection.client.register(DidChangeConfigurationNotification.type, null)

  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log('Workspace folder change event received.')
    })
  }

  initializeSettings(connection)
  environmentProvider.resetEnvironment()
})

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<WollokLSPSettings>> = new Map()

connection.onDidChangeConfiguration(() => {
  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument(connection, documents.all()))
})

// Only keep settings for open documents
documents.onDidClose((change) => {
  documentSettings.delete(change.document.uri)
})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  environmentProvider.rebuildTextDocument(change.document)
  environmentProvider.withLatestEnvironment(
    validateTextDocument(connection, documents.all())(change.document),
  )
})

documents.onDidOpen((change) => {
  environmentProvider.rebuildTextDocument(change.document)
  environmentProvider.withLatestEnvironment(
    validateTextDocument(connection, documents.all())(change.document),
  )
})

connection.onRequest((change) => {
  if (change === 'STRONG_FILES_CHANGED') {
    environmentProvider.resetEnvironment()
  }
})

// This handler provides the initial list of the completion items.
connection.onCompletion(
  environmentProvider.requestWithEnvironment((params, env) => completions(params, env)),
)

connection.onReferences((_params) => {
  return []
})

connection.onDefinition(environmentProvider.requestWithEnvironment(definition))

// This handler resolves additional information for the item selected in the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => item)

connection.onDocumentSymbol(
  environmentProvider.requestWithEnvironment(documentSymbols),
)

connection.onWorkspaceSymbol(
  environmentProvider.requestWithEnvironment(workspaceSymbols),
)

connection.onCodeLens(environmentProvider.requestWithEnvironment(codeLenses))

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

// Listen on the connection
connection.listen()
