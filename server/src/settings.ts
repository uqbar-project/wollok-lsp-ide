import { ClientCapabilities, Connection, DidChangeConfigurationParams } from 'vscode-languageserver'

interface ExampleSettings {
	maxNumberOfProblems: number,
	language: string
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL & PUBLISHED STATE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const envLang = () => {
	const env = process.env
	const fullLanguage = env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE
	return fullLanguage ? fullLanguage.substring(0, 2) : 'es'
}

const defaultSettings: ExampleSettings = {
	maxNumberOfProblems: 1000,
	language: envLang(),
}
let globalSettings: ExampleSettings = defaultSettings
// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map()

export let hasConfigurationCapability: boolean = false
export let hasWorkspaceFolderCapability: boolean = false
export let hasDiagnosticRelatedInformationCapability: boolean = false

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const initializeSettings = (capabilities: ClientCapabilities) => {
	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	)
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	)
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	)
}

export const settingsChanged = (connection: Connection, change: DidChangeConfigurationParams) => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear()
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.wollokLinter || defaultSettings)
		)
	}
}

export const lang = () => globalSettings.language

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const getDocumentSettings = (connection: Connection) => ((resource: string) => {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings)
	}
	let result = documentSettings.get(resource)
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'wollokLinter'
		})
		documentSettings.set(resource, result)
	}
	return result
})


