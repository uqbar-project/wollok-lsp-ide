import { DebugAdapterDescriptor, DebugAdapterDescriptorFactory, DebugAdapterInlineImplementation, DebugSession, ExtensionContext, ProviderResult } from 'vscode'
import { WollokDebugSession } from './debug-session'
import * as vscode from 'vscode'
/**
 * Wollok **inline** debug adapter implementation factory
 */
export class WollokDebugAdapterFactory implements DebugAdapterDescriptorFactory {
  constructor(private context: ExtensionContext, private workspace: typeof vscode.workspace){}
  createDebugAdapterDescriptor(_session: DebugSession): ProviderResult<DebugAdapterDescriptor> {


    return new DebugAdapterInlineImplementation(new WollokDebugSession(this.workspace, this.context.extensionUri.path + '/wollok'))
  }
}