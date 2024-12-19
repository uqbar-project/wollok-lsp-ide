///esModuleIn
import * as vscode from 'vscode'
import { excludeNullish, parse } from 'wollok-ts'
import { NodePlotter } from './highlighter/utils'
import { processCode, processComments } from './highlighter/tokenProvider'
import { tokenModifiers, tokenTypes } from './highlighter/definition'

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

    processed.forEach((node: NodePlotter) =>
      tokensBuilder.push(node.range as unknown as vscode.Range, node.tokenType, node.tokenModifiers)
    )

    return tokensBuilder.build()
  },
}

export const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers)
export const selector = { language: 'wollok', scheme: 'file' }
