import { WollokNodePlotter } from './utils'
import { plotter, keywords, tokenTypeObj } from './definition'
import { Assignment, Class, Describe, Field, If, Import, KEYWORDS, Literal, match, Method, New, Node, Package, Parameter, Program, Reference, Return, Self, Send, Singleton, Test, Variable, when } from 'wollok-ts'

type NodeContext = {
  name: string,
  type: string
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

  const generatePlotter = (node: NamedNode) => keywordPlotter(node, node.name, node.kind)
  const keywordPlotter = (node: Node, token: string, kind = 'Keyword') => {
    const { line, column, word } = getLine(node, documentoStr)
    const col = column + word.indexOf(token)
    return plotter({ ln: line, col, len: token.length }, kind)
  }
  const defaultKeywordPlotter = (node: Node) => keywordPlotter(node, keywords[node.kind])

  const saveReference = (node: NamedNode) => ({ name: node.name, type: node.kind })
  const dropSingleReference = (node: WollokNodePlotter): HighlightingResult => dropReference([node])
  const dropReference = (node: WollokNodePlotter[]): HighlightingResult => ({ result: node, references: undefined })

  const resultForReference = (node: Variable | Field) => {
    const result = [
      keywordPlotter(node, node.isConstant ? KEYWORDS.CONST : KEYWORDS.VAR),
    ]
    .concat(
      ...node.is(Field) && node.isProperty ? [keywordPlotter(node, KEYWORDS.PROPERTY)] : [],
    ).concat(
      [generatePlotter(node)]
    )
    return {
      result,
      references: saveReference(node),
    }
  }

  const defaultHighlight = (node: Node): HighlightingResult => dropSingleReference(defaultKeywordPlotter(node))

  // TODO: ubicarlo dentro del match
  if (node.is(If)) {
    const ifKeywords = [defaultKeywordPlotter(node)]
    // if(node.elseBody)
    //   if_keywords.push(keyword_plotter(node, keywords['Else']))
    return dropReference(ifKeywords)
  }
  if (node.is(Describe) || node.is(Test)) {
    return dropReference([
      defaultKeywordPlotter(node),
      generatePlotter(node),
    ])
  }

  return match(node)(
    when(Class)(node => ({ result: [
        defaultKeywordPlotter(node),
      ].concat(
        node.supertypes.length ? keywordPlotter(node, KEYWORDS.INHERITS) : []
      ).concat(generatePlotter(node)),
      references: saveReference(node) })
    ),
    when(Singleton)(node => {
      if (node.sourceMap == undefined) return nullHighlighting
      const currentNode = {
        ...node,
        name: node.name ?? '',
      } as unknown as NamedNode
      return { result: [
        !node.isClosure() ? defaultKeywordPlotter(node) : [],
        node.supertypes.length ? keywordPlotter(node, KEYWORDS.INHERITS) : [],
        node.name ? generatePlotter(node as unknown as NamedNode) : [],
      ], references: saveReference(currentNode) }
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
      //TODO: Encontrar la forma de incorporar referencias de las importaciones
      if (referencia){
        const pl = generatePlotter(node)
        pl.tokenType = tokenTypeObj[referencia.type]
        return { result: pl, references: undefined } //no agrego informacion
      }
      return nullHighlighting
    }),
    when(Assignment)(node => {
      return {
        result: [
          defaultKeywordPlotter(node),
        ], references: undefined,
      }
    }),
    when(Parameter)(node => {
      const { line, column, word } = getLine(node, documentoStr)
      const col = column + word.indexOf(node.name)
      return {
        result: [plotter({ ln: line, col, len: node.name.length }, node.kind)],
        references: saveReference(node),
      }
    }),
    when(Method)(node => {
      if(node.isSynthetic){ //es un singleton closure
        return nullHighlighting
      }

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
    when(Return)(node => {
      return dropSingleReference(defaultKeywordPlotter(node))
    }),
    when(Literal)(node => {
      if(node.isSynthetic) return nullHighlighting
      const tipo = typeof node.value
      if(tipo == 'object'){
        const closure = node.value as unknown as Singleton
        if(closure){
          //Literal<Singleton> es un Closure. contiene Field y Method
          /*closure.forEach(nodo => {
            nodo
          })*/
        }
        return nullHighlighting//plotter({ ln: linea, col: col, len: len }, 'Singleton')
      }

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
      //el nombre puede o no estar
      try { //alternativamente examinar si el keyword tiene indice negativo
        return {
          result: [
            defaultKeywordPlotter(node),
            generatePlotter(node),
          ], references: saveReference(node),
        }}
      catch(e){
        return nullHighlighting
      }
    }),
    when(Import)(node => {
      return {
        result: [
          defaultKeywordPlotter(node),
          generatePlotter(node.entity),
        ], references: saveReference(node.entity),
      }
    }),
    when(Program)(node => dropReference([
      defaultKeywordPlotter(node),
      generatePlotter(node),
    ])),
    when(Describe)(defaultHighlight),
    when(Test)(defaultHighlight),
    when(If)(defaultHighlight),
    when(New)(defaultHighlight),
    when(Self)(defaultHighlight),
    when(Node)(_ => nullHighlighting)
  )
}

export function processCode(node: Node, documentoStr: string[]): WollokNodePlotter[] {
  return node.reduce((acum, node: Node) =>
  {
    const proc_nodo = processNode(node, documentoStr, acum.references)

    return {
      result: proc_nodo.result? acum.result.concat(proc_nodo.result):acum.result,
      references: acum.references.concat(proc_nodo.references || []),
    }
  }, { result:[], references: [{ name: 'console', type: 'Reference' }] }).result
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