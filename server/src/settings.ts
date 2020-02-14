import { ClientCapabilities, Connection, DidChangeConfigurationParams } from 'vscode-languageserver'

interface Settings {
  wollokLinter: WollokLinterSettings
}

interface WollokLinterSettings {
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

const defaultSettings: WollokLinterSettings = {
  maxNumberOfProblems: 1000,
  language: envLang(),
}

let globalSettings: WollokLinterSettings = defaultSettings

const languageDescription: { [key: string]: string } = {
  'Spanish': 'es',
  'English': 'en',
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const getDocumentSettings = async (connection: Connection) =>
  await connection.workspace.getConfiguration({
    section: 'wollokLinter'
  }) as WollokLinterSettings

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const initializeSettings = async (connection: Connection, capabilities: ClientCapabilities) => {
  globalSettings = await getDocumentSettings(connection) || defaultSettings
}

export const settingsChanged = (connection: Connection, change: DidChangeConfigurationParams) => {
  globalSettings = change.settings.wollokLinter || defaultSettings
}

export const lang = () => languageDescription[globalSettings.language] || envLang()
