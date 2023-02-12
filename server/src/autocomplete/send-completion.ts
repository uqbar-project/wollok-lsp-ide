import { CompletionItem } from 'vscode-languageserver'
import { Environment, Literal, Method, Node, Singleton } from 'wollok-ts'
import { List } from 'wollok-ts/dist/extensions'
import { literalValueToClass } from '../utils/wollok'
import { methodCompletionItem } from './autocomplete'

export function completeMessages(environment: Environment, node: Node): CompletionItem[] {
  return methodPool(environment, node).map(methodCompletionItem)
}


function methodPool(environment: Environment, node: Node): List<Method> {
  if(node.is('Reference') && node.target()?.is('Singleton')) {
    return (node.target() as Singleton).allMethods()
  }
  if(node.is('Literal')){
    return literalMethods(environment, node)
  }
  return allPossibleMethods(environment)
}

function literalMethods(environment: Environment, literal: Literal){
  return literalValueToClass(environment, literal.value).allMethods()
}

function allPossibleMethods(environment: Environment): Method[]{
  return environment.filter(node => node.is('Method')) as Method[]
}