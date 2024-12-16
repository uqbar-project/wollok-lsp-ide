///esModuleIn
import * as vscode from 'vscode'
import { excludeNullish, parse } from 'wollok-ts'
import * as def from './highlighter/definition'
import { processCode, processComments } from './highlighter/tokenProvider'

export const provider: vscode.DocumentSemanticTokensProvider = {
  provideDocumentSemanticTokens(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.SemanticTokens> {
    // analyze the document and return semantic tokens

    const tokensBuilder = new vscode.SemanticTokensBuilder(legend)
    const parsedFile = parse.File(document.fileName)
    const docText = document.getText()
    const tp = parsedFile.tryParse(docText)

    const splittedLines = docText.split('\n')
    const processed = excludeNullish([]
      .concat(processCode(tp.members[0], splittedLines))
      .concat(processComments(splittedLines)))

    processed.forEach((node: def.NodePlotter) =>
      tokensBuilder.push(node.range, node.tokenType, node.tokenModifiers)
    )

    return tokensBuilder.build()
  },
}

export const legend = new vscode.SemanticTokensLegend(def.tokenTypes, def.tokenModifiers)
export const selector = { language: 'wollok', scheme: 'file' }
