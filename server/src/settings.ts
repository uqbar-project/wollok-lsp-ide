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
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const initializeSettings = (capabilities: ClientCapabilities) => {
  console.log('capabilities', capabilities)
}

export const settingsChanged = (connection: Connection, change: DidChangeConfigurationParams) => {
  console.log('settings changed', change.settings.wollokLinter)
  globalSettings = <WollokLinterSettings>(
    (change.settings.wollokLinter || defaultSettings)
  )
}

export const lang = () => languageDescription[globalSettings.language] || envLang()

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const getDocumentSettings = (connection: Connection) => ((resource: string) => {
  connection.workspace.getConfiguration({
    scopeUri: resource,
    section: 'wollokLinter'
  })
})


