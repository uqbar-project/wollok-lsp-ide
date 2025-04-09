import fileUriToPath = require('file-uri-to-path')
import { build } from 'urijs'

export const uriPathToFsPath = (uriPath: string): string => {
  return fileUriToPath(build({ protocol: 'file', path: uriPath }))
}