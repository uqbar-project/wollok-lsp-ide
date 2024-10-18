import { getMessage, LANGUAGES, Messages, Problem } from 'wollok-ts'
import { lang } from '../settings'
import { COMMAND_RUN_ALL_TESTS, COMMAND_RUN_GAME, COMMAND_RUN_PROGRAM, COMMAND_RUN_TEST, COMMAND_START_REPL } from '../shared-definitions'

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CUSTOM MESSAGES DEFINITION
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const COMMAND_EXECUTE = 'command.execute'
export const SERVER_PROCESSING_REQUEST = 'server_processing_request'
export const ERROR_MISSING_WORKSPACE_FOLDER = 'missing_workspace_folder'

const lspMessagesEn = {
  [COMMAND_RUN_GAME]: 'Run Game',
  [COMMAND_RUN_PROGRAM]: 'Run Program',
  [COMMAND_START_REPL]: 'Run in REPL',
  [COMMAND_RUN_ALL_TESTS]: 'Run all tests',
  [COMMAND_RUN_TEST]: 'Run test',
  [COMMAND_EXECUTE]: 'Run {0}',
  [SERVER_PROCESSING_REQUEST]: 'Processing Request...',
  [ERROR_MISSING_WORKSPACE_FOLDER]: 'Missing workspace folder!',
}

const lspMessagesEs = {
  [COMMAND_RUN_GAME]: 'Jugar',
  [COMMAND_RUN_PROGRAM]: 'Ejecutar programa',
  [COMMAND_START_REPL]: 'Ejecutar REPL',
  [COMMAND_RUN_ALL_TESTS]: 'Ejecutar todos los tests',
  [COMMAND_RUN_TEST]: 'Ejecutar test',
  [COMMAND_EXECUTE]: 'Ejecutar {0}',
  [SERVER_PROCESSING_REQUEST]: 'Procesando...',
  [ERROR_MISSING_WORKSPACE_FOLDER]: '¡No existe la carpeta de trabajo principal!',
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

export const getLSPMessage = (message: string, values: string[] = []): string =>
  getMessage({ message, values, language: lang(), customMessages: lspMessages })
