import { Diagnostic, DiagnosticSeverity, TextDocument } from 'vscode-languageserver'
import { Problem } from 'wollok-ts/dist/validator'

import { reportMessage } from './reporter'

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const buildSeverity = (problem: Problem) =>
	problem.level === 'Error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning


// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const createDiagnostic = (textDocument: TextDocument, problem: Problem) => {
	const source = problem.node.source
	const range = {
		start: textDocument.positionAt(source ? source.start.offset : 0),
		end: textDocument.positionAt(source ? source.start.offset : 0),
	}
	return {
		severity: buildSeverity(problem),
		range,
		code: problem.code,
		message: reportMessage(problem),
		source: problem.node.source?.file,
	} as Diagnostic
}