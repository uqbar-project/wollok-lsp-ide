import fileUriToPath = require('file-uri-to-path')
import * as path from 'path'
import { build } from 'urijs'

export const uriFromFile = (fsPath: string): string => {
  return build({ protocol: 'file', path: definitelyPosix(fsPath) })
}

const definitelyPosix = (aPath: string) => aPath.replaceAll(path.sep, path.posix.sep);

export const uriPathToFsPath = (uriPath: string): string => {
  return fileUriToPath(build({ protocol: 'file', path: uriPath }))
}