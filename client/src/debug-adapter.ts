import path = require('path')
import { WollokDebugSession } from './debug-adapter/debug-session'
import { DebugAdapterDescriptor, DebugAdapterDescriptorFactory, DebugAdapterInlineImplementation, DebugSession, ProviderResult } from 'vscode'

/**
 * Wollok **inline** debug adapter implementation factory
 */
export class WollokDebugAdapterFactory implements DebugAdapterDescriptorFactory {
  createDebugAdapterDescriptor(_session: DebugSession): ProviderResult<DebugAdapterDescriptor> {
    console.log('factoryyy')
    const debugExecPath = path.join(__dirname, '..', '..', 'debug-adapter', 'out', 'debug.js')
    return new DebugAdapterInlineImplementation(new WollokDebugSession())
    // return new DebugAdapterExecutable('node', [
    //   debugExecPath,
    // ], {
    //   cwd: _session.workspaceFolder.uri.fsPath,
    // })

  }
}