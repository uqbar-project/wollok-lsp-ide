///esModuleIn
import * as vscode from 'vscode'
import { tokenModifiers, tokenTypes, WollokNodePlotter, WollokPosition } from './highlighter/definitions'
import { processDocument } from './highlighter/tokenProvider'
import { wollokLSPExtensionCode } from '@shared/definitions'

const convertToVSCPosition = (position: WollokPosition) =>
  new vscode.Position(position.line, position.column)

const convertToVSCToken = (wollokNodePlotter: WollokNodePlotter) => {
  const { range } = wollokNodePlotter
  const { start, end } = range
  return {
    ...wollokNodePlotter,
    range: new vscode.Range(
      convertToVSCPosition(start),
      convertToVSCPosition(end),
    ),
  }
}

export const provider: vscode.DocumentSemanticTokensProvider = {
  provideDocumentSemanticTokens(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.SemanticTokens> {
    const wollokLSPConfiguration = vscode.workspace.getConfiguration(wollokLSPExtensionCode)
    const highlighterActivated = wollokLSPConfiguration.get('astHighlighter.activated') as boolean
    if (highlighterActivated) {
      const tokensBuilder = new vscode.SemanticTokensBuilder(legend)
      processDocument(document.fileName, document.getText()).forEach((node: WollokNodePlotter) => {
        const vscToken = convertToVSCToken(node)
        tokensBuilder.push(vscToken.range as unknown as vscode.Range, vscToken.tokenType, vscToken.tokenModifiers)
      })
      return tokensBuilder.build()
    }
  },
}

export const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers)
export const selector = { language: 'wollok', scheme: 'file' }
