import { plotter, NodePlotter, keywords, tokenTypeObj } from './definition'
import { Assignment, Class, Describe, Field, If, Import, Literal, match, Method, Node, Package, Parameter, Program, Reference, Return, Send, Singleton, Test, Variable, when } from 'wollok-ts'

//Nota: no todos los node's tienen .start (dando undefined), pueden provocar excepciones.
function extraerLineaColumna(node: Node, documentoStr: string[]) {
  const linea = node.sourceMap.start.line-1
  const columna = node.sourceMap.start.column-1

  return {
    linea: linea,
    columna: columna,
    subStr:documentoStr[linea].substring(columna),
  }
}

function processNode(node: Node, documentoStr: string[], context: NodeContext[]): HighlightingResult {
  const generar_plotter = node => {
    const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
    const col = columna + subStr.indexOf(node.name)
    return plotter({ ln: linea, col: col, len: node.name.length }, node.kind)
  }
  const keyword_plotter = (node, mensaje) => {
    const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
    const col = columna + subStr.indexOf(mensaje)
    return plotter({ ln: linea, col: col, len: mensaje.length }, 'Keyword')
  }
  const saveReference = node => { return { name: node.name, type: node.kind }}
  const dropReference = node => { return { result: node, references: undefined }}
  const nullHighlighting = { result: undefined, references: undefined }

  if(node.kind === 'New' || node.kind === 'Self'){ //por alguna razon no hace match
    return dropReference(keyword_plotter(node, keywords[node.kind]))
  }
  if(node.kind === 'If'){ //por alguna razon no hace match
    const if_keywords = [keyword_plotter(node, keywords[node.kind])]
    // if(node.elseBody)
    //   if_keywords.push(keyword_plotter(node, keywords['Else']))
    return dropReference(if_keywords)
  }
  if(node.kind === 'Describe' || node.kind === 'Test'){ //tampoco hay match, se consideran 'Entity'
    return dropReference([
      keyword_plotter(node, keywords[node.kind]),
      generar_plotter(node),
    ])
  }

  return match(node)(
    when(Class)(node => {
      const acum = []
      acum.push(keyword_plotter(node, 'class'))
      node.supertypes.length>0 && acum.push(keyword_plotter(node, 'inherits'))
      acum.push(generar_plotter(node))
      return { result: acum, references: saveReference(node) }
    }),
    when(Singleton)(node => {
      if(node.sourceMap == undefined) return nullHighlighting
      const acum = []
      node.members.reduce((prev, curr) => !curr.name.startsWith('<') && prev, true)
        && acum.push(keyword_plotter(node, keywords[node.kind]))
      acum.push(generar_plotter(node))
      return { result: acum, references: saveReference(node) }
    }),
    when(Field)(node => {
      if(node.isSynthetic) return nullHighlighting
      return {
        result: [
          keyword_plotter(node, keywords[node.kind]),
          generar_plotter(node),
        ],
        references: saveReference(node),
      }
    }),
    when(Variable)(node => {
      return {
        result: [
          generar_plotter(node),
          keyword_plotter(node, node.isConstant? 'const':'var'),
        ],
        references: saveReference(node),
      }
    }),
    when(Reference)(node => {
      //node.variable
      //node.value
      //TODO: Si previamente hay un campo del mismo nombre no se toma
      //TODO: los parametros o propiedades se toman como nuevas referencias
      if(node.name == 'wollok.lang.Closure'
      || node.name == 'wollok.lang.List'
      || node.name == 'wollok.lang.Set')
        return nullHighlighting

      const referencia  = context.find(x => x.name==node.name)
      //TODO: Encontrar la forma de incorporar referencias de las importaciones
      //como console
      if(referencia){
        const pl = generar_plotter(node)
        pl.tokenType = tokenTypeObj[referencia.type]
        return { result: pl, references: undefined } //no agrego informacion
      }
      return nullHighlighting
    }),
    when(Assignment)(node => {
      //node.variable
      //node.value
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.variable.name)
      return {
        result: [
          plotter({ ln: linea, col: col, len: node.variable.name.length }, node.kind),
          keyword_plotter(node, keywords[node.kind]),
        ], references: undefined,
      }
    }),
    when(Parameter)(node => {
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.name)
      return {
        result: [plotter({ ln: linea, col: col, len: node.name.length }, node.kind)],
        references: saveReference(node),
      }
    }),
    when(Method)(node => {
      if(node.isSynthetic){ //es un singleton closure
        return nullHighlighting
      }

      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.name)

      return {
        result: [
          plotter({ ln: linea, col: col, len: node.name.length }, node.kind),
          keyword_plotter(node, keywords[node.kind]),
        ], references: undefined,
      }
    }),
    when(Send)(node => {
      const curretKeyboard = keywords[node.kind]
      const { linea, columna,  subStr } = extraerLineaColumna(node, documentoStr)
      if(curretKeyboard && curretKeyboard.includes(node.message)){
        if(node.message == 'negate'){//es la forma alternativa del simbolo '!'
          const idx_negate = subStr.indexOf('!')
          const col_offset: number= idx_negate == -1? subStr.indexOf('not'): idx_negate
          const plotKeyboard =  plotter({
            ln: linea,
            col: columna + col_offset,
            len: idx_negate == -1? 3: 1,
          }, node.kind)
          return dropReference(plotKeyboard)
        }
        const col = columna + subStr.indexOf(node.message)
        const plotKeyboard = plotter({ ln: linea, col: col, len: node.message.length }, node.kind)
        return dropReference(plotKeyboard)
      }
      //if(keywords.Send.includes(node.message)) return null_case
      const col = columna + subStr.indexOf(node.message)
      return {
        result: plotter({ ln: linea, col: col, len: node.message.length }, 'Method'), //node.kind)
        references: undefined,
      }
    }),
    when(Return)(node => {
      return dropReference(keyword_plotter(node, keywords[node.kind]))
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

      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      switch (tipo) {
        case 'number':
        case 'bigint':
          const valor_numerico = node.value.toString()
          return dropReference(plotter({
            ln: linea,
            col: columna + subStr.indexOf(valor_numerico),
            len: valor_numerico.length,
          }, 'Literal_number'))
        case 'boolean':
          const valor_booleano = node.value.toString()
          return dropReference(plotter({
            ln: linea,
            col: columna + subStr.indexOf(valor_booleano),
            len: valor_booleano.length,
          }, 'Literal_bool'))
        case 'string':
          const valor_string = node.value.toString()
          return dropReference(plotter({
            ln: linea,
            col: columna + subStr.indexOf(valor_string) - 1,
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
            keyword_plotter(node, keywords[node.kind]),
            generar_plotter(node),
          ], references: saveReference(node),
        }}
      catch(e){
        //console.log('Package '+ node.name + ' no encontrado', e)
        return nullHighlighting
      }
    }),
    when(Import)(node => {
      return {
        result: [
          keyword_plotter(node, keywords[node.kind]),
          generar_plotter(node.entity),
        ], references: saveReference(node.entity),
      }
    }),
    when(Program)(node => {
      return dropReference([
        keyword_plotter(node, keywords[node.kind]),
        generar_plotter(node),
      ])
    }),
    when(Describe)(node => {
      return dropReference(keyword_plotter(node, keywords[node.kind]))
    }),
    when(Test)(node => {
      return dropReference(keyword_plotter(node, keywords[node.kind]))
    }),
    when(If)(node => {
      return dropReference(keyword_plotter(node, keywords[node.kind]))
    }),
    when(Node)(_ => nullHighlighting)
  )
}

