import { Assignment, Body, Class, Expression, Field, Id, Literal, Method, Node, Package, Parameter, Reference, Return, Self, Send, Sentence, Singleton, Test, Variable } from 'wollok-ts'
import { IDoc, append, braces, choice, dquotes, enclose, group, intersperse, lineBreak, lineBreaks, parens, render, softBreak, softLine } from 'prettier-printer'
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
    when(Class)(formatClass),
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
    when(Self)(formatSelf),
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
  if(node.isBoolean()){
    return `${node.value}`
  } else if(node.isNumeric()) {
    return node.value.toString() //ToDo presition
  } else if(node.isNull()){
    return CONSTANTS.NULL
  } else if(node.isString()){
    return enclose(dquotes, `${node.value}`)
  } else if(node.isCollection()){
    const [{ name: moduleName }, elements] = node.value as any
    switch(moduleName){
      case CONSTANTS.LIST_MODULE:
        return formatCollection(elements as Expression[], [CONSTANTS.BEGIN_LIST_LITERAL, CONSTANTS.END_LIST_LITERAL])
      case CONSTANTS.SET_MODULE:
        return formatCollection(elements as Expression[], [CONSTANTS.BEGIN_SET_LITERAL, CONSTANTS.END_SET_LITERAL])
      default:
        throw new Error('Unknown collection type')
    }
  } else {
    throw new Error('Unknown literal type')
  }
}

const formatSelf: Formatter<Self> = (_: Self) => CONSTANTS.SELF

const formatClass: Formatter<Class> = (node: Class) => {
  const header = [
    CONSTANTS.CLASS,
    WS,
    node.name,
    node.superclass && node.superclass?.fullyQualifiedName !== CONSTANTS.OBJECT_MODULE ? [WS, CONSTANTS.INHERITS, WS, node.superclass.name] : [],
  ]

  return [
    header,
    WS,
    formatModuleBody(node.members),
  ]
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

  const sentences = (applyMethod.body! as Body).sentences

  return sentences.length === 1 ?
    enclose(braces, append(WS, [parameters, WS, format(sentences[0])]))
    : enclose(braces, [parameters, lineBreak, indent(formatSentences((applyMethod.body! as Body).sentences)), lineBreak])
}

const formatAnonymousSingleton: Formatter<Singleton> = (node: Singleton) => intersperse(WS, [
  CONSTANTS.WKO,
  formatModuleBody(node.members),
])

const formatWKO: Formatter<Singleton> = (node: Singleton) => intersperse(WS, [
  CONSTANTS.WKO,
  node.name!,
  formatModuleBody(node.members),
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

const formatAssign = (name: string, value: Expression) => [
  name,
  WS,
  CONSTANTS.ASIGNATION,
  softBreak,
  choice([WS, format(value)], indent(format(value))),
]

const formatCollection = (values: Expression[], enclosers: [IDoc, IDoc]) => {
  return choice(
    enclose(
      enclosers,
      [
        intersperse([CONSTANTS.COLLECTION_SEPARATOR, WS], values.map(format)),
      ]
    ),
    enclose(
      enclosers,
      [
        lineBreak,
        indent(intersperse([CONSTANTS.COLLECTION_SEPARATOR, softLine], values.map(format))),
        lineBreak,
      ]
    )
  )
}

const formatModuleBody = (members: List<Field | Method>): IDoc => body(intersperse(lineBreaks, members.map(format)))