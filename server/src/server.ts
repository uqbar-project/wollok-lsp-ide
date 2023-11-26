import { BehaviorSubject, combineLatest, filter, Subject } from 'rxjs'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  createConnection,
  DidChangeConfigurationNotification,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  ServerRequestHandler,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node'
import { buildEnvironment, Environment } from 'wollok-ts'
import { templates } from './functionalities/autocomplete/templates'
import { formatDocument, formatRange } from './functionalities/formatter'
import {
  codeLenses,
  completions,
  definition,
  documentSymbols,
  validateTextDocument,
  workspaceSymbols,
} from './linter'
import { initializeSettings, WollokLSPSettings } from './settings'
import { EnvironmentProvider } from './utils/vm/environment'
import { ProgressReporter } from './utils/progress-reporter'

export type ClientConfigurations = {
  formatter: { abbreviateAssignments: boolean, maxWith: number }
  'cli-path': string
  language: "Spanish" | "English" | "Based on Local Environment",
  maxNumberOfProblems: number
  trace: { server: "off" |  "messages" | "verbose" }
  openDynamicDiagramOnRepl: boolean
  openInternalDynamicDiagram: boolean
  dynamicDiagramDarkMode: boolean
}


// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

const environmentProvider = new EnvironmentProvider(connection)
const config = new Subject<ClientConfigurations>()

const requestProgressReporter = new ProgressReporter(connection, { identifier: 'wollok-request', title: 'Processing Request...' })

function handler<Params, Return, PR, E>(requestHandler: (params: Params) =>  Return): ServerRequestHandler<Params, Return, PR, E>{
  return (params: Params) => {
    requestProgressReporter.begin()
    const result = requestHandler(params)
    requestProgressReporter.end()
    return result
  }
}

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
      documentFormattingProvider: true,
      documentRangeFormattingProvider: true,
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
  environmentProvider.$environment.next(buildEnvironment([]))
})

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<WollokLSPSettings>> = new Map()

connection.onDidChangeConfiguration(() => {
  connection.workspace.getConfiguration('wollokLSP').then(settings => {
    config.next(settings as ClientConfigurations)
  })
})

// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri)
})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change =>
  environmentProvider.$environment.next(environmentProvider.updateEnvironmentWith(change.document))
)

documents.onDidOpen((change) => {
  const newEnvironment = environmentProvider.updateEnvironmentWith(change.document)
  environmentProvider.$environment.next(newEnvironment)
  validateTextDocument(connection, documents.all())(change.document)(newEnvironment)
})

connection.onRequest((change) => {
  if (change === 'STRONG_FILES_CHANGED') {
    environmentProvider.$environment.next(buildEnvironment([]))
  }
})

connection.onReferences((_params) => {
  return []
})

config.subscribe(() => {
    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument(connection, documents.all()))
})

combineLatest([environmentProvider.$environment.pipe(filter(environment => environment!=null)), config]).subscribe(([newEnvironment, newSettings]) => {
  connection.onDocumentSymbol(handler(documentSymbols(newEnvironment!)))
  connection.onWorkspaceSymbol(handler(workspaceSymbols(newEnvironment!)))

  connection.onCodeLens(handler(codeLenses(newEnvironment!)))

  connection.onDocumentFormatting(handler(formatDocument(newSettings, newEnvironment!)))
  connection.onDocumentRangeFormatting(handler(formatRange(newEnvironment!)))

  connection.onCompletion(handler((params) => {
    const contextCompletions = completions(params, newEnvironment!)
    return [...contextCompletions, ...templates]
  }))

  connection.onDefinition(handler(definition(newEnvironment!)))
})

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