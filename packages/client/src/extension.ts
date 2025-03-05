/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path'
import * as vscode from 'vscode'
import {
  ExtensionContext,
  FileDeleteEvent,
  FileRenameEvent,
  StatusBarAlignment,
  languages,
  window,
  workspace,
} from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  WorkDoneProgress,
} from 'vscode-languageclient/node'
import { WollokDebugAdapterFactory, WollokDebugConfigurationProvider } from '../../debug-adapter/src/index'
import { subscribeWollokCommands } from './commands'
import { getLSPMessage } from './messages'
import { LANG_PATH_REQUEST, wollokLSPExtensionId, wollokLSPExtensionPublisher } from '../../shared/definitions'
import { allWollokFiles } from './utils'
import { legend, provider, selector } from './highlighter'

let client: LanguageClient

export function activate(context: ExtensionContext): void {
  // The server is implemented in node
  const serverModule = path.join(__dirname, '../..', 'server', 'src', 'server.js')
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  }

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for Wollok documents
    documentSelector: [selector],
    synchronize: {
      configurationSection: wollokLSPExtensionId,
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
    },
  }

  // Subscribe Wollok Commands
  subscribeWollokCommands(context)

  const semanticTokensProvider = languages.registerDocumentSemanticTokensProvider(selector, provider, legend)
  context.subscriptions.push(semanticTokensProvider)

  // Subscribe Wollok Debug Adapter
  const debuggerFactory = new WollokDebugAdapterFactory(context, vscode.workspace)
  context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('wollok', new WollokDebugConfigurationProvider()))
	context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('wollok', debuggerFactory))

  // Create the language client and start the client.
  client = new LanguageClient(
    wollokLSPExtensionId,
    'Wollok',
    serverOptions,
    clientOptions,
  )

  // Force first validation
  validateWorkspace()
  client.sendRequest(LANG_PATH_REQUEST, vscode.extensions.getExtension([wollokLSPExtensionPublisher, wollokLSPExtensionId].join('.')).extensionUri.path + '/wollok')

  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)

  client.onProgress(WorkDoneProgress.type, 'wollok-build', (progress) => {
    if (progress.kind === 'begin' || progress.kind === 'report') {
      statusBarItem.text = '$(loading~spin) ' + getLSPMessage('wollokBuilding')
      statusBarItem.show()
    } else {
      statusBarItem.hide()
    }
  })

  // Force environment to restart

  type CriticalFileChangeEvent = FileDeleteEvent | FileRenameEvent
  const revalidateWorskpace = (_event: CriticalFileChangeEvent) => {
    const pathForChange = (file: CriticalFileChangeEvent['files'][number]) => 'oldUri' in file ? file.oldUri.fsPath : file.fsPath
    return client.sendRequest(`STRONG_FILES_CHANGED:${_event.files.map(pathForChange).join(',')}`).then(validateWorkspace)
  }

  workspace.onDidDeleteFiles(revalidateWorskpace)
  workspace.onDidRenameFiles(revalidateWorskpace)

  // Start the client. This will also launch the server
  client.start()
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop()
}

async function validateWorkspace() {
  const uris = await allWollokFiles()
  // ToDo check workspaceFolders for undefined and length
  await client.sendRequest(`WORKSPACE_URI:${workspace.workspaceFolders![0].uri}`)
  for (const uri of uris) {
    // Force 'change' on document for server tracking
    const textDoc = await workspace.openTextDocument(uri)
    languages.setTextDocumentLanguage(textDoc, 'wollok')
  }
}
