import { Annotation, Assignment, Class, Describe, Field, If, Import, KEYWORDS, last, Literal, match, Method, NamedArgument, New, Node, Package, Parameter, Program, Reference, Return, Self, Send, Singleton, Super, Test, Throw, Try, Variable, when } from 'wollok-ts'
import { keywords, plotSingleLine, tokenTypeObj } from './definitions'
import { getLineColumn, mergeHighlightingResults, WollokNodePlotter } from './utils'

type NodeContext = {
  name: string,
  type: string
}

type NamedNode = Node & { name: string }

type LineResult = {
  line: number,
  column: number,
  word: string,
}

export type HighlightingResult = {
  result: WollokNodePlotter[];
  references: NodeContext[] | undefined;
}

/* ============================================================================ */

const getKindForLiteral = (node: Literal): string | undefined => {
  if (node.isNumeric()) return 'Literal_number'
  if (node.isBoolean()) return 'Literal_bool'
  if (node.isString()) return 'Literal_string'
  return undefined
}

const getLengthForLiteral = (node: Literal, value: string): number =>
  value.length + (node.isString() ? 2 : 0)

const getColumnForLiteral = (node: Literal, word: string, value: string): number =>
  word.indexOf(value) - (node.isString() ? 1 : 0)

/* ============================================================================ */

const getLine = (node: Node, documentLines: string[]): LineResult => {
  const start = node.sourceMap.start
  const line = start.line - 1
  const column = start.column - 1

  return {
    line,
    column,
    word: documentLines[line].substring(column),
  }
}

const nullHighlighting = { result: undefined, references: undefined }

// ******************* References helpers
const saveReference = (node: NamedNode): NodeContext[] => [{ name: node.name, type: node.kind }]
const dropSingleReference = (node: WollokNodePlotter): HighlightingResult => dropReference([node])
const dropReference = (node: WollokNodePlotter[]): HighlightingResult => ({ result: node, references: undefined })

