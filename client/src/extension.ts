/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path'
import { ExtensionContext, workspace, languages } from 'vscode'
import { LanguageClient,
  LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import { subscribeWollokCommands } from './commands'
import { allWollokFiles } from './test/helper'

let client: LanguageClient

export function activate(context: ExtensionContext): void {
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join('server', 'out', 'server.js')
  )
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
    documentSelector: [{ scheme: 'file', language: 'wollok' }],
    synchronize: {
      configurationSection: 'wollok-lsp-ide',
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
    },
  }

  // Subscribe Wollok Commands
  subscribeWollokCommands(context)

  // Create the language client and start the client.
  client = new LanguageClient(
    'wollok-lsp-ide',
    'Wollok',
    serverOptions,
    clientOptions
  )

  // Force first validation
  validateWorkspace()

  // Force environment to restart
  const revalidateWorskpace = _event => {
    client.sendRequest('STRONG_FILES_CHANGED').then(validateWorkspace)
  }
  workspace.onDidDeleteFiles(revalidateWorskpace)
  workspace.onDidRenameFiles(revalidateWorskpace)

  // Start the client. This will also launch the server
  client.start()
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined
  }
  return client.stop()
}

function validateWorkspace() {
  allWollokFiles().then(async uris => {
    for (const uri of uris) {
      // Force 'change' on document for server tracking
      const textDoc = await workspace.openTextDocument(uri)
      languages.setTextDocumentLanguage(textDoc, 'wollok')
    }
  })
}