import { RenameParams, TextDocuments, TextEdit, WorkspaceEdit } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Environment } from 'wollok-ts'
import { Field, Node, Parameter, Reference, Variable } from 'wollok-ts/dist/model'
import { cursorNode, fileNameToURI, toVSCRange } from '../utils/text-documents'
import { referenceOf } from '../utils/vm/wollok'

export const rename = (documents: TextDocuments<TextDocument>) => (environment: Environment) => (params: RenameParams): WorkspaceEdit | null => {
  const renamedNode = cursorNode(environment, params.position, params.textDocument)

  if(!renamedNode) throw new Error('No node found at position')
  if(renamedNode.is(Reference)  && renamedNode.target && isRenamable(renamedNode.target)){
    return { changes: groupByURI(renameNode(renamedNode.target, params.newName, environment, documents)) }
  }

  if(isRenamable(renamedNode)) {
    return { changes: groupByURI(renameNode(renamedNode, params.newName, environment, documents)) }
  }

  return null
}

export const requestIsRenamable = (environment: Environment) => (params: RenameParams): any => {
  const renamedNode = cursorNode(environment, params.position, params.textDocument)
  if(!renamedNode) return null
  if( renamedNode.is(Reference)  && renamedNode.target && isRenamable(renamedNode.target) ||  isRenamable(renamedNode)){
    return { defaultBehavior: true }
  }
  return null
}

type Renamable = Field | Parameter | Variable

function isRenamable<T extends Node>(aNode: T): aNode is T & Renamable {
  return aNode.is(Field) || aNode.is(Parameter) || aNode.is(Variable)
}

function renameNode(node: Renamable, newName: string, environment: Environment, documents: TextDocuments<TextDocument>): {uri: string, edit: TextEdit}[]{
  const hits: (Renamable | Reference<Renamable>)[] = [node]
  const referencesRanamedNode = referenceOf(node)
  environment.forEach(aNode => {
    if(!aNode.isSynthetic && referencesRanamedNode(aNode)) {
      hits.push(aNode as Reference<Field>)
    }
  })

  return hits.map(hit => {
    const uri = fileNameToURI(hit.sourceFileName!)
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
