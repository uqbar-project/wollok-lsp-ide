import { Assignment, Body, Class, Describe, Expression, Field, If, Import, Literal, Method, Mixin, New, Node, Package, Parameter, ParameterizedType, Reference, Return, Self, Send, Sentence, Singleton, Test, Variable } from 'wollok-ts'
import { IDoc, append, braces, choice, enclose, intersperse, lineBreak, lineBreaks, parens, render, softBreak } from 'prettier-printer'
import { List, match, when } from 'wollok-ts/dist/extensions'
import { CONSTANTS, INFIX_OPERATORS } from './wollok-code'
import { WS, body, enclosedList, indent, listEnclosers, listed, setEnclosers, stringify } from './pretty-print'

export const print = (node: Node): string => {
  return render(30, format(node))
}

// -----------------------
// ----NODE FORMATTERS----
// -----------------------

export type Formatter<T extends Node> = (node: T) => IDoc

export const format: Formatter<Node> = node => {
  return match(node)(
    when(Package)(formatPackage),
    when(Assignment)(formatAssignment),
    when(Singleton)(formatSingleton),
    when(Class)(formatClass),
    when(Mixin)(formatMixin),
    when(Method)(formatMethod),
    when(Field)(formatField),
    when(Variable)(formatVariable),
    when(Describe)(formatDescribe),
    when(Test)(formatTest),
    when(Parameter)(formatParameter),
    when(Literal)(formatLiteral),
    when(Body)(formatBody),
    when(Send)(formatSend),
    when(If)(formatIf),
    when(New)(formatNew),
    when(ParameterizedType)(formatParameterizedType),
    when(Return)(formatReturn),
    when(Reference)(formatReference),
    when(Self)(formatSelf),
    when(Import)(formatImport),
  )
}

const formatPackage: Formatter<Package> = (node: Package) => {
  return intersperse(lineBreaks, node.children.map(format))
}

const formatImport: Formatter<Import> = node => {
  const wildcard = node.entity.target?.is(Package) ? '.*' : ''

  return [CONSTANTS.IMPORT, WS, node.entity.name, wildcard]
}

const formatMethod: Formatter<Method> = (node: Method) => {
  const signature = [
    CONSTANTS.METHOD,
    WS,
    node.name,
    enclosedList(parens, node.parameters.map(format)),
  ]

  if(node.isNative()){
    return [signature, WS, CONSTANTS.NATIVE]
  } else if (node.isAbstract()){
    return signature
  } else if(node.isConcrete()) {
    if(
      node.body.sentences.length === 1 &&
      node.body.sentences[0].is(Return) &&
      node.body.sentences[0].value
    ) {
      return intersperse(WS, [signature, CONSTANTS.ASIGNATION, format(node.body!.sentences[0].value)])
    }
    else {
      return [signature, WS, format(node.body as Body)]
    }
  } else {
    throw Error('Malformed method')
  }
}

const formatBody: Formatter<Body> = (node: Body) => body(formatSentences(node.sentences))

const formatReturn = (node: Return) => node.value ?
  [CONSTANTS.RETURN, WS,  format(node.value)]
  : CONSTANTS.RETURN

const formatReference = (node: Reference<Node>) => node.name

const formatField: Formatter<Field> = node => {
  let modifiers: IDoc = [node.isConstant ? CONSTANTS.CONST : CONSTANTS.VAR]
  if(node.isProperty){
    modifiers = append([WS, CONSTANTS.PROPERTY], modifiers)
  }
  return [
    modifiers,
    WS,
    formatAssign(node.name, node.value),
  ]
}

const formatVariable: Formatter<Variable> = node => {
  return [
    node.isConstant ? CONSTANTS.CONST : CONSTANTS.VAR,
    WS,
    formatAssign(node.name, node.value),
  ]
}

const formatParameter: Formatter<Parameter> = node => node.name

const formatTest: Formatter<Test> = (node: Test) => {
  return intersperse(WS, [
    CONSTANTS.TEST,
    node.name,
    body(formatSentences(node.body.sentences)),
  ])
}

const formatDescribe: Formatter<Describe> = node => intersperse(
  WS,
  [CONSTANTS.SUITE, node.name, formatModuleBody(node.members)]
)


const formatAssignment: Formatter<Assignment>= node => formatAssign(node.variable.name, node.value)

