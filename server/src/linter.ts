import { Connection, Diagnostic, TextDocument } from 'vscode-languageserver'
import { buildEnvironment, validate } from 'wollok-ts'

import { createDiagnostic } from './diagnostic'

export const validateTextDocument = (connection: Connection) => async (textDocument: TextDocument) => {
	const text = textDocument.getText()

	const file: { name: string, content: string } = {
		name: textDocument.uri,
		content: text,
	}

	const start = new Date().getTime()

	const environment = buildEnvironment([file])
	const endEnvironment = new Date().getTime()

	const problems = validate(environment)

	console.log('environment time ', (endEnvironment - start))

	const diagnostics: Diagnostic[] = problems.map(problem => createDiagnostic(textDocument, problem))

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })

	const endValidation = new Date().getTime()
	console.log('validation time ', (endValidation - endEnvironment))

}
