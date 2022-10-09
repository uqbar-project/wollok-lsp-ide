import { buildEnvironment, Environment } from 'wollok-ts'
import { pepitaFile } from '../mocks/file-contents'

export function buildPepitaEnvironment(): Environment {
  return buildEnvironment([{ name: 'pepita.wlk', content: pepitaFile }])
}