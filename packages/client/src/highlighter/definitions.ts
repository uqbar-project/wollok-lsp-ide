import { createRange, WollokNodePlotter } from './utils'

export const tokenModifiers = ['declaration', 'definition', 'documentation', 'keyword']
export const tokenTypeObj = {
  'Assignment': 'property',
  'Body': 'property',
  'Catch': 'property',
  'Class': 'class',
  'Comment':'comment',
  'CommentMultiline':'comment-multiline',
  'Describe': 'class',
  'Environment': 'property',
  'Field': 'property',
  'If': 'property',
  'Import': 'namespace',
  'Keyword': 'keyword',
  'Literal_bool': 'enum',
  'Literal_number': 'number',
  'Literal_string': 'string',
  'Literal': 'property',
  'Method': 'method',
  'Mixin': 'property',
  'NamedArgument': 'property',
  'New': 'property',
  'Package': 'namespace',
  'Parameter': 'parameter',
  'ParameterizedType': 'property',
  'Program': 'property',
  'Reference': 'property',
  'Return': 'keyword',
  'Self': 'property',
  'Send': 'operator',
  'Singleton': 'object',
  'Super': 'property',
  'Test': 'method',
  'Throw': 'property',
  'Try': 'property',
  'Variable': 'variable',
}

export const keywords = {
  /*
  'Parameter':'property',
  'ParameterizedType':'property',
  'NamedArgument':'property',
  'Body':'property',*/
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
  'Super':'super',
  'New':'new',
  'If':'if',
  'Else':'else',
  'Try': 'try',
  'Catch': 'catch',
  'Always': 'then always',
  'Throw': 'throw',
  //'Literal':'property',
  /*'Super':'property',
  'Environment':'property',
  */
  'Class': 'class',
}

// Standard token types:
// ID   Description
export const tokenTypes = [
  'class', //  For identifiers that declare or reference a class type.
  'comment', //        For tokens that represent a comment.
  'decorator', //      For identifiers that declare or reference decorators and annotations.
  'enum', //   For identifiers that declare or reference an enumeration type.
  'enumMember', //     For identifiers that declare or reference an enumeration property, constant, or member.
  'event', //  For identifiers that declare an event property.
  'function', //       For identifiers that declare a function.
  'interface', //      For identifiers that declare or reference an interface type.
  'keyword', //        For tokens that represent a language keyword.
  'label', //  For identifiers that declare a label.
  'macro', //  For identifiers that declare a macro.
  'method', // For identifiers that declare a member function or method.
  'namespace', //      For identifiers that declare or reference a namespace, module, or package.
  'number', // For tokens that represent a number literal.
  'object', //No es parte de los tipos por default
  'operator', //       For tokens that represent an operator.
  'parameter', //      For identifiers that declare or reference a function or method parameters.
  'property', //       For identifiers that declare or reference a member property, member field, or member variable.
  'regexp', // For tokens that represent a regular expression literal.
  'string', // For tokens that represent a string literal.
  'struct', // For identifiers that declare or reference a struct type.
  'type', //   For identifiers that declare or reference a type that is not covered above.
  'typeParameter', //  For identifiers that declare or reference a type parameter.
  'variable', //       For identifiers that declare or reference a local or global variable.
]

export function plotter(start: { ln, col, len }, kind: string): WollokNodePlotter {
  return {
    range: createRange(start.ln, start.col, start.len),
    tokenType: tokenTypeObj[kind],
    tokenModifiers: ['declaration'],
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
