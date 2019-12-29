import { Problem } from 'wollok-ts/dist/validator'

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// VALIDATION MESSAGES DEFINITION
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

type ValidationMessage = { [key: string]: string }

const validationMessagesEn: ValidationMessage = {
	'nameIsCamelCase': 'The name {0} must start with lowercase',
	'nameIsPascalCase': 'The name {0} must start with uppercase',
	'nameIsNotKeyword': 'The name {0} is a keyword, you should pick another one',
}

const validationMessagesEs: ValidationMessage = {
	'nameIsCamelCase': 'El nombre {0} debe comenzar con minúsculas',
	'nameIsPascalCase': 'El nombre {0} debe comenzar con mayúsculas',
	'nameIsNotKeyword': 'El nombre {0} es una palabra reservada, debe cambiarla',
}

const validationMessages: { [key: string]: ValidationMessage } = {
	'en': validationMessagesEn,
	'es': validationMessagesEs,
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const interpolateValidationMessage = (message: string, values: string[]) =>
	message.replace(/{\d*}/g, (match: string) => {
		const index = match.replace('{', '').replace('}', '') as unknown as number
		return values[index] || ''
	}
	)

const lang = () => {
	const env = process.env
	const fullLanguage = env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE
	return fullLanguage ? fullLanguage.substring(0, 2) : 'es'
}

const validationI18nized = () =>
	validationMessages[lang()] as ValidationMessage

const getBasicMessage = (problem: Problem) => validationI18nized()[problem.code] || convertToHumanReadable(problem.code)

const convertToHumanReadable = (code: string) => {
	if (!code) { return '' }
	const result = code.replace(/[A-Z0-9]+/g, (match) => ' ' + match.toLowerCase())
	return result.charAt(0).toUpperCase() + result.slice(1, result.length)
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const reportMessage = (problem: Problem) => interpolateValidationMessage(getBasicMessage(problem), problem.values)
