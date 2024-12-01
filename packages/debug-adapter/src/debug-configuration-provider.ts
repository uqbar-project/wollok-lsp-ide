import { CancellationToken, DebugConfiguration, DebugConfigurationProvider, ProviderResult, WorkspaceFolder } from 'vscode'
import * as vscode from 'vscode'

export class WollokDebugConfigurationProvider implements DebugConfigurationProvider {

  resolveDebugConfiguration(_folder: WorkspaceFolder | undefined, config: DebugConfiguration, _token?: CancellationToken): ProviderResult<DebugConfiguration> {
    //ToDo validations?

    return config
  }
}