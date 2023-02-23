import { Body, Class, Expression, Field, Literal, Method, Module, Node, Reference, Return, Sentence, Singleton } from 'wollok-ts'

export type Code = string

// @ToDo Writter refactor
export type Writter = (node: Node) => (indent: number) => Code

export const write = (indent = 0) => (node: Node): Code => {
  return indentation(indent) + node.match<Code>({
    Package: (node) => node.members.map(write(0)).join('\n'),
    Module: module_(indent),
    Body: body(indent),
    Method: method(indent),
    Sentence: sentence,
    Field: field,
    Parameter: (node) => node.name,
  })
}


const field =  (field: Field): Code => {
  const writable = field.isConstant ? 'const' : 'var'
  return `${writable} ${field.name}${field.value ? ` = ${expression(field.value)}` : ''}`
}

const method = (indent: number) => (method: Method): Code => `method ${method.name}(${method.parameters.map(write(0)).join(', ')}) ${method.body === 'native' ? 'native' : body(indent)(method.body!)}`

const body = (indent: number) => (body: Body): Code => `{\n${body.sentences.map(write(indent + 1)).join('\n')}\n${indentation(indent)}}`


/************************************************************
 *************************MODULES****************************
 ************************************************************/

const module_ = (indent: number) => (mod: Module): Code => mod.match<Code>({ Singleton: singleton(indent), Class: class_(indent) })

const singleton = (indent: number) => (singleton: Singleton): Code =>  `object ${singleton.name} {\n${singleton.members.map(write(indent + 1)).join('\n\n')}\n}`

const class_ = (indent: number) => (class_: Class): Code => `class ${class_.name} {\n${class_.members.map(write(indent + 1)).join('\n\n')}\n}`
/************************************************************
 ************************SENTENCES***************************
 ************************************************************/

const sentence = (sentence: Sentence): Code => sentence.match<Code>({ Return: ret })


const ret = (ret: Return): Code => `return${ret.value ? ` ${expression(ret.value)}` : ''}`

/************************************************************
 ***********************EXPRESSIONS**************************
 ************************************************************/

const expression = (expression: Expression): Code => expression.match<Code>({ Literal: literal, Reference: reference })

const reference = (reference: Reference<Node>): Code => reference.name

const literal = (literal: Literal): Code => {
  if(literal.value === null) return 'null'

  switch (typeof literal.value) {
    case 'number':
      return literal.value.toString()
    case 'string':
      return `"${literal.value}"`
    case 'boolean':
      return literal.value ? 'true' : 'false'
    default:
      throw new Error(`Unexpected literal type ${typeof literal.value}`)
  }
}

/************************************************************
 **************************UTILS*****************************
 ************************************************************/

const indentation = (indent: number) => '\t'.repeat(indent)