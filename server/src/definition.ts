import { Environment, is, Method, Module, Node, Reference, Send, Super } from 'wollok-ts'

export const getNodeDefinition = (environment: Environment) => (node: Node): Node[] => {
  try {
    return node.match({
      Reference:  match => definedOrEmpty(referenceDefinition(match)),
      Send:  sendDefinitions(environment),
      Super:  match => definedOrEmpty(superMethodDefinition(match)),
      Self:  match => definedOrEmpty(match.ancestors().find(is('Module'))),
    })
  } catch {
    return [node]
  }
}

function referenceDefinition(ref: Reference<Node>): Node | undefined {
  return ref.target()
}


const sendDefinitions = (environment: Environment) => ( send: Send): Method[] => {
  try {
    return send.receiver.match({
      Singleton: match => definedOrEmpty(match.lookupMethod(send.message, send.args.length)),
      New: match => definedOrEmpty(match.instantiated.target()?.lookupMethod(send.message, send.args.length)),
      Self: _ => moduleFinderWithBackup(environment, send)(
        (module) => definedOrEmpty(module.lookupMethod(send.message, send.args.length))
      ),
    })
  } catch {
    return allMethodDefinitions(environment, send)
  }
}

function superMethodDefinition(superNode: Super): Method | undefined {
  const currentMethod = superNode.ancestors().find(is('Method'))!
  const module = superNode.ancestors().find(is('Module'))!
  return module.lookupMethod(currentMethod.name, superNode.args.length, { lookupStartFQN: module.fullyQualifiedName() })
}

function allMethodDefinitions(environment: Environment, send: Send): Method[] {
  const arity = send.args.length
  const name = send.message
  const methods: Method[] = []
  environment.forEach(n => {
    if(
      n.kind === 'Method' &&
      n.name === name &&
      n.parameters.length === arity
    ) {
      methods.push(n)
    }
  })
  return methods
}


// UTILS

const moduleFinderWithBackup = (environment: Environment, send: Send) => (methodFinder: (module: Module) => Method[]) => {
  const module = send.ancestors().find(is('Module'))
  if(module) {
    return methodFinder(module)
  } else {
    return allMethodDefinitions(environment, send)
  }
}

function definedOrEmpty<T>(value: T | undefined): T[] {
  return value ? [value] : []
}