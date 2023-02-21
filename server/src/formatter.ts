import { Body, Field, Method, Node, Singleton } from 'wollok-ts'

export type Code = string

export const write = (indent = 0) => (node: Node): Code => {
  return '\t'.repeat(indent) + node.match<Code>({
    Package: (node) => node.members.map(write()).join('\n'),
    Singleton: writeSingleton(indent),
    Method: writeMethod(indent),
    Body: writeBody(indent),
    Return: (_node) => 'return',
    Field: writeField,
    Parameter: (node) => node.name,
  })
}


const writeSingleton = (indent: number) => (singleton: Singleton): Code =>  `object ${singleton.name} {\n${singleton.members.map(write(indent + 1)).join('\n\n')}\n}`

const writeField =  (field: Field): Code => `${field.isConstant ? 'const' : 'var'} ${field.name}`

const writeMethod = (indent: number) => (method: Method): Code => `method ${method.name}(${method.parameters.map(write(0)).join(', ')}) ${method.body === 'native' ? 'native' : writeBody(indent)(method.body!)}`

const writeBody = (indent: number) => (body: Body): Code => `{\n${body.sentences.map(write(indent + 1)).join('\n')}\n${'\t'.repeat(indent)}}`