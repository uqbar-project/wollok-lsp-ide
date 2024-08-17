import { WollokDebugSession } from 'wollok-debug-adapter'
import { DebugAdapterDescriptor, DebugAdapterDescriptorFactory, DebugAdapterInlineImplementation, DebugSession, ProviderResult } from 'vscode'

/**
 * Wollok **inline** debug adapter implementation factory
 */
export class WollokDebugAdapterFactory implements DebugAdapterDescriptorFactory {
  createDebugAdapterDescriptor(_session: DebugSession): ProviderResult<DebugAdapterDescriptor> {
    return new DebugAdapterInlineImplementation(new WollokDebugSession())
    // return new DebugAdapterExecutable('node', [
    //   debugExecPath,
    // ], {
    //   cwd: _session.workspaceFolder.uri.fsPath,
    // })

  }
}