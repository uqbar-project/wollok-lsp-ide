import { combineLatest, filter, firstValueFrom, Subject } from 'rxjs'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  createConnection,
  DidChangeConfigurationNotification,
  Disposable,
  GenericRequestHandler,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  ServerRequestHandler,
  TextDocumentChangeEvent,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node'
import { Environment } from 'wollok-ts'
import { codeLenses } from './functionalities/code-lens'
import { definition } from './functionalities/definition'
import { formatDocument, formatRange } from './functionalities/formatter'
import { typeDescriptionOnHover } from './functionalities/hover'
import { references } from './functionalities/references'
import { rename, requestIsRenamable as isRenamable } from './functionalities/rename'
import { documentSymbols, workspaceSymbols } from './functionalities/symbols'
import {
  validateTextDocument,
} from './linter'
import { initializeSettings, WollokLSPSettings } from './settings'
import { logger } from './utils/logger'
import { ProgressReporter } from './utils/progress-reporter'
import { setWorkspaceUri, WORKSPACE_URI } from './utils/text-documents'
import { EnvironmentProvider } from './utils/vm/environment'
import { completions } from './functionalities/autocomplete/autocomplete'
import { ERROR_MISSING_WORKSPACE_FOLDER, getLSPMessage, SERVER_PROCESSING_REQUEST } from './functionalities/reporter'
import { LANG_PATH_REQUEST } from '../../shared/definitions'

export type ClientConfigurations = {
  formatter: { abbreviateAssignments: boolean, maxWidth: number }
  'cli-path': string
  language: "Spanish" | "English" | "Based on Local Environment",
  maxNumberOfProblems: number
  trace: { server: "off" | "messages" | "verbose" }
  openDynamicDiagramOnRepl: boolean
  openInternalDynamicDiagram: boolean
  dynamicDiagramDarkMode: boolean,
  maxThreshold: number,
  typeSystem: { enabled: boolean }
}


// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

const environmentProvider = new EnvironmentProvider(connection)
const config = new Subject<ClientConfigurations>()
config.forEach(config => environmentProvider.inferTypes = config.typeSystem.enabled)
const requestContext = combineLatest([environmentProvider.$environment.pipe(filter(environment => environment != null)), config])

const requestProgressReporter = new ProgressReporter(connection, { identifier: 'wollok-request', title: getLSPMessage(SERVER_PROCESSING_REQUEST) })

let hasWorkspaceFolderCapability = false
export let WOLLOK_LANG_PATH = null

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
      hoverProvider: true,
      renameProvider: { prepareProvider: true },
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
  try {
    connection.client.register(DidChangeConfigurationNotification.type, null)

    if (hasWorkspaceFolderCapability) {
      connection.workspace.onDidChangeWorkspaceFolders((_event) => {
        connection.console.log('Workspace folder change event received.')
      })
    }
    initializeSettings(connection)
    environmentProvider.resetEnvironment()
  } catch (error) {
    handleError('onInitialized failed', error)
  }
})

connection.onRequest(LANG_PATH_REQUEST, (path: string) => {
  connection.console.log('Wollok language path event received.')
  WOLLOK_LANG_PATH = path
})

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<WollokLSPSettings>> = new Map()

connection.onDidChangeConfiguration(() => {
  try {
    connection.workspace.getConfiguration('wollokLSP').then(settings => {
      config.next(settings as ClientConfigurations)
    })
  } catch (error) {
    handleError('onDidChangeConfiguration failed', error)
  }
})

// Only keep settings for open documents
documents.onDidClose((change) => {
  try {
    documentSettings.delete(change.document.uri)
  } catch (error) {
    handleError('onDidClose event failed', error)
  }
})

const deferredChanges: TextDocumentChangeEvent<TextDocument>[] = []

const rebuildTextDocument = (change: TextDocumentChangeEvent<TextDocument>) => {
  try {
    if (!WORKSPACE_URI) { // Too fast! We cannot yet...
      deferredChanges.push(change) // Will be executed when workspace folder arrive
      throw new Error(getLSPMessage(ERROR_MISSING_WORKSPACE_FOLDER))
    }
    if(!change.document.uri.includes(WORKSPACE_URI)) return
    environmentProvider.updateEnvironmentWith(change.document)
    validateTextDocument(connection, lintableOpenDocuments())(change.document)(
      environmentProvider.$environment.getValue()!
    )
  } catch (e) {
    handleError('Failed to rebuild document', e)
  }
}

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(rebuildTextDocument)

