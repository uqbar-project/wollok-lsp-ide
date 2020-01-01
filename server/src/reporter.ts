import { Problem } from 'wollok-ts/dist/validator'

import { lang } from './settings'

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// VALIDATION MESSAGES DEFINITION
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

type ValidationMessage = { [key: string]: string }

const FAILURE = 'failure'

const validationMessagesEn: ValidationMessage = {
  'nameBeginsWithLowercase': 'The name {0} must start with lowercase',
  'nameBeginsWithUppercase': 'The name {0} must start with uppercase',
  'nameIsNotKeyword': 'The name {0} is a keyword, you should pick another one',
  [FAILURE]: 'Rule failure: ',
}

const validationMessagesEs: ValidationMessage = {
  'nameBeginsWithLowercase': 'El nombre {0} debe comenzar con minúsculas',
  'nameBeginsWithUppercase': 'El nombre {0} debe comenzar con mayúsculas',
  'nameIsNotKeyword': 'El nombre {0} es una palabra reservada, debe cambiarla',
  [FAILURE]: 'La siguiente regla falló: ',
}

const validationMessages: { [key: string]: ValidationMessage } = {
  'en': validationMessagesEn,
  'es': validationMessagesEs,
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const validationI18nized = () => validationMessages[lang()]

const convertToHumanReadable = (code: string) => {
  if (!code) { return '' }
  const result = code.replace(/[A-Z0-9]+/g, (match) => ' ' + match.toLowerCase())
  return validationI18nized()[FAILURE] + result.charAt(0).toUpperCase() + result.slice(1, result.length)
}

const interpolateValidationMessage = (message: string, values: string[]) =>
  message.replace(/{\d*}/g, (match: string) => {
    const index = match.replace('{', '').replace('}', '') as unknown as number
    return values[index] || ''
  }
  )

const getBasicMessage = (problem: Problem) => validationI18nized()[problem.code] || convertToHumanReadable(problem.code)

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const reportMessage = (problem: Problem) => interpolateValidationMessage(getBasicMessage(problem), problem.values)
