import { combineLatest, filter, firstValueFrom, Subject } from 'rxjs'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  CompletionParams,
  createConnection,
  DidChangeConfigurationNotification,
  Disposable,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  ServerRequestHandler,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node'
import { Environment } from 'wollok-ts'
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
import { ProgressReporter } from './utils/progress-reporter'
import { EnvironmentProvider } from './utils/vm/environment'

export type ClientConfigurations = {
  formatter: { abbreviateAssignments: boolean, maxWidth: number }
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
const requestContext = combineLatest([environmentProvider.$environment.pipe(filter(environment => environment != null)), config])

const requestProgressReporter = new ProgressReporter(connection, { identifier: 'wollok-request', title: 'Processing Request...' })

function syncHandler<Params, Return, PR>(requestHandler: ServerRequestHandler<Params, Return, PR, void>): ServerRequestHandler<Params, Return, PR, void>{
  return (params, cancel, workDoneProgress, resultProgress) => {
    requestProgressReporter.begin()
    const result = requestHandler(params, cancel, workDoneProgress, resultProgress)
    requestProgressReporter.end()
    return result
  }
}

function waitForFirstHandler<Params, Return, PR>(requestHandler: (environment: Environment, settings: ClientConfigurations) => ServerRequestHandler<Params, Return, PR, void>): ServerRequestHandler<Params, Return, PR, void>{
  return (params, cancel, workDoneProgress, resultProgress) => {
    requestProgressReporter.begin()
    return new Promise(resolve => {
      firstValueFrom(requestContext).then(([newEnvironment, newSettings]) => {
        const result = syncHandler(requestHandler(newEnvironment!, newSettings))(params, cancel, workDoneProgress, resultProgress)
        requestProgressReporter.end()
        resolve(result)
      })
    })
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
  environmentProvider.resetEnvironment()
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
  environmentProvider.updateEnvironmentWith(change.document)
)

documents.onDidOpen((change) => {
  environmentProvider.updateEnvironmentWith(change.document)
  validateTextDocument(connection, documents.all())(change.document)(
    environmentProvider.$environment.getValue()!
  )
})

connection.onRequest((change) => {
  if (change === 'STRONG_FILES_CHANGED') {
    environmentProvider.resetEnvironment()
  }
})

connection.onReferences((_params) => {
  return []
})

config.subscribe(() => {
    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument(connection, documents.all()))
})

const handlers: readonly [
  (handler: ServerRequestHandler<any, any, any, any>) =>  Disposable,
  (environment: Environment, settings: ClientConfigurations) => ServerRequestHandler<any, any, any, any>
][] = [
  [connection.onDocumentSymbol, documentSymbols],
  [connection.onWorkspaceSymbol, workspaceSymbols],
  [connection.onCodeLens, codeLenses],
  [connection.onDefinition, definition],
  [connection.onDocumentFormatting, formatDocument],
  [connection.onDocumentRangeFormatting, formatRange],
  [connection.onCompletion, (newEnvironment: Environment) => (params: CompletionParams) => {
    const contextCompletions = completions(params, newEnvironment!)
    return [...contextCompletions, ...templates]
  }],
  [connection.onDefinition, definition],
]

for(const [handlerRegistration, requestHandler] of handlers){
  handlerRegistration(waitForFirstHandler(requestHandler))
}

requestContext.subscribe(([newEnvironment, newSettings]) => {
  for(const [handlerRegistration, requestHandler] of handlers){
    handlerRegistration(syncHandler(requestHandler(newEnvironment!, newSettings)))
  }
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