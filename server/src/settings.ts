import { Connection, DidChangeConfigurationParams } from 'vscode-languageserver/node'

export interface WollokLinterSettings {
  maxNumberOfProblems: number,
  language: string
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL & PUBLISHED STATE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const SPANISH = 'es'
const ENGLISH = 'en'

const envLang = () => {
  const env = process.env
  const fullLanguage = env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE
  return fullLanguage ? fullLanguage.substring(0, 2) : SPANISH
}

const defaultSettings: WollokLinterSettings = {
  maxNumberOfProblems: 1000,
  language: envLang(),
}

let globalSettings: WollokLinterSettings = defaultSettings

const languageDescription: { [key: string]: string } = {
  'Spanish': SPANISH,
  'English': ENGLISH,
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const getDocumentSettings = async (connection: Connection) =>
  await connection.workspace.getConfiguration({ section: 'wollokLinter' }) as WollokLinterSettings

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const initializeSettings = async (connection: Connection): Promise<void> => {
  globalSettings = await getDocumentSettings(connection) || defaultSettings
}

export const settingsChanged = (change: DidChangeConfigurationParams): void => {
  globalSettings = change.settings.wollokLinter || defaultSettings
}

export const lang = (): string => languageDescription[globalSettings.language] || envLang()