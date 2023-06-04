import { Uri, env, workspace } from 'vscode'

export async function allWollokFiles(): Promise<Uri[]> {
  return workspace.findFiles('**/*.{wlk,wtest,wpgm}')
}

export function replaceAll(string: string, search: string | RegExp, replace: string): string {
  return string.toString().split(search).join(replace)
}

export function asOSString(string: string): string {
  if (process.platform === 'win32') {
    return replaceAll(string, '"', '\\"')
  }
  return string
}

export function asShellPath(string: string): string {
  return env.shell
}