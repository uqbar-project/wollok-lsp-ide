import { DocumentFormattingParams, DocumentRangeFormattingParams, Position, Range, TextEdit } from 'vscode-languageserver'
import { Environment, Package, print, PrintingMalformedNodeError } from 'wollok-ts'
import { packageFromURI } from '../utils/text-documents'
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
  } catch(error) {
    let message = `✘ Could not format file '${file.fileName}'`
    if (error instanceof PrintingMalformedNodeError) {
      message += `: ${error.message} {${error.node.toString()}}`
    }
    logger.error(message, error)
    return null
  }
}


function getPackage(params: DocumentFormattingParams, environment: Environment): Package {
  const file = packageFromURI(params.textDocument.uri, environment)
  if(!file){
    throw new Error('Could not find file to format') // TODO: shouldn´t we log params.textDocument.uri?
  }
  return file
}