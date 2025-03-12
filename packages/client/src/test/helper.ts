/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path'
import {
  extensions,
  Range,
  TextDocument,
  TextEditor,
  Uri,
  window,
  workspace,
} from 'vscode'
import { wollokLSPExtensionId, wollokLSPExtensionPublisher } from '../../../shared/definitions'

export let document: TextDocument
export let editor: TextEditor
export let documentEol: string
export let platformEol: string

/**
 * Activates the lsp-sample extension
 */
export async function activate(docUri: Uri, timeToWait = 2000): Promise<void> {
  // The extensionId is `publisher.name` from package.json
  const wollokExtension = extensions.getExtension(`${wollokLSPExtensionPublisher}.${wollokLSPExtensionId}`)!
  await wollokExtension.activate()
  try {
    document = await workspace.openTextDocument(docUri)
    editor = await window.showTextDocument(document)
    await sleep(timeToWait) // Wait for server activation
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export const getDocumentPath = (docPath: string): string => {
  return path.resolve(__dirname, '../../../../packages/client/testFixture', docPath)
}

export const getDocumentURI = (docPath: string): Uri => {
  return Uri.file(getDocumentPath(docPath))
}

export const getFolderURI = (): Uri => {
  return Uri.file(getDocumentPath(''))
}

export async function setTestContent(content: string): Promise<boolean> {
  const all = new Range(
    document.positionAt(0),
    document.positionAt(document.getText().length),
  )
  return editor.edit((editBuilder) => editBuilder.replace(all, content))
}

export async function setConfiguration(section: string, value: any): Promise<any> {
  return await workspace.getConfiguration('wollokLSP').update(section, value)
}
