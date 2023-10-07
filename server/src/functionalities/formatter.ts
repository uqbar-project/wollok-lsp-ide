import { DocumentFormattingParams, DocumentRangeFormattingParams, Position, TextEdit } from 'vscode-languageserver'
import { Environment } from 'wollok-ts'
import { packageFromURI } from '../utils/text-documents'
import { wollokURI } from '../utils/vm/wollok'

export const formatRange = (params: DocumentRangeFormattingParams, environment: Environment): TextEdit[] => {
  const file = packageFromURI(wollokURI(params.textDocument.uri), environment)
  if(!file){
    throw new Error('Could not find file to format')
  }


  return [TextEdit.insert(Position.create(0, 0), `// ${file.fileName}\n`)]
}

export const formatDocument = (params: DocumentFormattingParams, environment: Environment): TextEdit[] => {
  return [TextEdit.insert(Position.create(0, 0), '// holaaaaa\n')]
}