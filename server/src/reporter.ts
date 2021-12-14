import { Problem } from 'wollok-ts'
import { lang } from './settings'

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// VALIDATION MESSAGES DEFINITION
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

type ValidationMessage = { [key: string]: string }

const FAILURE = 'failure'

const validationMessagesEn: ValidationMessage = {
  'nameShouldBeginWithLowercase': 'The name {0} must start with lowercase',
  'nameShouldBeginWithUppercase': 'The name {0} must start with uppercase',
  'nameShouldNotBeKeyword': 'The name {0} is a keyword, you should pick another one',
  'shouldNotBeEmpty': 'Should not make an empty definition.',
  'shouldUseConditionalExpression': 'Bad usage of if! You must return the condition itself without using if.',
  [FAILURE]: 'Rule failure: ',
}

const validationMessagesEs: ValidationMessage = {
  'nameShouldBeginWithLowercase': 'El nombre {0} debe comenzar con minúsculas',
  'nameShouldBeginWithUppercase': 'El nombre {0} debe comenzar con mayúsculas',
  'nameShouldNotBeKeyword': 'El nombre {0} es una palabra reservada, debe cambiarla',
  'shouldNotBeEmpty': 'El elemento no puede estar vacío: falta escribir código.',
  'shouldUseConditionalExpression': 'Estás usando incorrectamente el if. Devolvé simplemente la expresión booleana.',
  [FAILURE]: 'La siguiente regla falló: ',
}

const validationMessages: { [key: string]: ValidationMessage } = {
  'en': validationMessagesEn,
  'es': validationMessagesEs,
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const convertToHumanReadable = (code: string) => {
  if (!code) { return '' }
  const result = code.replace(/[A-Z0-9]+/g, (match) => ' ' + match.toLowerCase())
  return validationI18nized()[FAILURE] + result.charAt(0).toUpperCase() + result.slice(1, result.length)
}

const interpolateValidationMessage = (message: string, ...values: string[]) =>
  message.replace(/{\d*}/g, (match: string) => {
    const index = match.replace('{', '').replace('}', '') as unknown as number
    return values[index] || ''
  }
  )

const getBasicMessage = (problem: Problem) => validationI18nized()[problem.code] || convertToHumanReadable(problem.code)

const validationI18nized = () =>
  validationMessages[lang()] as ValidationMessage

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const reportMessage = (problem: Problem): string => interpolateValidationMessage(getBasicMessage(problem))