function processNode(node: Node, textDocument: string[], context: NodeContext[]): HighlightingResult {
  if (!node.sourceMap) return nullHighlighting

  // ******************* Plot helpers
  const plot = (node: Node, token: string, kind = 'Keyword', after?: number) => {
    if (!token) throw new Error(`Invalid token for node ${node.kind}`)
    const { line, column, word } = getLine(node, textDocument)
    const col = column + word.indexOf(token, after)
    return plotSingleLine({ ln: line, col, len: token.length }, kind)
  }
  const plotNode = (node: NamedNode) => plot(node, node.name, node.kind)
  const plotNodeAfter = (node: Node, token: string, kind = 'Keyword') => {
    const { line, column } = node.sourceMap.end
    return plotSingleLine({ ln: line - 1, col: column, len: token.length }, kind)
  }
  const plotKeyword = (node: Node) => plot(node, keywords[node.kind])
  const plotReference = (node: Variable | Field) => {
    const result = [
      plot(node, node.isConstant ? KEYWORDS.CONST : KEYWORDS.VAR),
    ]
    .concat(
      ...node.is(Field) && node.isProperty ? [plot(node, KEYWORDS.PROPERTY)] : [],
    ).concat(
      [plotNode(node)]
    )
    return {
      result,
      references: saveReference(node),
    }
  }

  // ******************* Highlight helpers
  const defaultHighlightWithReference = (node: NamedNode) => ({ result: [
      plotKeyword(node),
      plotNode(node),
    ],
    references: saveReference(node),
  })

  const defaultHighlightNoReference = (node: Node): HighlightingResult => dropSingleReference(plotKeyword(node))

  return match(node)(
    when(Class)(node => ({ result: [
        plotKeyword(node),
      ].concat(
        node.supertypes.length ? plot(node, KEYWORDS.INHERITS) : []
      ).concat(plotNode(node)),
      references: saveReference(node) })
    ),
    when(Singleton)(node => {
      if (node.sourceMap == undefined || node.isClosure()) return nullHighlighting
      const currentNode = node as unknown as NamedNode
      const validName = node.name !== undefined && node.name.trim().length
      const result = [plotKeyword(node)]
      if (node.supertypes.length) result.push(plot(node, KEYWORDS.INHERITS))
      if (validName) result.push(plotNode(currentNode))
      return {
        result,
        references: validName ? saveReference(currentNode) : undefined,
      }
    }),
    when(Field)(node =>
      node.isSynthetic ? nullHighlighting : plotReference(node)
    ),
    when(Variable)(plotReference),
    when(Reference)(node => {
      const reference  = context.find(currentNode => currentNode.name === node.name)
      if (reference){
        return { result: [
          {
            ...plotNode(node),
            tokenType: tokenTypeObj[reference.type],
          },
        ], references: undefined }
      }
      return nullHighlighting
    }),
    when(Assignment)(node => ({
      result: [
        plotKeyword(node),
      ], references: undefined,
    })),
    when(NamedArgument)(node => ({
      result: [
        plotNode(node),
      ], references: undefined,
    })),
    when(Parameter)(node => {
      const { line, column, word } = getLine(node, textDocument)
      const col = column + word.indexOf(node.name)
      return {
        result: [plotSingleLine({ ln: line, col, len: node.name.length }, node.kind)],
        references: saveReference(node),
      }
    }),
    when(Method)(node => {
      if (node.isSynthetic) return nullHighlighting

      const { line, column, word } = getLine(node, textDocument)
      const col = column + word.indexOf(node.name)

      const result = (node.isOverride ? [plot(node, KEYWORDS.OVERRIDE)] : [])
        .concat(
          [
            plotSingleLine({ ln: line, col, len: node.name.length }, node.kind),
            plotKeyword(node),
          ]
        .concat(node.isNative() ? [plot(node, KEYWORDS.NATIVE, 'Keyword', KEYWORDS.METHOD.length + 1 + node.name.length)] : [])
        )

      return {
        result, references: undefined,
      }
    }),
    when(Send)(node => {
      const symbols = keywords[node.kind]
      const { line, column,  word } = getLine(node, textDocument)
      if (symbols?.includes(node.message)){

        if (node.message == 'negate') {
          const operator = word.indexOf('!') == -1 ? 'not' : '!'
          const columnOffset = word.indexOf(operator)
          return dropSingleReference(plotSingleLine({
            ln: line,
            col: column + columnOffset,
            len: operator.length,
          }, node.kind))
        }
        const col = column + word.indexOf(node.message)
        const plotKeyboard = plotSingleLine({ ln: line, col, len: node.message.length }, node.kind)
        return dropSingleReference(plotKeyboard)
      }
      const col = column + word.indexOf(node.message)
      return {
        result: [plotSingleLine({ ln: line, col, len: node.message.length }, 'Method')], //node.kind)
        references: undefined,
      }
    }),
    when(Return)(defaultHighlightNoReference),
    when(Literal)(node => {
      if (node.isSynthetic) return nullHighlighting
      if (node.isNull()) return dropSingleReference(plot(node, KEYWORDS.NULL))

      const value = node.value?.toString()
      const literalKind = getKindForLiteral(node)
      if (!literalKind) return nullHighlighting

      const { line, column, word } = getLine(node, textDocument)
      return dropSingleReference(plotSingleLine({
        ln: line,
        col: column + getColumnForLiteral(node, word, value),
        len: getLengthForLiteral(node, value),
      }, literalKind))
    }),
    when(Package)(node => {
      try {
        return {
          result: [
            plotKeyword(node),
            plotNode(node),
          ], references: saveReference(node),
        }
      } catch (e) {
        return nullHighlighting
      }
    }),
    when(Import)(node => ({
      result: [
        plotKeyword(node),
      ], references: saveReference(node.entity),
    })),
    when(Program)(defaultHighlightWithReference),
    when(Describe)(defaultHighlightWithReference),
    when(Test)(node => ({
      result: (node.isOnly ? [plot(node, KEYWORDS.ONLY)] : []).concat([
        plotKeyword(node),
        plotNode(node),
      ]), references: saveReference(node),
    })),
    when(If)(node => {
      const result = [plotKeyword(node)]
      if (node.elseBody?.sourceMap) {
        result.push(plotNodeAfter(node.thenBody, KEYWORDS.ELSE))
      }
      return dropReference(result)
    }),
    when(Try)(node => {
      const result = [
        plotKeyword(node),
        ...node.catches.flatMap(_catch => [
          plotKeyword(_catch),
          ...[_catch.parameterType && plot(_catch.parameterType, _catch.parameterType.name, 'Class')],
        ]),
      ]
      if (node.always?.sourceMap) {
        result.push(plotNodeAfter(node.catches.length ? last(node.catches) : node.body, 'then always'))
      }
      return dropReference(result)
    }),
    when(Throw)(defaultHighlightNoReference),
    when(New)(node => ({
      result: [
        plotKeyword(node),
        plot(node.instantiated, node.instantiated.name, 'Class'),
      ], references: undefined,
    })),
    when(Self)(defaultHighlightNoReference),
    when(Super)(defaultHighlightNoReference),
    when(Node)(_ => nullHighlighting)
  )
}

const processCommentForNode = (node: Node, textDocument: string[]): HighlightingResult => {

  const commentPlotter = (comment: string) => {
    const offset = textDocument.join('\n').indexOf(comment)
    const [line, column] = getLineColumn(textDocument, offset)
    return plotSingleLine({ ln: line, col: column, len: comment.length }, 'Comment')
  }

  if (!node.sourceMap) return nullHighlighting

  const commentsAnnotations = node.metadata.filter(({ name }: Annotation) => name == 'comment')
  return commentsAnnotations.length ?
    { result: commentsAnnotations.map((commentAnnotation) => commentPlotter(commentAnnotation.args.text as unknown as string)), references: undefined } : nullHighlighting
}

export function processCode(node: Node, textDocument: string[]): WollokNodePlotter[] {
  return node.reduce((acumResults, node: Node) =>
  {
    const nodeResults = mergeHighlightingResults(processNode(node, textDocument, acumResults.references), processCommentForNode(node, textDocument))
    return mergeHighlightingResults(acumResults, nodeResults)
  }, { result: [], references: [{ name: 'console', type: 'Reference' }] }).result
}
