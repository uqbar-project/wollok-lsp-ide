import * as path from 'path'
import { commands, ExtensionContext, ShellExecution, Task, tasks, window, workspace } from 'vscode'


export const subscribeWollokCommands = (context: ExtensionContext): void => {
  context.subscriptions.push(registerCLICommand('wollok.start.repl', startRepl))
  context.subscriptions.push(registerCLICommand('wollok.run.allTests', runAllTests))
  context.subscriptions.push(registerCLICommand('wollok.run.tests', runTests))
  context.subscriptions.push(registerCLICommand('wollok.run.program', runProgram))
}

/**
 * CLI Commands
 */

export const runProgram = (fqn: string): Task => wollokCLITask('run program', 'Wollok run program', ['run', `'${fqn}'`, '--skipValidations'])

export const runTests = (filter: string): Task => wollokCLITask('run tests', 'Wollok run tests', ['test', `'${filter}'`])

export const runAllTests = (): Task => wollokCLITask('run tests', 'Wollok run all tests', ['test'])

export const startRepl = (): Task => {
  const currentDocument = window.activeTextEditor.document
  const currentFileName = path.basename(currentDocument.uri.path)
  return wollokCLITask('repl', `Wollok Repl: ${currentFileName}`, ['repl', currentDocument.fileName])
}

/**
 * Helpers
 */

const registerCLICommand = (command: string, taskBuilder: (...args: any[]) => Task) =>
  commands.registerCommand(command, (...args) => tasks.executeTask(taskBuilder(args)))

const wollokCLITask = (task: string, name: string, cliCommands: string[]) => {
  const wollokCli = workspace.getConfiguration('wollokLinter').get('cli-path')
  const folder = workspace.workspaceFolders[0]
  const shellCommand = [wollokCli, ...cliCommands, '-p', folder.uri.fsPath].join(' ')

  return new Task(
    { type: 'wollok', task },
    folder,
    name,
    'wollok',
    new ShellExecution(shellCommand)
  )
}