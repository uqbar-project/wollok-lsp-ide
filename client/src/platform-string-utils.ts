import path = require('path')
import { ShellQuotedString, ShellQuoting, env } from 'vscode'

export function asShellString(string: string): ShellQuotedString {
  return { quoting: ShellQuoting.Strong, value: string }
}

export function fsToShell(fsPath: string): ShellQuotedString {
  return asShellString(fsPath)
}

export function transformSeparators(
  path: string,
  originalSep: string,
  targetSep: string,
): string {
  return path.split(originalSep).join(targetSep)
}