type NodeContext = {
  name: string,
  type: string
}

export type HighlightingResult = {
  result: NodePlotter[];
  references: NodeContext | NodeContext[];
}

export function processCode(node: Node, documentoStr: string[]): NodePlotter[] {
  return node.reduce((acum, node: Node) =>
  {
    const proc_nodo = processNode(node, documentoStr, acum.references)

    return {
      result: proc_nodo.result? acum.result.concat(proc_nodo.result):acum.result,
      references: acum.references.concat(proc_nodo.references || []),
    }
  }, { result:[], references: [{ name: 'console', type: 'Reference' }] }).result
}
//return { result: [...acum.result, procesar(node, documentoStr), plotKeyboard], references: acum.references }
//return { result: [...acum.result, procesar(node, documentoStr), plotKeyboard], references: acum.references}

//TODO: al no poder procesar comentarios multilinea se transforma a comentarios comunes.
function plotterMultiLinea(arr: any[]) {
  return arr.map( x => plotter(x, 'Comment'))
}

type ProcesamientoComentario = {
  result: NodePlotter[];
  multilinea?: {
    ln: number,
    col: number,
    len: number
  }[]
  firstLineMC?: number;
  presetIndex?: number;
}

export function processComments(docText: string[]): NodePlotter[] {
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
