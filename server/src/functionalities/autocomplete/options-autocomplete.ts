import { CompletionItemKind, InsertTextFormat } from 'vscode-languageserver'

export const optionImports = [
  {
    label: 'import',
    kind: CompletionItemKind.File,
    insertTextFormat: InsertTextFormat.Snippet,
    sortText: '010',
    insertText: 'import ${1:dependency}\n${0}',
  },
]

export const optionPrograms = [
  {
    label: 'program',
    kind: CompletionItemKind.Unit,
    sortText: '050',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'program ${1:name} {\n  ${0}\n}',
  },
]

export const optionTests = [
  {
    label: 'test',
    kind: CompletionItemKind.Event,
    sortText: '050',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'test "${1:description}" {\n  ${0}\n}',
  },
]

export const optionConstReferences = [
  {
    label: 'const attribute',
    kind: CompletionItemKind.Field,
    sortText: '020',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'const ${1:name} = ${0}',
  },
]

const optionVarReferences = [
  {
    label: 'var attribute',
    kind: CompletionItemKind.Field,
    sortText: '015',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'var ${1:name} = ${0}',
  },
]

export const optionReferences = [
  ...optionVarReferences,
  ...optionConstReferences,
]

export const optionPropertiesAndReferences = [
  ...optionVarReferences,
  {
    label: 'var property',
    kind: CompletionItemKind.Property,
    sortText: '020',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'var property ${1:name} = ${0}',
  },
  ...optionConstReferences,
  {
    label: 'const property',
    kind: CompletionItemKind.Property,
    sortText: '025',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'const property ${1:propertyName} = ${0}',
  },
]

export const optionModules = [
  {
    label: 'object',
    kind: CompletionItemKind.Module,
    insertTextFormat: InsertTextFormat.Snippet,
    sortText: '030',
    insertText: 'object ${1:name} {\n  ${0}\n}',
  },
  {
    label: 'class',
    kind: CompletionItemKind.Class,
    sortText: '030',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'class ${1:Name} {\n  ${0}\n}',
  },
]

export const optionDescribes = [
  {
    label: 'describe',
    kind: CompletionItemKind.Folder,
    insertTextFormat: InsertTextFormat.Snippet,
    sortText: '050',
    insertText: 'describe "${1:name}" {\n  test "${2:description}" {\n    ${0}\n  }\n}',
  },
  ...optionTests,
  // we could potentially hide modules autocompletion, but when you design unit tests you need some abstraction
  ...optionModules,
  //
]

export const optionMethods = [
  {
    label: 'method (effect)',
    kind: CompletionItemKind.Method,
    sortText: '040',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'method ${1:name}($2) {\n  ${0}\n}',
  },
  {
    label: 'method (return)',
    kind: CompletionItemKind.Method,
    sortText: '040',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'method ${1:name}($2) = ${0}',
  },
]

export const optionAsserts = [
  {
    label: 'assert equality',
    kind: CompletionItemKind.Snippet,
    sortText: '060',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'assert.equals(${1:value}, ${2:expression})${0}',
  },
  {
    label: 'assert boolean',
    kind: CompletionItemKind.Snippet,
    sortText: '060',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'assert.that(${1:booleanExpression})${0}',
  },
  {
    label: 'assert throws',
    kind: CompletionItemKind.Snippet,
    sortText: '060',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'assert.throwsException({ ${1:expression} })${0}',
  },
  {
    label: 'assert throws message',
    kind: CompletionItemKind.Snippet,
    sortText: '060',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'assert.throwsExceptionWithMessage(${1:message}, { ${2:expression} })${0}',
  },
]

export const optionInitialize = [
  {
    label: 'initializer',
    kind: CompletionItemKind.Constructor,
    sortText: '030',
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: 'method initialize() {\n  ${0}\n}',
  },
]