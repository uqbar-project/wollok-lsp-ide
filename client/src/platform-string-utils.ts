import path = require('path')
import { replaceAll } from './utils'
import { env } from 'vscode'

export type Shell = 'bash' | 'cmd' | 'pwsh' | 'zsh'

export function asShellString(string: string): string {
  if (activeShell() === 'cmd') {
    return `"${replaceAll(string, '"', '')}"`
  }
  return `'${string}'`
}

export function asShellPath(abstractPath: string[]): string {
  const pathParser = resolvePathParser()
  return pathParser.resolve(...abstractPath)
}

function shellPathEncoding(): 'win32' | 'posix' {
  if (process.platform === 'win32') {
    return activeShell() === 'bash' ? 'posix' : 'win32'
  } else {
    return 'posix'
  }
}

export function resolvePathParser(): path.PlatformPath {
  return shellPathEncoding() === 'win32' ? path.win32 : path.posix
}

export function fsToShell(fsPath: string): string {
  return transformSeparators(fsPath, path.sep, resolvePathParser().sep)
}

export function unknownToShell(aPath: string): string {
  return (shellPathEncoding() === 'posix' ? toPosix : toWin)(aPath)
}

export function toPosix(path: string): string {
  return transformSeparators(path, '\\', '/')
}

export function toWin(path: string): string {
  return transformSeparators(path, '/', '\\')
}

export function transformSeparators(
  path: string,
  originalSep: string,
  targetSep: string,
): string {
  return path.split(originalSep).join(targetSep)
}

/**
 * @param shellPath
 * @returns Matching shell identifier
 * @default 'bash'
 */
function activeShell(): Shell {
  const shells = ['cmd', 'pwsh', 'bash', 'zsh'] as const
  return shells.find((shell) => env.shell.includes(shell)) || 'bash'
}
