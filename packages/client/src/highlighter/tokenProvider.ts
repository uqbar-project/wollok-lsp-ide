import { WollokNodePlotter } from './utils'
import { plotter, keywords, tokenTypeObj } from './definition'
import { Assignment, Class, Describe, Field, If, Import, KEYWORDS, Literal, match, Method, New, Node, Package, Parameter, Program, Reference, Return, Self, Send, Singleton, Test, Variable, when } from 'wollok-ts'

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
  references: NodeContext | NodeContext[];
}

type ProcesamientoComentario = {
  result: WollokNodePlotter[];
  multilinea?: {
    ln: number,
    col: number,
    len: number
  }[]
  firstLineMC?: number;
  presetIndex?: number;
}

/* ============================================================================ */

function getLine(node: Node, documentLines: string[]): LineResult {
  const start = node.sourceMap.start
  const line = start.line - 1
  const column = start.column - 1

  return {
    line: line,
    column: column,
    word: documentLines[line].substring(column),
  }
}

const nullHighlighting = { result: undefined, references: undefined }

function processNode(node: Node, documentoStr: string[], context: NodeContext[]): HighlightingResult {
  if (!node.sourceMap) return nullHighlighting

  const generatePlotterForNode = (node: NamedNode) => customPlotter(node, node.name, node.kind)
  const customPlotter = (node: Node, token: string, kind = 'Keyword') => {
    const { line, column, word } = getLine(node, documentoStr)
    const col = column + word.indexOf(token)
    return plotter({ ln: line, col, len: token.length }, kind)
  }
  const generatePlotterAfterNode = (node: Node, token: string, kind = 'Keyword') => {
    const { line, column } = node.sourceMap.end
    return plotter({ ln: line - 1, col: column, len: token.length }, kind)
  }
  const defaultKeywordPlotter = (node: Node) => customPlotter(node, keywords[node.kind])

  const saveReference = (node: NamedNode) => ({ name: node.name, type: node.kind })
  const dropSingleReference = (node: WollokNodePlotter): HighlightingResult => dropReference([node])
  const dropReference = (node: WollokNodePlotter[]): HighlightingResult => ({ result: node, references: undefined })

  const resultForReference = (node: Variable | Field) => {
    const result = [
      customPlotter(node, node.isConstant ? KEYWORDS.CONST : KEYWORDS.VAR),
    ]
    .concat(
      ...node.is(Field) && node.isProperty ? [customPlotter(node, KEYWORDS.PROPERTY)] : [],
    ).concat(
      [generatePlotterForNode(node)]
    )
    return {
      result,
      references: saveReference(node),
    }
  }

  const defaultHighlightWithReference = (node: NamedNode) => ({ result: [
      defaultKeywordPlotter(node),
      generatePlotterForNode(node),
    ],
    references: saveReference(node),
  })

  const defaultHighlightNoReference = (node: Node): HighlightingResult => dropSingleReference(defaultKeywordPlotter(node))

  return match(node)(
    when(Class)(node => ({ result: [
        defaultKeywordPlotter(node),
      ].concat(
        node.supertypes.length ? customPlotter(node, KEYWORDS.INHERITS) : []
      ).concat(generatePlotterForNode(node)),
      references: saveReference(node) })
    ),
    when(Singleton)(node => {
      if (node.sourceMap == undefined || node.isClosure()) return nullHighlighting
      const currentNode = node as unknown as NamedNode
      const validName = node.name !== undefined && node.name.trim().length
      const result = [defaultKeywordPlotter(node)]
      if (node.supertypes.length) result.push(customPlotter(node, KEYWORDS.INHERITS))
      if (validName) result.push(generatePlotterForNode(currentNode))
      return {
        result,
        references: validName ? saveReference(currentNode) : undefined,
      }
    }),
    when(Field)(node =>
      node.isSynthetic ? nullHighlighting : resultForReference(node)
    ),
    when(Variable)(resultForReference),
    when(Reference)(node => {
      //node.variable
      //node.value
      //TODO: Si previamente hay un campo del mismo nombre no se toma
      //TODO: los parametros o propiedades se toman como nuevas referencias
      if(node.name == 'wollok.lang.Closure'
      || node.name == 'wollok.lang.List'
      || node.name == 'wollok.lang.Set')
        return nullHighlighting

      const referencia  = context.find(currentNode => currentNode.name === node.name)
      if (referencia){
        const pl = generatePlotterForNode(node)
        pl.tokenType = tokenTypeObj[referencia.type]
        return { result: pl, references: undefined } //no agrego informacion
      }
      return nullHighlighting
    }),
    when(Assignment)(node => ({
      result: [
        defaultKeywordPlotter(node),
      ], references: undefined,
    })),
    when(Parameter)(node => {
      const { line, column, word } = getLine(node, documentoStr)
      const col = column + word.indexOf(node.name)
      return {
        result: [plotter({ ln: line, col, len: node.name.length }, node.kind)],
        references: saveReference(node),
      }
    }),
    when(Method)(node => {
      if (node.isSynthetic) return nullHighlighting

      const { line, column, word } = getLine(node, documentoStr)
      const col = column + word.indexOf(node.name)

      return {
        result: [
          plotter({ ln: line, col, len: node.name.length }, node.kind),
          defaultKeywordPlotter(node),
        ], references: undefined,
      }
    }),
    when(Send)(node => {
      const currentKeyboard = keywords[node.kind]
      const { line, column,  word } = getLine(node, documentoStr)
      if(currentKeyboard && currentKeyboard.includes(node.message)){
        if(node.message == 'negate'){//es la forma alternativa del simbolo '!'
          const idx_negate = word.indexOf('!')
          const col_offset: number= idx_negate == -1? word.indexOf('not'): idx_negate
          const plotKeyboard =  plotter({
            ln: line,
            col: column + col_offset,
            len: idx_negate == -1? 3: 1,
          }, node.kind)
          return dropSingleReference(plotKeyboard)
        }
        const col = column + word.indexOf(node.message)
        const plotKeyboard = plotter({ ln: line, col, len: node.message.length }, node.kind)
        return dropSingleReference(plotKeyboard)
      }
      //if(keywords.Send.includes(node.message)) return null_case
      const col = column + word.indexOf(node.message)
      return {
        result: [plotter({ ln: line, col, len: node.message.length }, 'Method')], //node.kind)
        references: undefined,
      }
    }),
    when(Return)(defaultHighlightNoReference),
    when(Literal)(node => {
      if (node.isSynthetic) return nullHighlighting
      const tipo = typeof node.value
      const { line, column, word } = getLine(node, documentoStr)
      switch (tipo) {
        case 'number':
        case 'bigint':
          const valor_numerico = node.value.toString()
          return dropSingleReference(plotter({
            ln: line,
            col: column + word.indexOf(valor_numerico),
            len: valor_numerico.length,
          }, 'Literal_number'))
        case 'boolean':
          const valor_booleano = node.value.toString()
          return dropSingleReference(plotter({
            ln: line,
            col: column + word.indexOf(valor_booleano),
            len: valor_booleano.length,
          }, 'Literal_bool'))
        case 'string':
          const valor_string = node.value.toString()
          return dropSingleReference(plotter({
            ln: line,
            col: column + word.indexOf(valor_string) - 1,
            len: valor_string.length + 2,
          }, 'Literal_string'))
        default:
          return nullHighlighting
      }
    }),
    when(Package)(node => {
      try {
        return {
          result: [
            defaultKeywordPlotter(node),
            generatePlotterForNode(node),
          ], references: saveReference(node),
        }
      } catch (e) {
        return nullHighlighting
      }
    }),
    when(Import)(node => ({
      result: [
        defaultKeywordPlotter(node),
      ], references: saveReference(node.entity),
    })),
    when(Program)(defaultHighlightWithReference),
    when(Describe)(defaultHighlightWithReference),
    when(Test)(defaultHighlightWithReference),
    when(If)(node => {
      const result = [defaultKeywordPlotter(node)]
      if (node.elseBody && node.elseBody.sourceMap) {
        result.push(generatePlotterAfterNode(node.thenBody, KEYWORDS.ELSE))
      }
      return dropReference(result)
    }),
    when(New)(node => ({
      result: [
        defaultKeywordPlotter(node),
        generatePlotterForNode(node.instantiated),
      ], references: undefined,
    })),
    when(Self)(defaultHighlightNoReference),
    when(Node)(_ => nullHighlighting)
  )
}

