import path = require('path')

const WOLLOK_PATH_SEPARATOR = '/'
export const toWollokPath = (aPath: string): string => {
  return aPath.replace(new RegExp( '\\' + path.sep, 'g'), WOLLOK_PATH_SEPARATOR)
}

export const toClientPath = (aWollokPath: string): string => {
  return aWollokPath.replace(new RegExp( '\\' + WOLLOK_PATH_SEPARATOR, 'g'), path.sep)
}