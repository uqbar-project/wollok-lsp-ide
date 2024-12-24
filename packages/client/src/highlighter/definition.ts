import { createRange, WollokNodePlotter } from './utils'

export const tokenModifiers = ['declaration', 'definition', 'documentation', 'keyword']
export const tokenTypeObj = {
  'Parameter': 'parameter',
  'ParameterizedType': 'property',
  'NamedArgument': 'property',
  'Import': 'namespace',
  'Body': 'property',
  'Catch': 'property',
  'Package': 'property',
  'Program': 'property',
  'Test': 'function',
  'Singleton': 'object',
  'Mixin': 'property',
  'Describe': 'property',
  'Variable': 'variable',
  'Field': 'property',
  'Method': 'method',
  'Return': 'keyword',
  'Assignment': 'property',
  'Reference': 'property',
  'Self': 'property',
  'Literal': 'property',
  'Literal_number': 'number',
  'Literal_string': 'string',
  'Literal_bool': 'keyword',
  'Send': 'operator',
  'Super': 'property',
  'New': 'property',
  'If': 'property',
  'Throw': 'property',
  'Try': 'property',
  'Environment': 'property',
  'Class': 'class', //'class', //'entity.name.type.class',

  'Comment':'comment',
  'CommentMultiline':'comment-multiline',
  'Keyword': 'keyword',
  'Unknow': 'unknow',
}

export const tokenTypeModifierObj = {
  'Parameter': ['declaration'],
  'ParameterizedType': ['declaration'],
  'NamedArgument': ['declaration'],
  'Import': ['declaration'],
  'Body': ['declaration'],
  'Catch': ['declaration'],
  'Package': ['declaration'],
  'Program': ['declaration'],
  'Test': ['declaration'],
  'Singleton': ['declaration'],
  'Mixin': ['declaration'],
  'Describe': ['declaration'],
  'Variable': ['declaration'],
  'Field': ['declaration'],
  'Method': ['declaration'],
  'Return': ['declaration'],
  'Assignment': ['declaration'],
  'Reference': ['declaration'],
  'Self': ['declaration'],
  'Literal': ['declaration'], //['readonly'],
  'Literal_number': ['declaration'], //['readonly'],
  'Literal_string': ['declaration'], //['readonly'],
  'Send': ['declaration'],
  'Super': ['declaration'],
  'New': ['declaration'],
  'If': ['declaration'],
  'Throw': ['declaration'],
  'Try': ['declaration'],
  'Environment': ['declaration'],
  'Class': ['declaration'], //'class', //'entity.name.type.class',

  //este rompia....!!!
  'Keyword': ['declaration'], //['static'],
  'Comment': ['declaration'], //['static'],
  //['readonly'],
  //'Unknow': 'unknow',
}
//Standard token types:


export const keywords = {
  /*
  'Parameter':'property',
  'ParameterizedType':'property',
  'NamedArgument':'property',
  'Body':'property',*/
  'Catch':'catch',
  'Package':'package',
  'Import':'import',
  'Program':'program',
  'Test':'test',
  'Describe':'describe',
  'Singleton': 'object',
  //'Mixin':'property',
  'Variable': ['var', 'const'],
  'Send': [
    // eslint-disable-next-line array-element-newline
    '+', '*', '-', '/', '<', '>', '<=', '>=',
    // eslint-disable-next-line array-element-newline
    'and', 'or', 'not', 'negate',
    // eslint-disable-next-line array-element-newline
    '&&', '||', '!',
    // eslint-disable-next-line array-element-newline
    '==', '!=',
  ],
  'Field':'var',
  'Method': 'method',
  'Return': 'return',
  'Assignment':'=',
  //'Reference':'property',
  'Self':'self',
  'New':'new',
  'If':'if',
  'Else':'else',
  //'Literal':'property',
  /*'Super':'property',
  'Throw':'property',
  'Try':'property',
  'Environment':'property',
  */
  'Class': 'class',
}

//const tokenTypes = ['Parameter', 'ParameterizedType', 'NamedArgument', 'Import', 'Body', 'Catch', 'Package', 'Program', 'Test', 'Class', 'Singleton', 'Mixin', 'Describe', 'Variable', 'Field', 'Method', 'Return', 'Assignment', 'Reference', 'Self', 'Literal', 'Send', 'Super', 'New', 'If', 'Throw', 'Try', 'Environment']

//Standard token types:
//ID   Description
export const tokenTypes = [
  'namespace', //      For identifiers that declare or reference a namespace, module, or package.
  'class', //  For identifiers that declare or reference a class type.
  'object', //No es parte de los tipos por default
  'enum', //   For identifiers that declare or reference an enumeration type.
  'interface', //      For identifiers that declare or reference an interface type.
  'struct', // For identifiers that declare or reference a struct type.
  'typeParameter', //  For identifiers that declare or reference a type parameter.
  'type', //   For identifiers that declare or reference a type that is not covered above.
  'parameter', //      For identifiers that declare or reference a function or method parameters.
  'variable', //       For identifiers that declare or reference a local or global variable.
  'property', //       For identifiers that declare or reference a member property, member field, or member variable.
  'enumMember', //     For identifiers that declare or reference an enumeration property, constant, or member.
  'decorator', //      For identifiers that declare or reference decorators and annotations.
  'event', //  For identifiers that declare an event property.
  'function', //       For identifiers that declare a function.
  'method', // For identifiers that declare a member function or method.
  'macro', //  For identifiers that declare a macro.
  'label', //  For identifiers that declare a label.
  'comment', //        For tokens that represent a comment.
  'string', // For tokens that represent a string literal.
  'keyword', //        For tokens that represent a language keyword.
  'number', // For tokens that represent a number literal.
  'regexp', // For tokens that represent a regular expression literal.
  'operator', //       For tokens that represent an operator.
  'comment',
]

export function plotter(start: { ln, col, len }, kind: string): WollokNodePlotter {
  return {
    range: createRange(start.ln, start.col, start.len),
    tokenType: tokenTypeObj[kind],
    tokenModifiers: tokenTypeModifierObj[kind],
  }
}

/*
Standard token modifiers:

ID     Description
declaration    For declarations of symbols.
definition     For definitions of symbols, for example, in header files.
readonly       For readonly variables and member fields (constants).
static For class members (static members).
deprecated     For symbols that should no longer be used.
abstract       For types and member functions that are abstract.
async  For functions that are marked async.
modification   For variable references where the variable is assigned to.
documentation  For occurrences of symbols in documentation.
defaultLibrary For symbols that are part of the standard library.
*/
