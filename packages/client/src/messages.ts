import { LANGUAGES, Messages } from 'wollok-ts'

export const languageDescription: { [key: string]: LANGUAGES } = {
  Spanish: LANGUAGES.SPANISH,
  English: LANGUAGES.ENGLISH,
}

export const lang = (selectedLanguage: string): LANGUAGES => languageDescription[selectedLanguage] ?? LANGUAGES.ENGLISH

export const lspClientMessages: Messages = {
  [LANGUAGES.ENGLISH]: {
    missingWollokCliPath: 'Falta configurar la ruta donde está instalado wollok-ts-cli. Este paso es necesario para ejecutar cualquier comando de Wollok.',
  },
  [LANGUAGES.SPANISH]: {
    missingWollokCliPath: 'Missing configuration WollokLSP/cli-path. Set the path where wollok-ts-cli is located in order to run Wollok tasks',
  },
}