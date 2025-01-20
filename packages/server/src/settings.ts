import { Connection } from 'vscode-languageserver/node'
import { wollokLSPExtensionCode } from '../../shared/definitions'
import { LANGUAGES } from 'wollok-ts'

export const DEFAULT_REPL_PORT = 3000
export const DEFAULT_GAME_PORT = 4200

export interface WollokLSPSettings {
  maxNumberOfProblems: number
  language: LANGUAGES,
  replPortNumber: number,
  gamePortNumber: number,
  openDynamicDiagramOnRepl: boolean,
  openInternalDynamicDiagram: boolean,
  dynamicDiagramDarkMode: boolean,
  maxThreshold: number,
  millisecondsToOpenDynamicDiagram: number,
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL & PUBLISHED STATE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const envLang = () => {
  const env = process.env
  const fullLanguage = env.LC_ALL ?? env.LC_MESSAGES ?? env.LANG ?? env.LANGUAGE
  return fullLanguage === 'es' ? LANGUAGES.SPANISH : LANGUAGES.ENGLISH
}

const defaultSettings: WollokLSPSettings = {
  maxNumberOfProblems: 1000,
  language: envLang(),
  replPortNumber: DEFAULT_REPL_PORT,
  gamePortNumber: DEFAULT_GAME_PORT,
  openDynamicDiagramOnRepl: true,
  openInternalDynamicDiagram: true,
  dynamicDiagramDarkMode: true,
  maxThreshold: 100,
  millisecondsToOpenDynamicDiagram: 1000,
}

let globalSettings: WollokLSPSettings = defaultSettings

const languageDescription: { [key: string]: LANGUAGES } = {
  Spanish: LANGUAGES.SPANISH,
  English: LANGUAGES.ENGLISH,
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
export const updateDocumentSettings = async (
  connection: Connection,
): Promise<void> => {
  globalSettings =
    ((await connection.workspace.getConfiguration({
      section: wollokLSPExtensionCode,
    })) as WollokLSPSettings) || defaultSettings
}

export const initializeSettings = async (
  connection: Connection,
): Promise<void> => {
  await updateDocumentSettings(connection)
}

export const lang = (): LANGUAGES =>
  languageDescription[globalSettings.language] || envLang()

export const maxThreshold = (): number => globalSettings.maxThreshold
