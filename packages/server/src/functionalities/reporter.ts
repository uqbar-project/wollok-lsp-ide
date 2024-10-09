import { getMessage, LANGUAGES, Messages, Problem } from 'wollok-ts'
import { lang } from '../settings'

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CUSTOM MESSAGES DEFINITION
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const MISSING_WOLLOK_TS_CLI = 'missing_wollok_ts_cli'

const lspMessagesEn = {
  [MISSING_WOLLOK_TS_CLI]: 'Missing configuration WollokLSP/cli-path in order to run Wollok tasks',
}

const lspMessagesEs = {
  [MISSING_WOLLOK_TS_CLI]: 'Falta la configuración WollokLSP/cli-path para poder ejecutar tareas de Wollok',
}

const lspMessages: Messages = {
  [LANGUAGES.ENGLISH]: {
    ...lspMessagesEn,
  },
  [LANGUAGES.SPANISH]: {
    ...lspMessagesEs,
  },
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const reportValidationMessage = (problem: Problem): string =>
  getMessage({ message: problem.code, values: problem.values.concat(), language: lang() })

export const getLSPMessage = (message: string, values: string[]): string =>
  getMessage({ message, values, language: lang(), customMessages: lspMessages })