const formatIf: Formatter<If> = node => {
  const condition = [CONSTANTS.IF, WS, enclose(parens, format(node.condition))]
  const thenBody = body(formatSentences(node.thenBody.sentences))
  const elseBody = node.elseBody.sentences.length > 0 ? body(formatSentences(node.elseBody.sentences)) : undefined
  return [
    condition,
    WS,
    thenBody,
    elseBody ? [WS, CONSTANTS.ELSE, WS, elseBody] : [],
  ]
}

const formatNew: Formatter<New> = node => {
  const args =
    enclosedList(parens, node.args.map(arg => intersperse(WS, [arg.name, CONSTANTS.ASIGNATION, format(arg.value)])))
  return [
    CONSTANTS.NEW,
    WS,
    node.instantiated.name,
    args,
  ]
}

const formatLiteral: Formatter<Literal> = node => {
  if(node.isBoolean()){
    return `${node.value}`
  } else if(node.isNumeric()) {
    return node.value.toString() //ToDo presition
  } else if(node.isNull()){
    return CONSTANTS.NULL
  } else if(node.isString()){
    return stringify(`${node.value}`)
  } else if(node.isCollection()){
    const [{ name: moduleName }, elements] = node.value as any
    switch(moduleName){
      case CONSTANTS.LIST_MODULE:
        return formatCollection(elements as Expression[], listEnclosers)
      case CONSTANTS.SET_MODULE:
        return formatCollection(elements as Expression[], setEnclosers)
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

const formatMixin: Formatter<Mixin> = node => {
  const declaration = [
    CONSTANTS.MIXIN,
    WS,
    node.name,
    node.supertypes.length > 0 ? [WS, CONSTANTS.INHERITS, WS, intersperse([WS, CONSTANTS.MIXED_AND, WS], node.supertypes.map(format))] : [],
  ]

  return [declaration, WS, formatModuleBody(node.members)]
}

const formatParameterizedType: Formatter<ParameterizedType> = node => node.reference.name

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

const formatClosure: Formatter<Singleton> = node => {
  const applyMethod = node.members[0] as Method
  const parameters = applyMethod.parameters.length > 0 ?
    [WS, listed(applyMethod.parameters.map(format)), WS, CONSTANTS.CLOSURE_BEGIN]
    : []

  const sentences = (applyMethod.body! as Body).sentences

  return sentences.length === 1 ?
    enclose(braces, append(WS, [parameters, WS, format(sentences[0])]))
    : enclose(braces, [parameters, lineBreak, indent(formatSentences((applyMethod.body! as Body).sentences)), lineBreak])
}

const formatAnonymousSingleton: Formatter<Singleton> = node => intersperse(WS, [
  CONSTANTS.WKO,
  formatModuleBody(node.members),
])

const formatWKO: Formatter<Singleton> = node => intersperse(WS, [
  CONSTANTS.WKO,
  node.name!,
  formatModuleBody(node.members),
])

// SEND FORMATTERS

const formatSend: Formatter<Send> = node => {
  return INFIX_OPERATORS.includes(node.message) ?
    formatInfixSend(node)
    : formatDotSend(node)
}

const formatDotSend: Formatter<Send> = node => [
  format(node.receiver),
  CONSTANTS.SEND_OPERATOR,
  node.message,
  enclosedList(parens, node.args.map(format)),
]

const formatInfixSend: Formatter<Send> = node => {
  function addParenthesisIfNeeded(expression: Expression): IDoc {
    // ToDo: add more cases where parenthesis aren't needed
    const formatted = format(expression)
    return expression.is(Send) && INFIX_OPERATORS.includes(expression.message) ? enclose(parens, formatted) : formatted
  }

  return intersperse(WS, [
    addParenthesisIfNeeded(node.receiver),
    node.message,
    addParenthesisIfNeeded(node.args[0]),
  ]
)}

// AUXILIARY FORMATTERS

const formatSentences = (sentences: List<Sentence>, simplifyLastReturn = false) => sentences.reduce<IDoc>((formatted, sentence, i, sentences) => {
  const shouldShortenReturn = i === sentences.length - 1 && sentence.is(Return) && sentence.value && simplifyLastReturn
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
  return enclosedList(enclosers, values.map(format))
}

const formatModuleBody = (members: List<Field | Method | Test>): IDoc => body(intersperse(lineBreaks, members.filter(member => !member.isSynthetic).map(format)))