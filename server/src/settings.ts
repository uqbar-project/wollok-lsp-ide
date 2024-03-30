import { Connection } from 'vscode-languageserver/node'
import { wollokLSPExtensionCode } from './shared-definitions'

export interface WollokLSPSettings {
  maxNumberOfProblems: number
  language: string,
  openDynamicDiagramOnRepl: boolean,
  openInternalDynamicDiagram: boolean,
  dynamicDiagramDarkMode: boolean,
  maxThreshold: number,
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

const defaultSettings: WollokLSPSettings = {
  maxNumberOfProblems: 1000,
  language: envLang(),
  openDynamicDiagramOnRepl: true,
  openInternalDynamicDiagram: true,
  dynamicDiagramDarkMode: true,
  maxThreshold: 100,
}

let globalSettings: WollokLSPSettings = defaultSettings

const languageDescription: { [key: string]: string } = {
  Spanish: SPANISH,
  English: ENGLISH,
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

export const lang = (): string =>
  languageDescription[globalSettings.language] || envLang()

export const maxThreshold = (): number => globalSettings.maxThreshold