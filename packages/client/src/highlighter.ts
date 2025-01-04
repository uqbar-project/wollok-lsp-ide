///esModuleIn
import * as vscode from 'vscode'
import { excludeNullish, parse } from 'wollok-ts'
import { WollokNodePlotter, WollokPosition } from './highlighter/utils'
import { processCode } from './highlighter/tokenProvider'
import { tokenModifiers, tokenTypes } from './highlighter/definitions'

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
    const tokensBuilder = new vscode.SemanticTokensBuilder(legend)
    const parsedFile = parse.File(document.fileName)
    const textFile = document.getText()
    const parsedPackage = parsedFile.tryParse(textFile)
    const packageNode = parsedPackage.members[0]

    const splittedLines = textFile.split('\n')
    const processed = excludeNullish(processCode(packageNode, splittedLines))

    processed.forEach((node: WollokNodePlotter) => {
      const vscToken = convertToVSCToken(node)
      tokensBuilder.push(vscToken.range as unknown as vscode.Range, vscToken.tokenType, vscToken.tokenModifiers)
    })
    return tokensBuilder.build()
  },
}

export const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers)
export const selector = { language: 'wollok', scheme: 'file' }
