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
  const withModule = moduleFinderWithBackup(environment, send)

  if(send.receiver.kind === 'Singleton'){
    return definedOrEmpty(send.receiver.lookupMethod(send.message, send.args.length))
  }
  if(send.receiver.kind === 'New'){

    return definedOrEmpty(send.receiver.instantiated.target()?.lookupMethod(send.message, send.args.length))
  }
  if(send.receiver.kind === 'Self'){
    return withModule(
      (module) => definedOrEmpty(module.lookupMethod(send.message, send.args.length))
    )
  }
  return allMethodDefinitions(environment, send)
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