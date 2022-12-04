import { CompletionItem } from 'vscode-languageserver'
import { Environment, Method } from 'wollok-ts'
import { methodCompletionItem } from './autocomplete'

export function completeMessages(environment: Environment): CompletionItem[] {
  return allPossibleMessages(environment).map(methodCompletionItem)
}

function allPossibleMessages(environment: Environment): Method[]{
  return environment.filter(node => node.is('Method')) as Method[]
}