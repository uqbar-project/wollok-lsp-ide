import { Node } from 'wollok-ts'

export const tokenModifiers = ['declaration', 'definition', 'documentation', 'keyword']

export const WollokTokenKinds = {
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

export const WollokKeywords = {
  'Always': 'then always',
  'Assignment':'=',
  'Catch': 'catch',
  'Class': 'class',
  'Describe':'describe',
  'Else':'else',
  'Field':'var',
  'If':'if',
  'Import':'import',
  'Method': 'method',
  'Mixin': 'class',
  'New':'new',
  'Package':'package',
  'Program':'program',
  'Return': 'return',
  'Self':'self',
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
  'Singleton': 'object',
  'Super':'super',
  'Test':'test',
  'Throw': 'throw',
  'Try': 'try',
  'Variable': ['var', 'const'],
}

// Standard token types:
// ID   Description
export const tokenTypes = [
  'class',          // For identifiers that declare or reference a class type.
  'comment',        // For tokens that represent a comment.
  'decorator',      // For identifiers that declare or reference decorators and annotations.
  'enum',           // For identifiers that declare or reference an enumeration type.
  'enumMember',     // For identifiers that declare or reference an enumeration property, constant, or member.
  'event',          // For identifiers that declare an event property.
  'function',       // For identifiers that declare a function.
  'interface',      // For identifiers that declare or reference an interface type.
  'keyword',        // For tokens that represent a language keyword.
  'label',          // For identifiers that declare a label.
  'macro',          // For identifiers that declare a macro.
  'method',         // For identifiers that declare a member function or method.
  'namespace',      // For identifiers that declare or reference a namespace, module, or package.
  'number',         // For tokens that represent a number literal.
  'object',         // Custom Wollok token type for WKOs and unnamed objects
  'operator',       // For tokens that represent an operator.
  'parameter',      // For identifiers that declare or reference a function or method parameters.
  'property',       // For identifiers that declare or reference a member property, member field, or member variable.
  'regexp',         // For tokens that represent a regular expression literal.
  'string',         // For tokens that represent a string literal.
  'struct',         // For identifiers that declare or reference a struct type.
  'type',           // For identifiers that declare or reference a type that is not covered above.
  'typeParameter',  // For identifiers that declare or reference a type parameter.
  'variable',       // For identifiers that declare or reference a local or global variable.
]

export type NodeContext = {
  name: string,
  type: string
}

export type NamedNode = Node & { name: string }

export type LineResult = {
  line: number,
  column: number,
  word: string,
}

export type HighlightingResult = {
  result: WollokNodePlotter[];
  references: NodeContext[] | undefined;
}

export type WollokPosition = {
  line: number,
  column: number,
}

export type WollokRange = {
  start: WollokPosition,
  end: WollokPosition,
}

export type WollokNodePlotter = {
  range: WollokRange
  tokenType: string
  tokenModifiers?: string[]
}

/*

Standard token modifiers

ID             Description
----------------------------------------------------------------------------------------------
declaration    For declarations of symbols.
definition     For definitions of symbols, for example, in header files.
readonly       For readonly variables and member fields (constants).
static         For class members (static members).
deprecated     For symbols that should no longer be used.
abstract       For types and member functions that are abstract.
async          For functions that are marked async.
modification   For variable references where the variable is assigned to.
documentation  For occurrences of symbols in documentation.
defaultLibrary For symbols that are part of the standard library.

*/
