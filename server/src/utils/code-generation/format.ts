import { Assignment, Body, Expression, Field, Literal, Method, Node, Package, Parameter, Reference, Return, Send, Sentence, Singleton, Test, Variable } from 'wollok-ts'
import { IDoc, braces, dquotes, enclose, group, intersperse, lineBreak, lineBreaks, parens, render, softBreak, softLine } from 'prettier-printer'
import { List, match, when } from 'wollok-ts/dist/extensions'
import { CONSTANTS, INFIX_OPERATORS } from './wollok-code'
import { body, indent } from './pretty-print'

 const WS = ' ' as IDoc

export const print = (node: Node): string => {
  return render(30, format(node))
}

// --------------------------
// ----NODE FORMATTERS-------
// --------------------------

export type Formatter<T extends Node> = (node: T) => IDoc

export const format: Formatter<Node> = (node) => {
  return match(node)(
    when(Package)(formatPackage),
    when(Assignment)(formatAssignment),
    when(Singleton)(formatSingleton),
    when(Method)(formatMethod),
    when(Field)(formatVariable),
    when(Variable)(formatVariable),
    when(Test)(formatTest),
    when(Parameter)(formatParameter),
    when(Literal)(formatLiteral),
    when(Body)(formatBody),
    when(Send)(formatSend),
    when(Return)(formatReturn),
    when(Reference)(formatReference),
  )
}

const formatPackage: Formatter<Package> = (node: Package) => {
  return intersperse(lineBreaks, node.children.map(format))
}

const formatMethod: Formatter<Method> = (node: Method) => {
  // ToDo metodos de consulta
  const signature = [
    CONSTANTS.METHOD,
    WS,
    node.name,
    enclose(parens, formatParameters(node.parameters)),
  ]

  if(node.body){
    if(node.body === 'native')
      return [signature, WS, CONSTANTS.NATIVE]
    else if(node.body.sentences.length === 1 && node.body.sentences[0].is(Return) && node.body.sentences[0].value)
      return intersperse(WS, [signature, CONSTANTS.ASIGNATION, format(node.body.sentences[0].value)])
    else
    return [signature, WS, format(node.body)]
  } else {
    return signature
  }
}

const formatBody: Formatter<Body> = (node: Body) => body(formatSentences(node.sentences))

const formatReturn = (node: Return) => node.value ?
  [CONSTANTS.RETURN, WS,  format(node.value)]
  : CONSTANTS.RETURN

const formatReference = (node: Reference<Node>) => node.name

const formatVariable: Formatter<Field | Variable> = (node) => {
  return [
    node.isConstant ? CONSTANTS.CONST : CONSTANTS.VAR,
    WS,
    formatAssign(node.name, node.value),
  ]
}

const formatParameter: Formatter<Parameter> = (node: Parameter) => node.name

const formatTest: Formatter<Test> = (node: Test) => {
  return intersperse(WS, [
    CONSTANTS.TEST,
    node.name,
  ])
}

const formatAssignment: Formatter<Assignment>=(node: Assignment) => formatAssign(node.variable.name, node.value)


const formatLiteral: Formatter<Literal> = (node: Literal) => {
  switch(typeof node.value) {
    case 'string':
      return enclose(dquotes, node.value)
    case 'number':
      return node.value.toString() //ToDo presition
    case 'boolean':
      return `${node.value}`
    case 'undefined':
      return CONSTANTS.NULL
    default:
      return node.value?.toString() + typeof node.value //ToDo  lists, sets, etc
  }
}


// SINGLETON FORMATTERS

const formatSingleton: Formatter<Singleton> = (node: Singleton) => {
  if(node.name){
    return formatWKO(node)
  } else {
    if(node.isClosure()){
      return  formatClosure(node)
    } else {
      return formatAnonymousSingleton(node)
    }
  }
}

const formatClosure: Formatter<Singleton> = (node: Singleton) => {
  const applyMethod = node.members[0] as Method
  const parameters = applyMethod.parameters.length > 0 ?
    [WS, formatParameters(applyMethod.parameters), WS, CONSTANTS.CLOSURE_BEGIN]
    : []
  return enclose(braces, [parameters, lineBreak, indent(formatSentences((applyMethod.body! as Body).sentences, true)), lineBreak])
}

const formatAnonymousSingleton: Formatter<Singleton> = (node: Singleton) => intersperse(WS, [
  CONSTANTS.WKO,
  body(intersperse(lineBreaks, node.members.map(format))),
])

const formatWKO: Formatter<Singleton> = (node: Singleton) => intersperse(WS, [
  CONSTANTS.WKO,
  node.name!,
  body(intersperse(lineBreaks, node.members.map(format))),
])

// SEND FORMATTERS

const formatSend = (node: Send) => {
  return INFIX_OPERATORS.includes(node.message) ?
    formatInfixSend(node)
    : formatDotSend(node)
}

const formatDotSend = (node: Send) => [
  format(node.receiver),
  CONSTANTS.SEND_OPERATOR,
  node.message,
  enclose(parens, intersperse(CONSTANTS.PARAM_SEPARATOR, node.args.map(format))),
]


const formatInfixSend = (node: Send) => intersperse(WS, [
  format(node.receiver),
  node.message,
  format(node.args[0]),
])

// UTILS

const formatParameters = (parameters: Parameter[] | List<Parameter>) => intersperse([CONSTANTS.PARAM_SEPARATOR, WS], parameters.map(format))

const formatSentences = (sentences: List<Sentence>, ignoreLastReturn = false) => sentences.reduce<IDoc>((formatted, sentence, i, sentences) => {
  const shouldShortenReturn = i === sentences.length - 1 && sentence.is(Return) && sentence.value && ignoreLastReturn
  const previousSentence = sentences[i-1]
  return [formatted, formatSentenceInBody( !shouldShortenReturn ? sentence : sentence.value,  previousSentence)]
}, [])

const formatSentenceInBody = (sentence: Sentence, previousSentence: Sentence | undefined): IDoc => {
  const distanceFromLastSentence = previousSentence ? sentence.sourceMap!.start.line - previousSentence.sourceMap!.end.line : -1
  return [Array(distanceFromLastSentence + 1).fill(lineBreak), format(sentence)]
}

const formatAssign = (name: string, value: Expression) => group(intersperse(WS, [
  name,
  CONSTANTS.ASIGNATION,
  lineBreak,
  format(value),
]))