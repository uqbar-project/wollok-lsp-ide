import { DocumentFormattingParams, DocumentRangeFormattingParams, Position, Range, TextEdit } from 'vscode-languageserver'
import { Environment, Package, print } from 'wollok-ts'
import { packageFromURI } from '../utils/text-documents'
import { wollokURI } from '../utils/vm/wollok'

export const formatRange = (params: DocumentRangeFormattingParams, environment: Environment): TextEdit[] => {
  const file = getPackage(params, environment)


  return [TextEdit.insert(Position.create(0, 0), `// ${file.fileName}\n`)]
}

export const formatDocument = (params: DocumentFormattingParams, environment: Environment): TextEdit[] => {
  const file = getPackage(params, environment)
  return [
    TextEdit.replace(
      Range.create(Position.create(0, 0), Position.create(file.children[file.children.length -1].sourceMap!.end.line+1, 0)),
      print(file)
    ),
  ]
}


function getPackage(params: DocumentFormattingParams, environment: Environment): Package {
  const file = packageFromURI(wollokURI(params.textDocument.uri), environment)
  if(!file){
    throw new Error('Could not find file to format')
  }
  return file
}