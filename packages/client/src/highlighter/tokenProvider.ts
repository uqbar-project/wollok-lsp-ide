import { Annotation, Assignment, Class, Describe, excludeNullish, Field, If, Import, KEYWORDS, last, Literal, match, Method, Mixin, NamedArgument, New, Node, Package, Parameter, parse, Program, Reference, Return, Self, Send, Singleton, Super, Test, Throw, Try, Variable, when } from 'wollok-ts'
import { WollokKeywords, WollokTokenKinds, NamedNode, NodeContext, HighlightingResult, LineResult, WollokNodePlotter } from './definitions'
import { getLineColumn, mergeHighlightingResults, plotRange, plotSingleLine } from './utils'

const ENTER = '\n'

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
  if (!node.sourceMap) throw new Error(`Node ${node.kind} has no source map!`)
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
const saveAnnotationReference = (annotation: Annotation) =>  [{ name: annotation.name, type: 'Annotation' }]
const saveReference = (node: NamedNode): NodeContext[] => [{ name: node.name, type: node.kind }]
const dropSingleReference = (node: WollokNodePlotter): HighlightingResult => dropReference([node])
const dropReference = (node: WollokNodePlotter[]): HighlightingResult => ({ result: node, references: undefined })

function processNode(node: Node, textDocument: string[], context: NodeContext[]): HighlightingResult {
  if (!node.sourceMap) return nullHighlighting

  // ******************* Plot helpers
  const plot = (node: Node, token: string, kind = 'Keyword', after?: number) => {
    if (!token) throw new Error(`Invalid token for node ${node.kind}`)
    const { line, column, word } = getLine(node, textDocument)
    const columnForToken = column + word.indexOf(token, after)
    return plotSingleLine({ line, column: columnForToken, length: token.length }, kind)
  }
  const plotNode = (node: NamedNode) => plot(node, node.name, node.kind)
  const plotNodeAfter = (node: Node, token: string, kind = 'Keyword') => {
    const { line, column } = node.sourceMap.end
    return plotSingleLine({ line: line - 1, column, length: token.length }, kind)
  }
  const plotKeyword = (node: Node) => plot(node, WollokKeywords[node.kind])
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
    when(Mixin)(node => ({ result: [
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
      if (reference && node.sourceMap){
        return { result: [
          {
            ...plotNode(node),
            tokenType: WollokTokenKinds[reference.type],
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
      const parameterColumn = column + word.indexOf(node.name)
      return {
        result: [plotSingleLine({ line, column: parameterColumn, length: node.name.length }, node.kind)],
        references: saveReference(node),
      }
    }),
    when(Method)(node => {
      if (node.isSynthetic) return nullHighlighting

      const { line, column, word } = getLine(node, textDocument)
      const methodColumn = column + word.indexOf(node.name)

      const result = (node.isOverride ? [plot(node, KEYWORDS.OVERRIDE)] : [])
        .concat(
          [
            plotSingleLine({ line, column: methodColumn, length: node.name.length }, node.kind),
            plotKeyword(node),
          ]
        .concat(node.isNative() ? [plot(node, KEYWORDS.NATIVE, 'Keyword', KEYWORDS.METHOD.length + 1 + node.name.length)] : [])
        )

      return {
        result, references: undefined,
      }
    }),
    when(Send)(node => {
      const symbols = WollokKeywords[node.kind]
      const { line, column,  word } = getLine(node, textDocument)
      if (symbols?.includes(node.message)){

        if (node.message == 'negate') {
          const operator = word.indexOf('!') == -1 ? 'not' : '!'
          const columnOffset = word.indexOf(operator)
          return dropSingleReference(plotSingleLine({
            line,
            column: column + columnOffset,
            length: operator.length,
          }, node.kind))
        }
        const columnForSymbol = column + word.indexOf(node.message)
        const plotKeyboard = plotSingleLine({ line, column: columnForSymbol, length: node.message.length }, node.kind)
        return dropSingleReference(plotKeyboard)
      }
      const columnForMessage = column + word.indexOf(node.message)
      return {
        result: [plotSingleLine({ line, column: columnForMessage, length: node.message.length }, 'Method')], //node.kind)
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
        line,
        column: column + getColumnForLiteral(node, word, value),
        length: getLengthForLiteral(node, value),
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
          ...[_catch.parameterType && _catch.parameterType.sourceMap && plot(_catch.parameterType, _catch.parameterType.name, 'Class')],
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

const processAnnotationsForNode = (node: Node, textDocument: string[], references: NodeContext[]): HighlightingResult => {
  const fullDocument = textDocument.join(ENTER)

  const commentPlotter = (comment: string): WollokNodePlotter[] => {
    const offset = textDocument.join(ENTER).indexOf(comment)
    const start = getLineColumn(textDocument, offset)
    const end = getLineColumn(textDocument, offset + comment.length)
    return plotRange(textDocument, start, end, 'Comment')
  }

  const annotationPlotter = (node: Node, annotationName: string): WollokNodePlotter[] => {
    if (references.find(reference => reference.name === annotationName)) return []

    let after = -1
    const offsets = []
    while ((after = fullDocument.indexOf(`@${annotationName}`, after + 1)) >= 0) {
      offsets.push(after)
    }
    return offsets.map(offset => {
      const { line, column } = getLineColumn(textDocument, offset)
      return plotSingleLine({ line, column, length: annotationName.length + 1 }, 'Annotation')
    })
  }

  const processAnnotation = (annotation: Annotation): HighlightingResult =>
    ({ result: annotation.name === 'comment' ? commentPlotter(annotation.args.text as unknown as string) : annotationPlotter(node, annotation.name), references: saveAnnotationReference(annotation) })

  if (!node.sourceMap) return nullHighlighting

  return (node.metadata ?? []).reduce((finalResult, annotation) => mergeHighlightingResults(
    finalResult, processAnnotation(annotation)
  ), nullHighlighting)
}

const processCode = (node: Node, textDocument: string[]): WollokNodePlotter[] => {
  if (!node) return []

  return node?.reduce((acumResults, node: Node) =>
  {
    const nodeResults = mergeHighlightingResults(processNode(node, textDocument, acumResults.references), processAnnotationsForNode(node, textDocument, acumResults.references))
    return mergeHighlightingResults(acumResults, nodeResults)
  }, { result: [], references: [{ name: 'console', type: 'Reference' }] }).result
}

export const processDocument = (filename: string, textDocument: string): WollokNodePlotter[] => {
  const parsedFile = parse.File(filename)
  const parsedPackage = parsedFile.tryParse(textDocument)
  const EOL = textDocument.includes('\r\n') ? '\r\n' : '\n'
  const splittedLines = textDocument.split(EOL)
  return excludeNullish(processCode(parsedPackage, splittedLines))
}
