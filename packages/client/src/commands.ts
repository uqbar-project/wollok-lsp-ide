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
import { DEFAULT_GAME_PORT, DEFAULT_REPL_PORT } from '../../server/src/settings'
import {
  asShellString,
  fsToShell,
} from './platform-string-utils'
import { COMMAND_RUN_ALL_TESTS, COMMAND_RUN_GAME, COMMAND_RUN_PROGRAM, COMMAND_RUN_TEST, COMMAND_START_REPL, wollokLSPExtensionCode, COMMAND_INIT_PROJECT, COMMAND_DEBUG } from './shared-definitions'
import { getLSPMessage } from './messages'

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
  context.subscriptions.push(registerDebuggerCommand())
}

/**
 * CLI Commands
 */

export const runProgram = (isGame = false) => ([fqn]: [string]): Task => {
  const wollokLSPConfiguration = workspace.getConfiguration(wollokLSPExtensionCode)
  const portNumber = wollokLSPConfiguration.get('gamePortNumber') as number ?? DEFAULT_GAME_PORT

  // Terminate previous terminal session
  vscode.commands.executeCommand('workbench.action.terminal.killAll')
  return wollokCLITask('run program', `Wollok run ${isGame ? 'game' : 'program'}`, [
    'run',
    ...isGame ? ['-g', '--port', portNumber.toString()] : [],
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

export const startRepl = (): Task => {
  const currentDocument = window.activeTextEditor?.document
  const wollokLSPConfiguration = workspace.getConfiguration(wollokLSPExtensionCode)
  const dynamicDiagramDarkMode = wollokLSPConfiguration.get('dynamicDiagram.dynamicDiagramDarkMode') as boolean
  const openDynamicDiagram = wollokLSPConfiguration.get('dynamicDiagram.openDynamicDiagramOnRepl') as boolean
  const millisecondsToOpenDynamicDiagram = wollokLSPConfiguration.get('dynamicDiagram.millisecondsToOpenDynamicDiagram') as number
  const portNumber = wollokLSPConfiguration.get('replPortNumber') as number ?? DEFAULT_REPL_PORT
  const DYNAMIC_DIAGRAM_URI = `http://localhost:${portNumber}/`

  const cliCommands = [`repl`, ...getFiles(currentDocument), '--skipValidations', '--port', portNumber.toString(), dynamicDiagramDarkMode ? '--darkMode' : '', openDynamicDiagram ? '': '--skipDiagram']
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
  const wollokLSPConfiguration = workspace.getConfiguration(wollokLSPExtensionCode)
  const wollokCliPath: string = wollokLSPConfiguration.get('cli-path')
  if (!wollokCliPath) {
    vscode.commands.executeCommand('workbench.action.openSettings', wollokLSPExtensionCode)
    throw new Error(getLSPMessage('missingWollokCliPath'))
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
function registerDebuggerCommand(): { dispose(): any } {
  return commands.registerCommand(COMMAND_DEBUG, async (fqn: string) => {
    vscode.debug.startDebugging(
      vscode.workspace.workspaceFolders[0],
      {
        type: "wollok",
        request: "launch",
        name: "Launch Debug Session",
        stopOnEntry: false,
        target: {
          type: 'fqn',
          fqn,
        },
      }
    )
  })
}
