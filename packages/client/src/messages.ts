import { getMessage, LANGUAGES, Messages } from 'wollok-ts'
import { COMMAND_RUN_ALL_TESTS, COMMAND_RUN_GAME, COMMAND_RUN_PROGRAM, COMMAND_RUN_TEST, wollokLSPExtensionCode } from './shared-definitions'
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
    [COMMAND_RUN_GAME]: 'run game',
    [COMMAND_RUN_PROGRAM]: 'run program',
    [COMMAND_RUN_ALL_TESTS]: 'run all tests',
    [COMMAND_RUN_TEST]: 'run test',
  },
  [LANGUAGES.SPANISH]: {
    missingWollokCliPath: 'Falta configurar la ruta donde está instalado wollok-ts-cli. Este paso es necesario para ejecutar cualquier comando de Wollok.',
    wollokBuilding: 'Generando Wollok...',
    [COMMAND_RUN_GAME]: 'ejecutar juego',
    [COMMAND_RUN_PROGRAM]: 'ejecutar programa',
    [COMMAND_RUN_ALL_TESTS]: 'ejecutar todos los tests',
    [COMMAND_RUN_TEST]: 'ejecutar test',
  },
}

export const getLSPMessage = (message: string): string => getMessage({ message, language: lang(workspace.getConfiguration(wollokLSPExtensionCode).get('language')), customMessages: lspClientMessages })