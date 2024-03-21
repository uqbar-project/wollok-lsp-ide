import { Hover, HoverParams } from 'vscode-languageserver'
import { Body, Environment, print } from 'wollok-ts'
import { cursorNode, toVSCRange } from '../utils/text-documents'
import { logger } from '../utils/logger'
import { ClientConfigurations } from '../server'

type TypeDescriptionResponse = Hover | null

export const typeDescriptionOnHover = (environment: Environment, { typeSystem }: ClientConfigurations) => (params: HoverParams): TypeDescriptionResponse => {
  try {
    let node = cursorNode(environment, params.position, params.textDocument)
    if (!node) return null

    if (node.is(Body)) {
      node = node.parent
    }

    const fullKind = typeSystem.enabled ? `${node.kind}: ${node.type.name}` : node.kind

    return {
      contents: [
        {
          language: 'text',
          value: fullKind,
        },
        {
          language: 'wollok',
          value: print(node, { maxWidth: 30, useSpaces: true, abbreviateAssignments: true }),
        },
      ],
      range: node.sourceMap ? toVSCRange(node.sourceMap) : undefined,
    }
  } catch (e) {
    logger.error('Failed to get type description', e)
    return null
  }
}