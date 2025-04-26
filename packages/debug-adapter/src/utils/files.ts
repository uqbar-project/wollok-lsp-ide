export function fileFromPath(fsPath: string): string {
  return fsPath.split('/').pop()
}

export function fileNameFromPath(fsPath: string): string {
  return fileFromPath(fsPath).split('.')[0]
}