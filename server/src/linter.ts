import { Connection, Diagnostic, DiagnosticSeverity, TextDocument } from 'vscode-languageserver'
import { buildEnvironment, validate } from 'wollok-ts'
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

	console.log('environment time ', (endEnvironment - start))

	const diagnostics: Diagnostic[] = problems.map(problem => createDiagnostic(textDocument, problem))

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })

	const endValidation = new Date().getTime()
	console.log('validation time ', (endValidation - endEnvironment))

}
