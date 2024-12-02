import { CancellationToken, DebugConfiguration, DebugConfigurationProvider, ProviderResult, WorkspaceFolder } from 'vscode'
import * as vscode from 'vscode'

const targetTypeRequiredKeys = {
  'fqn': ['fqn'],
  'program': ['file', 'program'],
  'test': ['file', 'test'],
}

export class WollokDebugConfigurationProvider implements DebugConfigurationProvider {

  resolveDebugConfiguration(_folder: WorkspaceFolder | undefined, config: DebugConfiguration, _token?: CancellationToken): ProviderResult<DebugConfiguration> {
    if(!config.target.type) {
      return vscode.window.showErrorMessage('No target type provided').then(() => undefined)
    }

    if(!targetTypeRequiredKeys[config.target.type]) {
      return vscode.window.showErrorMessage(`Unknown target type: ${config.target.type}`).then(() => undefined)
    }

    const missingKeys = targetTypeRequiredKeys[config.target.type].filter(key => !config.target[key])
    if(missingKeys.length) {
      return vscode.window.showErrorMessage(`Missing required target parameters: ${missingKeys.join(', ')}`).then(() => undefined)
    }

    return config
  }
}