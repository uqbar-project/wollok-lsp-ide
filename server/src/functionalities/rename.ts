import { RenameParams, TextDocuments, TextEdit, WorkspaceEdit } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment, Field, Node, Parameter, Reference, targettingAt, Variable } from 'wollok-ts'
import { cursorNode, uriFromRelativeFilePath, toVSCRange } from '../utils/text-documents'

export const rename = (documents: TextDocuments<TextDocument>) => (environment: Environment) => (params: RenameParams): WorkspaceEdit | null => {
  // cast cursor node as it's already validated in prepareRename request
  const renamedNode = cursorNode(environment, params.position, params.textDocument) as Renamable | Reference<Renamable> | undefined
  if(!renamedNode) throw new Error('No node found at position')

  return {
    changes: renamedNode.is(Reference) ?
      groupByURI(renameNode(renamedNode.target!, params.newName, environment, documents)) :
      groupByURI(renameNode(renamedNode, params.newName, environment, documents)),
  }
}

export const requestIsRenamable = (environment: Environment) => (params: RenameParams): any => {
  const renamedNode = cursorNode(environment, params.position, params.textDocument)
  if (!renamedNode) return null
  if (renamedNode.is(Reference) && renamedNode.target && isRenamable(renamedNode.target) || isRenamable(renamedNode)) {
    // ToDo: switch back to defaultBehavior when https://github.com/microsoft/vscode/issues/198423 is released
    return {
      range: toVSCRange(renamedNode.sourceMap!),
      placeholder: renamedNode.name,
    }
  }
  return null
}

type Renamable = Field | Parameter | Variable

function isRenamable(aNode: Node): aNode is Renamable {
  return aNode.is(Field) && !aNode.isProperty || aNode.is(Parameter) || aNode.is(Variable)
}

function renameNode(node: Renamable, newName: string, environment: Environment, documents: TextDocuments<TextDocument>): {uri: string, edit: TextEdit}[]{
  const hits: (Renamable | Reference<Renamable>)[] = [node]
  const referencesRenamedNode = targettingAt(node)
  environment.forEach(aNode => {
    if (!aNode.isSynthetic && referencesRenamedNode(aNode)) {
      hits.push(aNode as Reference<Field>)
    }
  })

  return hits.map(hit => {
    const uri = uriFromRelativeFilePath(hit.sourceFileName!)
    const range = toVSCRange(hit.sourceMap!)
    return {
      uri,
      edit: {
        range,
        newText: documents.get(uri)!.getText(range).replaceAll(hit.name!, newName),
      },
    }
  })
}

function groupByURI(edits: {uri: string, edit: TextEdit}[]): Record<string, TextEdit[]>{
  const result: Record<string, TextEdit[]> = {}
  edits.forEach(({ uri, edit }) => {
    if(!result[uri]) result[uri] = []
    result[uri].push(edit)
  })
  return result
}
