import { getMessage, LANGUAGES, Messages } from 'wollok-ts'
import { wollokLSPExtensionCode } from './shared-definitions'
import { workspace } from 'vscode'

export const languageDescription: { [key: string]: LANGUAGES } = {
  Spanish: LANGUAGES.SPANISH,
  English: LANGUAGES.ENGLISH,
}

export const lang = (selectedLanguage: string): LANGUAGES => languageDescription[selectedLanguage] ?? LANGUAGES.ENGLISH

export const lspClientMessages: Messages = {
  [LANGUAGES.ENGLISH]: {
    missingWollokCliPath: 'Missing configuration WollokLSP/cli-path. Set the path where wollok-ts-cli is located in order to run Wollok tasks',
    wollokBuilding: 'Wollok Building...',
  },
  [LANGUAGES.SPANISH]: {
    missingWollokCliPath: 'Falta configurar la ruta donde está instalado wollok-ts-cli. Este paso es necesario para ejecutar cualquier comando de Wollok.',
    wollokBuilding: 'Generando Wollok...',
  },
}

export const getLSPMessage = (message: string): string => getMessage({ message, language: lang(workspace.getConfiguration(wollokLSPExtensionCode).get('language')), customMessages: lspClientMessages })