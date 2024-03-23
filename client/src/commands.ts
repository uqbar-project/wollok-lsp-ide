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
import { wollokLSPExtensionCode } from './constants'

export const subscribeWollokCommands = (context: ExtensionContext): void => {
  context.subscriptions.push(registerCLICommand('wollok.start.repl', startRepl))
  context.subscriptions.push(
    registerCLICommand('wollok.run.allTests', runAllTests),
  )
  context.subscriptions.push(registerCLICommand('wollok.run.test', runTest))
  context.subscriptions.push(
    registerCLICommand('wollok.run.program', runProgram()),
  )
  context.subscriptions.push(
    registerCLICommand('wollok.run.game', runProgram(true)),
  )
}

/**
 * CLI Commands
 */

export const runProgram = (isGame = false) => (fqn: string): Task =>
  wollokCLITask('run program', `Wollok run ${isGame ? 'game' : 'program'}`, [
    'run',
    ...isGame ? ['-g'] : [],
    `'${fqn}'`,
    '--skipValidations',
  ])

export const runTest = ([filter, file, describe, test]: [string|null, string|null, string|null, string|null]): Task =>
  wollokCLITask('run tests', 'Wollok run test', [
    'test',
    ...filter ? [`${asShellString(filter)}`] : [],
    ...file ? ['-f', file] : [],
    ...describe ? ['-d', `${asShellString(describe)}`] : [],
    ...test ? ['-t', `${asShellString(test)}`] : [],
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

const DYNAMIC_DIAGRAM_URI = 'http://localhost:3000/'

export const startRepl = (): Task => {
  const currentDocument = window.activeTextEditor?.document
  const wollokLSPConfiguration = workspace.getConfiguration(wollokLSPExtensionCode)
  const dynamicDiagramDarkMode = wollokLSPConfiguration.get('dynamicDiagramDarkMode') ?? false
  const cliCommands = [`repl`, ...getFiles(currentDocument), '--skipValidations', dynamicDiagramDarkMode ? '--darkMode' : '']
  // Terminate previous tasks
  vscode.commands.executeCommand('workbench.action.terminal.killAll')
  const replTask = wollokCLITask('repl', `Wollok Repl: ${getCurrentFileName(currentDocument)}`, cliCommands)

  const openDynamicDiagram = wollokLSPConfiguration.get('openDynamicDiagramOnRepl') as boolean
  if (openDynamicDiagram) {
    setTimeout(() => {
      const openInternalDynamicDiagram = wollokLSPConfiguration.get('openInternalDynamicDiagram') as boolean
      if (openInternalDynamicDiagram) {
        vscode.commands.executeCommand('simpleBrowser.show', DYNAMIC_DIAGRAM_URI)
      } else {
        vscode.env.openExternal(vscode.Uri.parse(DYNAMIC_DIAGRAM_URI))
      }
    }, 1000)
  }
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
  const wollokCliPath: string = workspace.getConfiguration(wollokLSPExtensionCode).get('cli-path')
  // TODO: i18n - but it's in the server
  if (!wollokCliPath) {
    vscode.commands.executeCommand('workbench.action.openSettings', wollokLSPExtensionCode)
    throw new Error('Missing configuration WollokLSP/cli-path. Set the path where wollok-ts-cli is located in order to run Wollok tasks')
  }

  const wollokCli = unknownToShell(wollokCliPath)
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
