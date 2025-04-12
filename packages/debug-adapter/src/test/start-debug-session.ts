import * as path from 'path'
import { WollokDebugSession } from '../debug-session'
import * as fs from 'fs'

/**
 * In this file the debug session is being launched as an executable
 * instead of inline (the way it normally launches), which means we
 * dont have access to the vscode API so we must mock the workspace
 */

const FIXTURES_ROOT = path.resolve(__dirname, '../../../../packages/debug-adapter/src/test/fixtures')

const wollokFiles = fs
  .readdirSync(FIXTURES_ROOT)
  .map(aFilePath => path.resolve(FIXTURES_ROOT, aFilePath))

const mockWorkspace = {
  findFiles: (_globPattern: string) => Promise.resolve(wollokFiles.map(fsPath =>  ({ fsPath, path:(fsPath[0] === '/' ? '' : '/') + fsPath.replace(/\\/g, '/') }))),
  openTextDocument: (uri: { fsPath: string, path: string }) => Promise.resolve({ getText: () => fs.readFileSync(uri.fsPath).toString('utf-8'), uri: { fsPath: uri.fsPath, path: uri.path } }),
}

const session = new WollokDebugSession(mockWorkspace as any, '/some/path/to/wollok')
process.on('SIGTERM', () => {
  session.shutdown()
})
session.start(process.stdin, process.stdout)
