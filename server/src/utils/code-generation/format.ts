import { Assignment, Field, Literal, Method, Node, Package, Parameter, Singleton, Test } from 'wollok-ts'
import { IDoc, align, dquotes, enclose, group, intersperse, lineBreak, parens, render, softLine } from 'prettier-printer'
import { match, when } from 'wollok-ts/dist/extensions'
import constants from './wollok-code'
import { body } from './pretty-print'

 const WS = ' ' as IDoc

export const print = (node: Node): string => {
  return render(50, format(node))
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
    when(Field)(formatField),
    when(Test)(formatTest),
    when(Parameter)(formatParameter),
    when(Literal)(formatLiteral)
  )
}

const formatPackage: Formatter<Package> = (node: Package) => {
  return intersperse([lineBreak, lineBreak], node.children.map(format))
}

const formatSingleton: Formatter<Singleton>=(node: Singleton) => {
  if(node.name){
    return intersperse(WS, [
      constants.WKO,
      node.name,
      body(intersperse([lineBreak, lineBreak], node.members.map(format))),
    ])
  } else {
    return 'ToDo'
  }
}

const formatMethod: Formatter<Method> = (node: Method) => {

  //ToDo body (abstract, native, etc)
  return intersperse(WS, [
    constants.METHOD,
    node.name,
    enclose(parens, intersperse(constants.PARAM_SEPARATOR, node.parameters.map(format))),
  ])
}

const formatField: Formatter<Field> = (node: Field) => {
  //ToDo
  return intersperse(WS, [
    node.isConstant ? constants.CONST : constants.VAR,
    node.name,
    constants.ASIGNATION,
    format(node.value),
  ])
}

const formatParameter: Formatter<Parameter> = (node: Parameter) => {
  return node.name
}

const formatTest: Formatter<Test> = (node: Test) => {
  return intersperse(WS, [
    constants.TEST,
    node.name,
  ])
}

const formatAssignment: Formatter<Assignment>=(node: Assignment) => {
  return align(
    group([
      intersperse(WS, [
        node.variable.name,
        constants.ASIGNATION,
      ]),
      softLine,
      format(node.value),
    ]))
}

const formatLiteral: Formatter<Literal> = (node: Literal) => {
  switch(typeof node.value) {
    case 'string':
      return enclose(dquotes, node.value)
    case 'number':
      return node.value.toString() //ToDo presition
    case 'boolean':
      return `${node.value}`
    case 'undefined':
      return constants.NULL
    default:
      return node.value?.toString() + typeof node.value //ToDo  lists, sets, etc
  }
}


// --------------------------
// ----UTIL FORMATTERS-------
// --------------------------

