import { CompletionItem, CompletionItemKind, Connection, Diagnostic, DiagnosticSeverity, InsertTextFormat, Position, TextDocument, TextDocumentPositionParams } from 'vscode-languageserver'
import { Body, buildEnvironment, Method, Node, Source, validate } from 'wollok-ts'
import { Problem } from 'wollok-ts/dist/validator'

import { reportMessage } from './reporter'

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const buildSeverity = (problem: Problem) =>
  problem.level === 'Error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning

const createDiagnostic = (textDocument: TextDocument, problem: Problem) => {
  const source = problem.source
  const range = {
    start: textDocument.positionAt(source ? source.start.offset : 0),
    end: textDocument.positionAt(source ? source.end.offset : 0),
  }
  return {
    severity: buildSeverity(problem),
    range,
    code: problem.code,
    message: reportMessage(problem),
    source: problem.node.source?.file,
  } as Diagnostic
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

let environment = buildEnvironment([])

export const validateTextDocument = (connection: Connection) => async (textDocument: TextDocument) => {
  const text = textDocument.getText()

  const file: { name: string, content: string } = {
    name: textDocument.uri,
    content: text,
  }

  const start = new Date().getTime()

  environment = buildEnvironment([file], environment)

  const endEnvironment = new Date().getTime()

  const problems = validate(environment)

  console.log('o- environment time ', (endEnvironment - start))

  const diagnostics: Diagnostic[] = problems.map(problem => createDiagnostic(textDocument, problem))
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })

  const endValidation = new Date().getTime()
  console.log('o- validation time ', (endValidation - endEnvironment))
}


const include = (source: Source, { position, textDocument: { uri } }: TextDocumentPositionParams) =>
  source.file == uri &&
  (source.start.line - 1 <= position.line && position.line <= source.end.line - 1 ||
    (source.start.line - 1 == position.line && position.line == source.end.line - 1 &&
      source.start.offset <= position.character && position.character <= source.end.line
    ))

const getNodesByPosition = (textDocumentPosition: TextDocumentPositionParams): Node[] => {
  const result: Node[] = []
  environment.forEach(node => { if (node.source?.file && include(node.source, textDocumentPosition)) result.push(node) })
  return result
}

export const completition = (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const { position } = textDocumentPosition
  const cursorNode = getNodesByPosition(textDocumentPosition).reverse()[0]
  return completionsForNode(cursorNode).map(buildCompletionItem(position))
}

type NodeCompletion = Pick<CompletionItem, 'label' | 'kind' | 'sortText'> & { textEdit: { newText: string } }

const completionsForNode = (node: Node): NodeCompletion[] => {
  console.log(node.kind)
  switch (node.kind) {
    case 'Package': return completePackage()
    case 'Singleton': return completeSingleton()
    case 'Body': return completeBody(node)
    case 'Method': return completeMethod(node)
    default: return []
  }
}

const completePackage = (): NodeCompletion[] => [
  {
    label: 'object',
    kind: CompletionItemKind.Class,
    textEdit: {
      newText: 'object ${1:pepita} { $0}'
    }
  },
  {
    label: 'class',
    kind: CompletionItemKind.Class,
    textEdit: {
      newText: 'class ${1:Golondrina} { $0}'
    }
  }
]


const completeSingleton = (): NodeCompletion[] => [
  {
    label: 'var attribute',
    kind: CompletionItemKind.Field,
    sortText: 'a',
    textEdit: {
      newText: 'var ${1:energia} = ${0:0}'
    }
  },
  {
    label: 'const attribute',
    kind: CompletionItemKind.Field,
    sortText: 'a',
    textEdit: {
      newText: 'const ${1:energia} = ${0:0}'
    }
  },
  {
    label: 'method',
    kind: CompletionItemKind.Method,
    sortText: 'b',
    textEdit: {
      newText: 'method ${1:volar}($2) { $0}'
    }
  }
]

const completeBody = (node: Body): NodeCompletion[] => completionsForNode(node.parent())

const completeMethod = (node: Method): NodeCompletion[] => {
  const references = node.parameters.map(p => p.name)
  const parent = node.parent()
  if (parent.is('Module')) references.push(...parent.fields().map(f => f.name))
  return references.map(name => ({
    label: name,
    kind: CompletionItemKind.Reference,
    textEdit: {
      newText: name
    }
  }))
}

const buildCompletionItem = (position: Position) => (base: NodeCompletion): CompletionItem => ({
  ...base,
  kind: CompletionItemKind.Method,
  insertTextFormat: InsertTextFormat.Snippet,
  sortText: 'b',
  textEdit: {
    ...base?.textEdit,
    range: {
      start: position,
      end: position,
    }
  }
})