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
} from './platform-string-utils'
import { COMMAND_RUN_ALL_TESTS, COMMAND_RUN_GAME, COMMAND_RUN_PROGRAM, COMMAND_RUN_TEST, COMMAND_START_REPL, wollokLSPExtensionCode, COMMAND_INIT_PROJECT } from './shared-definitions'

export const subscribeWollokCommands = (context: ExtensionContext): void => {
  context.subscriptions.push(registerCLICommand(COMMAND_START_REPL, startRepl))
  context.subscriptions.push(
    registerCLICommand(COMMAND_RUN_ALL_TESTS, runAllTests),
  )
  context.subscriptions.push(registerCLICommand(COMMAND_RUN_TEST, runTest))
  context.subscriptions.push(
    registerCLICommand(COMMAND_RUN_PROGRAM, runProgram()),
  )
  context.subscriptions.push(
    registerCLICommand(COMMAND_RUN_GAME, runProgram(true)),
  )
  context.subscriptions.push(
    registerCLICommand(COMMAND_INIT_PROJECT, initProject),
  )
}

/**
 * CLI Commands
 */

export const runProgram = (isGame = false) => ([fqn]: [string]): Task => {
  // Terminate previous terminal session
  vscode.commands.executeCommand('workbench.action.terminal.killAll')
  return wollokCLITask('run program', `Wollok run ${isGame ? 'game' : 'program'}`, [
    'run',
    ...isGame ? ['-g'] : [],
    asShellString(fqn),
    '--skipValidations',
  ])
}

export const runTest = ([filter, file, describe, test]: [string|null, string|null, string|null, string|null]): Task =>
  wollokCLITask('run tests', 'Wollok run test', [
    'test',
    ...filter ? [asShellString(filter)] : [],
    ...file ? ['-f', asShellString(file)] : [],
    ...describe ? ['-d', asShellString(describe)] : [],
    ...test ? ['-t', asShellString(test)] : [],
    '--skipValidations',
  ])

export const runAllTests = (): Task =>
  wollokCLITask('run tests', 'Wollok run all tests', [
    'test',
    '--skipValidations',
  ])

export const initProject = (): Task =>
  wollokCLITask('init project', 'Initialize a new project', [
    'init',
  ])

const getCurrentFileName = (document: vscode.TextDocument | undefined) =>
  document ? path.basename(document.uri.path) : 'Synthetic File'

const getFiles = (document: vscode.TextDocument | undefined): [ReturnType<typeof fsToShell>] | []  =>
  document ? [fsToShell(document.uri.fsPath)] : []

const DYNAMIC_DIAGRAM_URI = 'http://localhost:3000/'

export const startRepl = (): Task => {
  const currentDocument = window.activeTextEditor?.document
  const wollokLSPConfiguration = workspace.getConfiguration(wollokLSPExtensionCode)
  const dynamicDiagramDarkMode = wollokLSPConfiguration.get('dynamicDiagram.dynamicDiagramDarkMode') as boolean
  const openDynamicDiagram = wollokLSPConfiguration.get('dynamicDiagram.openDynamicDiagramOnRepl') as boolean
  const millisecondsToOpenDynamicDiagram = wollokLSPConfiguration.get('dynamicDiagram.millisecondsToOpenDynamicDiagram') as number

  const cliCommands = [`repl`, ...getFiles(currentDocument), '--skipValidations', dynamicDiagramDarkMode ? '--darkMode' : '', openDynamicDiagram ? '': '--skipDiagram']
  // Terminate previous tasks
  vscode.commands.executeCommand('workbench.action.terminal.killAll')
  const replTask = wollokCLITask('repl', `Wollok Repl: ${getCurrentFileName(currentDocument)}`, cliCommands)

  if (openDynamicDiagram) {
    setTimeout(() => {
      const openInternalDynamicDiagram = wollokLSPConfiguration.get('dynamicDiagram.openInternalDynamicDiagram') as boolean
      if (openInternalDynamicDiagram) {
        vscode.commands.executeCommand('simpleBrowser.show', DYNAMIC_DIAGRAM_URI)
      } else {
        vscode.env.openExternal(vscode.Uri.parse(DYNAMIC_DIAGRAM_URI))
      }
    }, millisecondsToOpenDynamicDiagram)
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

const wollokCLITask = (task: string, name: string, cliCommands: Array<string | vscode.ShellQuotedString>) => {
  const wollokCliPath: string = workspace.getConfiguration(wollokLSPExtensionCode).get('cli-path')
  // TODO: i18n - but it's in the server
  if (!wollokCliPath) {
    vscode.commands.executeCommand('workbench.action.openSettings', wollokLSPExtensionCode)
    throw new Error('Missing configuration WollokLSP/cli-path. Set the path where wollok-ts-cli is located in order to run Wollok tasks')
  }

  const folder = workspace.workspaceFolders[0]
  const shellCommandArgs: Array<string | vscode.ShellQuotedString> = [
    ...cliCommands,
    '-p',
    fsToShell(folder.uri.fsPath),
  ]

  return new Task(
    { type: 'wollok', task },
    folder,
    name,
    'wollok',
    new ShellExecution(fsToShell(wollokCliPath), shellCommandArgs),
  )
}
