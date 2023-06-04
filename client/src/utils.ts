import { Uri, workspace } from 'vscode'

export async function allWollokFiles(): Promise<Uri[]> {
  return workspace.findFiles('**/*.{wlk,wtest,wpgm}')
}

export function replaceAll(string: string, search: string | RegExp, replace: string): string {
  return string.toString().split(search).join(replace)
}