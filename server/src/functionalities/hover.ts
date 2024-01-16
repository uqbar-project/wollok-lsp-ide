import { Hover, HoverParams, Range } from 'vscode-languageserver'
import { Body, Environment, print } from 'wollok-ts'
import { cursorNode, toVSCRange } from '../utils/text-documents'

type TypeDescriptionResponse = Hover | null

export const typeDescriptionOnHover = (environment: Environment) => (params: HoverParams): TypeDescriptionResponse => {
  let node = cursorNode(environment, params.position, params.textDocument)

  if(node.is(Body)){
    node = node.parent
  }

  try{

    return {
      contents: [
        {
          language: 'text',
          value: `${node.kind}: ${node.type.name}`,
        },
        {
          language: 'wollok',
          value: print(node, { maxWidth: 30, useSpaces: true, abbreviateAssignments: true }),
        },
      ],
      range: node.sourceMap ? toVSCRange(node.sourceMap) : undefined,
    }
  } catch {
    return null
  }
}