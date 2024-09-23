import { CancellationToken, DebugConfiguration, DebugConfigurationProvider, ProviderResult, WorkspaceFolder } from 'vscode'
import * as vscode from 'vscode'

export class WollokDebugConfigurationProvider implements DebugConfigurationProvider {

  resolveDebugConfiguration(_folder: WorkspaceFolder | undefined, config: DebugConfiguration, _token?: CancellationToken): ProviderResult<DebugConfiguration> {
    if (!config.file) {
      return vscode.window.showErrorMessage("Cannot find a file to debug").then(_ => {
        return undefined	// abort launch
      })
    }

    if(config.target.program && config.target.test){
      return vscode.window.showErrorMessage("Cannot specify both program and test properties at the same time").then(_ => {
        return undefined	// abort launch
      })
    }

    if(!config.target.program && !config.target.test) {
      return vscode.window.showErrorMessage("Must specify either program or test property").then(_ => {
        return undefined	// abort launch
      })
    }

    return config
  }
}