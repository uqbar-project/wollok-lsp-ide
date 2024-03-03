import { Uri, workspace } from 'vscode'
import { PROGRAM_FILE_EXTENSION, TEST_FILE_EXTENSION, WOLLOK_FILE_EXTENSION } from 'wollok-ts'

export async function allWollokFiles(): Promise<Uri[]> {
  return workspace.findFiles(`**/*.{${WOLLOK_FILE_EXTENSION},${TEST_FILE_EXTENSION},${PROGRAM_FILE_EXTENSION}}`)
}

export function replaceAll(
  string: string,
  search: string | RegExp,
  replace: string,
): string {
  return string.toString().split(search).join(replace)
}
