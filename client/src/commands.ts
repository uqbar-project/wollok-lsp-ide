import * as path from 'path'
import * as vscode from 'vscode'
import {
  commands,
  ExtensionContext,
  ShellExecution,
  Task,
  tasks,
  window,
  workspace,
} from 'vscode'
import {
  asShellString,
  fsToShell,
  unknownToShell,
} from './platform-string-utils'

export const subscribeWollokCommands = (context: ExtensionContext): void => {
  context.subscriptions.push(registerCLICommand('wollok.start.repl', startRepl))
  context.subscriptions.push(
    registerCLICommand('wollok.run.allTests', runAllTests),
  )
  context.subscriptions.push(registerCLICommand('wollok.run.tests', runTests))
  context.subscriptions.push(
    registerCLICommand('wollok.run.program', runProgram),
  )
}

/**
 * CLI Commands
 */

export const runProgram = (fqn: string): Task =>
  wollokCLITask('run program', 'Wollok run program', [
    'run',
    `'${fqn}'`,
    '--skipValidations',
  ])

export const runTests = (filter: string): Task =>
  wollokCLITask('run tests', 'Wollok run tests', [
    'test',
    `'${asShellString(filter)}'`,
    '--skipValidations',
  ])

export const runAllTests = (): Task =>
  wollokCLITask('run tests', 'Wollok run all tests', [
    'test',
    '--skipValidations',
  ])

const getCurrentFileName = (document: vscode.TextDocument | undefined) =>
  document ? path.basename(document.uri.path) : 'Synthetic File'

const getFiles = (document: vscode.TextDocument | undefined) =>
  document ? [fsToShell(document.uri.fsPath)] : []

export const startRepl = (): Task => {
  const currentDocument = window.activeTextEditor?.document
  const cliCommands = [`repl`, ...getFiles(currentDocument), '--skipValidations']
  const replTask = wollokCLITask('repl', `Wollok Repl: ${getCurrentFileName(currentDocument)}`, cliCommands)
  setTimeout(() => {
    vscode.commands.executeCommand('simpleBrowser.show', 'http://localhost:3000/')
  }, 1000)
  return replTask
}

/**
 * Helpers
 */

const registerCLICommand = (
  command: string,
  taskBuilder: (...args: any[]) => Task,
) =>
  commands.registerCommand(command, (...args) =>
    tasks.executeTask(taskBuilder(args)),
  )

const wollokCLITask = (task: string, name: string, cliCommands: string[]) => {
  const wollokCli = unknownToShell(
    workspace.getConfiguration('wollokLinter').get('cli-path'),
  )
  const folder = workspace.workspaceFolders[0]
  const shellCommand = [
    wollokCli,
    ...cliCommands,
    '-p',
    fsToShell(folder.uri.fsPath),
  ].join(' ')

  return new Task(
    { type: 'wollok', task },
    folder,
    name,
    'wollok',
    new ShellExecution(shellCommand),
  )
}
