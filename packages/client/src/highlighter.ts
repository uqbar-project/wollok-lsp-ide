///esModuleIn
import * as vscode from 'vscode'
import { excludeNullish, parse } from 'wollok-ts'
import { WollokNodePlotter, WollokPosition } from './highlighter/utils'
import { processCode, processComments } from './highlighter/tokenProvider'
import { tokenModifiers, tokenTypes } from './highlighter/definition'

const convertToVSCPosition = (position: WollokPosition) =>
  new vscode.Position(position.line, position.column)

const convertToVSCTokens = (wollokNodesPlotter: WollokNodePlotter[]) =>
  excludeNullish(wollokNodesPlotter)
    .filter(wollokNodePlotter => {
      const { range } = wollokNodePlotter
      return !!range && range.start && range.end
    })
    .map(wollokNodePlotter => {
      const { range } = wollokNodePlotter
      const { start, end } = range
      return {
        ...wollokNodePlotter,
        range: new vscode.Range(
          convertToVSCPosition(start),
          convertToVSCPosition(end),
        ),
      }
    })

export const provider: vscode.DocumentSemanticTokensProvider = {
  provideDocumentSemanticTokens(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.SemanticTokens> {
    const tokensBuilder = new vscode.SemanticTokensBuilder(legend)
    const parsedFile = parse.File(document.fileName)
    const textFile = document.getText()
    const parsedPackage = parsedFile.tryParse(textFile)

    const splittedLines = textFile.split('\n')
    const processed = excludeNullish([]
      .concat(convertToVSCTokens(processCode(parsedPackage.members[0], splittedLines)))
      .concat(processComments(splittedLines)))

    processed.forEach((node: WollokNodePlotter) =>
      tokensBuilder.push(node.range as unknown as vscode.Range, node.tokenType, node.tokenModifiers)
    )

    return tokensBuilder.build()
  },
}

export const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers)
export const selector = { language: 'wollok', scheme: 'file' }
