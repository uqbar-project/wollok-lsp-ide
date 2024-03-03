import { CompletionItem } from 'vscode-languageserver'
import { Body, Describe, Environment, Literal, Method, New, Node, Reference, Singleton, List, is, CLOSURE_EVALUATE_METHOD, allAvailableMethods, allMethods, firstNodeWithProblems, literalValueToClass } from 'wollok-ts'
import { methodCompletionItem } from './autocomplete'

export function completeMessages(environment: Environment, node: Node): CompletionItem[] {
  return methodPool(environment, node).map(method => methodCompletionItem(node, method))
}

function methodPool(environment: Environment, node: Node): List<Method> {
  if (node.is(Reference) && node.target?.is(Singleton)) {
    return node.target.allMethods
  }
  if (node.is(Literal)) {
    return literalMethods(environment, node)
  }
  if (node.is(New)) {
    return allMethods(environment, node.instantiated)
  }
  if (node.is(Body) && node.hasProblems) {
    const childAutocomplete = firstNodeWithProblems(node)
    if (childAutocomplete) {
      return methodPool(environment, childAutocomplete)
    }
  }
  return allPossibleMethods(environment, node)
}

function literalMethods(environment: Environment, literal: Literal){
  return literalValueToClass(environment, literal.value).allMethods
}

function isSymbol(message: string) {
  return /^[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑäëïöüàèìòù]+$/g.test(message)
}

function allPossibleMethods(environment: Environment, node: Node): Method[] {
  return allAvailableMethods(environment).filter(method => availableForAutocomplete(method, node))
}

function availableForAutocomplete(method: Method, node: Node) {
  return fileValidForAutocomplete(method.sourceFileName) && methodNameValidForAutocomplete(method) && (!method.parent.is(Describe) || node.ancestors.some(is(Describe)))
}

function fileValidForAutocomplete(sourceFileName: string | undefined) {
  return sourceFileName && !['wollok/vm.wlk', 'wollok/mirror.wlk'].includes(sourceFileName)
}

function methodNameValidForAutocomplete(method: Method) {
  return !isSymbol(method.name) && method.name !== CLOSURE_EVALUATE_METHOD
}