export function processCode(node: Node, textDocument: string[]): WollokNodePlotter[] {
  return node.reduce((acum, node: Node) =>
  {
    const processed = processNode(node, textDocument, acum.references)
    return {
      result: acum.result.concat(processed.result ?? []),
      references: acum.references.concat(processed.references || []),
    }
  }, { result: [], references: [{ name: 'console', type: 'Reference' }] }).result
}

//TODO: al no poder procesar comentarios multilinea se transforma a comentarios comunes.
function plotterMultiLinea(arr: any[]) {
  return arr.map( x => plotter(x, 'Comment'))
}

export function processComments(docText: string[]): WollokNodePlotter[] {
  return docText.reduce( processCommentLine, { result:[], multilinea:undefined }).result

  function processCommentLine(acum: ProcesamientoComentario, strln, linea) {
    const indL = strln.indexOf('//')
    const indM = strln.indexOf('/*')
    const presetIndex: number = acum.presetIndex || 0

    if (acum.multilinea !== undefined) {
      const indMf = strln.indexOf('*/')
      if (indMf >= 0) {
        const newLen = indMf + 2 + presetIndex
        const plot = acum.firstLineMC !== undefined?
          { ln: linea, col: acum.firstLineMC, len: indMf + 4 }:
          { ln: linea, col: presetIndex, len: strln.length - presetIndex }
        const temp = plotterMultiLinea([...acum.multilinea, plot])
        const tempconcat = acum.result.concat(temp)
        return processCommentLine({
          result: tempconcat,
          presetIndex: newLen,
        }, strln.substring(indMf + 2), linea)
      } else {
        const plot = acum.firstLineMC !== undefined?
          { ln: linea, col: acum.firstLineMC, len: strln.length + 2 }:
          { ln: linea, col: presetIndex,      len: strln.length }
        return { result: acum.result, multilinea: [...acum.multilinea, plot] }
      }
    }
    //hay un comentario de linea y comienza antes de un posible comentario multilinea
    if (indL != -1 && (indM == -1 || indL < indM)) {
      return {
        result: [
          ...acum.result,
          plotter({ ln: linea, col: indL + presetIndex, len: strln.length - indL }, 'Comment'),
        ],
      }
    }
    //hay un comentario multi-linea y comienza antes de un posible comentario de linea
    if (indM != -1 && (indL == -1 || indM < indL)) {
      return processCommentLine({
        result: acum.result,
        multilinea: [],
        firstLineMC: indM + presetIndex,
        presetIndex: indM + 2 + presetIndex,
      }, strln.substring(indM + 2), linea)
    }
    return { ...acum, presetIndex: undefined }
  }
}