// Custom requests from client
connection.onRequest((change) => {
  logger.info(`onRequest - ${change}`)
  try {
    if (change.startsWith('WORKSPACE_URI')) { // WORKSPACE_URI:[uri]
      setWorkspaceUri('file:' + change.split(':').pop())
      deferredChanges.forEach(rebuildTextDocument)
      deferredChanges.length = 0
    }

    if (change.startsWith('STRONG_FILES_CHANGED')) { // A file was deleted, renamed, moved, etc.
      environmentProvider.resetEnvironment()
      environmentProvider.updateEnvironmentWith(...lintableOpenDocuments())

      // Remove zombies problems
      const files = change.split(':').pop()
      if (files) {
        const uris = files.split(',')
        setTimeout(() => {
          uris.forEach(uri => {
            logger.info(`Removing diagnostics from ${uri}`)
            connection.sendDiagnostics({ uri, diagnostics: [] })
          })
        }, 100)
      }
    }
  } catch (error) {
    handleError('onRequest change failed', error)
  }
})

config.subscribe(() => {
  try {
    // Revalidate all open text documents
    const docs = lintableOpenDocuments()
    environmentProvider.updateEnvironmentWith(...docs)
    docs.forEach(doc =>
      validateTextDocument(connection, docs)(doc)(environmentProvider.$environment.getValue()!)
    )
  } catch (error) {
    handleError('Updating environment failed', error)
  }
})

const handlers: readonly [
  (handler: GenericRequestHandler<any, any>) => Disposable,
  (environment: Environment, settings: ClientConfigurations) => GenericRequestHandler<any, any>
][] = [
    [connection.onDocumentSymbol, documentSymbols],
    [connection.onWorkspaceSymbol, workspaceSymbols],
    [connection.onCodeLens, codeLenses],
    [connection.onDefinition, definition],
    [connection.onDocumentFormatting, formatDocument],
    [connection.onDocumentRangeFormatting, formatRange],
    [connection.onCompletion, completions],
    [connection.onPrepareRename, isRenamable],
    [connection.onRenameRequest, rename(documents)],
    [connection.onHover, typeDescriptionOnHover],
    [connection.onReferences, references],
  ]

try {
  for (const [handlerRegistration, requestHandler] of handlers) {
    handlerRegistration(waitForFirstHandler(requestHandler))
  }
} catch (error) {
  handleError('Handling registration for first time failed', error)
}

requestContext.subscribe(([newEnvironment, newSettings]) => {
  try {
    for (const [handlerRegistration, requestHandler] of handlers) {
      handlerRegistration(syncHandler(requestHandler(newEnvironment!, newSettings)))
    }
  } catch (error) {
    handleError('There was an error while processing a request during a change of environment', error)
  }
})

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

// Listen on the connection
connection.listen()

/*************************************************************************************************************/
/* Internal functions                                                                                        */
/*************************************************************************************************************/

function handleError(message: string, e: unknown): void {
  connection.console.error(`✘ ${message}: ${e}`)
  logger.error(`✘ ${message}`, e)
}

function syncHandler<Params, Return, PR>(requestHandler: ServerRequestHandler<Params, Return, PR, void>): ServerRequestHandler<Params, Return | null, PR, void> {
  return (params, cancel, workDoneProgress, resultProgress) => {
    requestProgressReporter.begin()
    try {
      return requestHandler(params, cancel, workDoneProgress, resultProgress)
    } finally {
      requestProgressReporter.end()
    }
  }
}

function waitForFirstHandler<Params, Return, PR>(requestHandler: (environment: Environment, settings: ClientConfigurations) => ServerRequestHandler<Params, Return, PR, void>): ServerRequestHandler<Params, Return | null, PR, void> {
  return (params, cancel, workDoneProgress, resultProgress) => {
    requestProgressReporter.begin()
    return new Promise(resolve => {
      firstValueFrom(requestContext).then(([newEnvironment, newSettings]) => {
        const result = syncHandler(requestHandler(newEnvironment!, newSettings))(params, cancel, workDoneProgress, resultProgress)
        requestProgressReporter.end()
        resolve(result)
      },
      error => {
        requestProgressReporter.end()
        throw error
      })
    })
  }
}

function lintableOpenDocuments(): TextDocument[] {
  return documents.all().filter(document => document.uri.includes(WORKSPACE_URI))
}