import * as path from 'path'
import { WollokDebugSession } from '../debug-session'
import * as fs from 'fs'

const FIXTURES_ROOT = path.resolve(__dirname, '..', '..', 'src', 'test', 'fixtures')

const wollokFiles = fs
  .readdirSync(FIXTURES_ROOT)
  .map(aFilePath => path.resolve(FIXTURES_ROOT, aFilePath))

const mockWorkspace = {
  findFiles: (_globPattern: string) => Promise.resolve(wollokFiles.map(fsPath =>  ({ fsPath }))),
  openTextDocument: (path: {fsPath: string}) => Promise.resolve({ getText: () => fs.readFileSync(path.fsPath).toString('utf-8') }),
}

const session = new WollokDebugSession(mockWorkspace as any)
process.on('SIGTERM', () => {
  session.shutdown()
})
session.start(process.stdin, process.stdout)
