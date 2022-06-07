import { WOLLOK_AUTOCOMPLETE } from './server'
import { CompletionItemKind } from 'vscode-languageserver/node'

export const templates = [
  {
    label: 'class',
    kind: CompletionItemKind.Class,
    data: 1,
    detail: WOLLOK_AUTOCOMPLETE,
    insertText: 'class ClassName {\n}',
  },
  {
    label: 'object',
    kind: CompletionItemKind.Text,
    data: 2,
    detail: WOLLOK_AUTOCOMPLETE,
    insertText: 'object objectName {\n}',
  },
  {
    label: 'method (with effect)',
    kind: CompletionItemKind.Method,
    data: 3,
    detail: WOLLOK_AUTOCOMPLETE,
    insertText: 'method methodName() {\n}',
  },
  {
    label: 'method (without effect)',
    kind: CompletionItemKind.Method,
    data: 4,
    detail: WOLLOK_AUTOCOMPLETE,
    insertText: 'method methodName() = value',
  },
  {
    label: 'describe',
    kind: CompletionItemKind.Event,
    data: 5,
    detail: WOLLOK_AUTOCOMPLETE,
    insertText: 'describe "a group of tests" {\n  test "something" {\n    assert.that(true)\n  }\n}\n',
  },
  {
    label: 'test',
    kind: CompletionItemKind.Event,
    data: 6,
    detail: WOLLOK_AUTOCOMPLETE,
    insertText: 'test "something" {\n  assert.that(true)\n}\n',
  },
]