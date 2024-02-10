import { DocumentFormattingParams, DocumentRangeFormattingParams, Position, Range, TextEdit } from 'vscode-languageserver'
import { Environment, Package, print } from 'wollok-ts'
import { PrintingMalformedNodeError } from 'wollok-ts/dist/printer/exceptions'
import { packageFromURI } from '../utils/text-documents'
import { wollokURI } from '../utils/vm/wollok'
import { ClientConfigurations } from '../server'
import { logger } from '../utils/logger'

export const formatRange = (environment: Environment) => (params: DocumentRangeFormattingParams): TextEdit[] => {
  const file = getPackage(params, environment)


  return [TextEdit.insert(Position.create(0, 0), `// ${file.fileName}\n`)]
}

export const formatDocument = (environment: Environment, { formatter: formatterConfig }: ClientConfigurations) => (params: DocumentFormattingParams): TextEdit[] | null => {
  const file = getPackage(params, environment)
  try{
    return [
      TextEdit.replace(
        Range.create(Position.create(0, 0), Position.create(file.children[file.children.length -1].sourceMap!.end.line+1, 0)),
        print(file, {
          maxWidth: formatterConfig.maxWidth,
          useSpaces: params.options.insertSpaces,
          abbreviateAssignments: formatterConfig.abbreviateAssignments,
        })
      ),
    ]
  } catch(err) {
    let message = `Could not format file '${file.fileName}'`
    if(err instanceof PrintingMalformedNodeError){
      message += `: ${err.message} {${err.node.toString()}}`
    }
    logger.error(message)
    return null
  }
}


function getPackage(params: DocumentFormattingParams, environment: Environment): Package {
  const file = packageFromURI(wollokURI(params.textDocument.uri), environment)
  if(!file){
    throw new Error('Could not find file to format')
  }
  return file
}