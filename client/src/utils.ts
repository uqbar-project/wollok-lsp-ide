import { userInfo } from 'os'
import { Uri, workspace } from 'vscode'

export async function allWollokFiles(): Promise<Uri[]> {
  return workspace.findFiles('**/*.{wlk,wtest,wpgm}')
}

export function replaceAll(string: string, search: string | RegExp, replace: string): string {
  return string.toString().split(search).join(replace)
}

export function asOSString(string: string): string {
  if (process.platform === 'win32') {
    userInfo
    const config = workspace.getConfiguration('terminal')
    const shell = config.get('integrated.shell.windows') ?? config.get('integrated.defaultProfile.windows')
    if (shell === 'Command Prompt')
      return `"${replaceAll(string, '"', '\\"')}"`
  }
  return string
}