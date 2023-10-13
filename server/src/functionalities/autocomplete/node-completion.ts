import { CompletionItem } from 'vscode-languageserver'
import { Node, Body, Method, Singleton, Module, Environment, Package, Class, Mixin, Describe, Program, Test, Reference } from 'wollok-ts'
import { is, match, when } from 'wollok-ts/dist/extensions'
import { classCompletionItem, fieldCompletionItem, parameterCompletionItem, singletonCompletionItem } from './autocomplete'
import { optionModules, optionImports, optionDescribes, optionTests, optionReferences, optionMethods, optionPrograms, optionAsserts, optionConstReferences, optionInitialize, optionPropertiesAndReferences } from './options-autocomplete'

export const completionsForNode = (node: Node): CompletionItem[] => {
  console.info(node.label, node.kind, node.parent.kind)
  try{
    return match(node)(
      when(Environment)(_ => []),
      when(Package)(completePackage),
      when(Singleton)(completeModule),
      when(Class)(completeModule),
      when(Mixin)(completeModule),
      when(Program)(completeProgram),
      when(Test)(completeTest),
      when(Body)(completeBody),
      when(Method)(completeMethod),
      when(Describe)(completeDescribe),
      when(Reference<Class>)(completeReference)
    )
  } catch {
    return completeForParent(node)
  }
}

const isTestFile = (node: Node) => node.sourceFileName?.endsWith('wtest')

const isProgramFile = (node: Node) => node.sourceFileName?.endsWith('wpgm')

const completePackage = (node: Package): CompletionItem[] => [
  ...optionImports,
  ...optionConstReferences,
  ...isTestFile(node) ? optionDescribes : isProgramFile(node) ? optionPrograms : optionModules,
]

const completeProgram = (): CompletionItem[] => [
  ...optionReferences,
]

const completeTest = (): CompletionItem[] => [
  ...optionReferences,
  ...optionAsserts,
]

const completeModule = (): CompletionItem[] => [
  ...optionPropertiesAndReferences,
  ...optionMethods,
]

const completeBody = (node: Body): CompletionItem[] => completeForParent(node)

const completeMethod = (node: Method): CompletionItem[] => {
  const parent = node.parent
  const fields = is(Module) ? parent.fields : []
  return [
    ...node.parameters.map(parameterCompletionItem),
    ...fields.map(fieldCompletionItem),
    ...(node.environment.descendants.filter(node => node.is(Singleton) && !!node.name) as Singleton[]).map(singletonCompletionItem),
  ]
}

const completeDescribe = (node: Describe): CompletionItem[] => isTestFile(node) ? [...optionConstReferences, ...optionTests, ...optionInitialize] : []

export const completeForParent = (node: Node): CompletionItem[] => {
  if(!node.parent) throw new Error('Node has no parent')
  return completionsForNode(node.parent)
}

const completeReference = (node: Reference<Class>): CompletionItem[] => {
  const classes = node.environment.descendants.filter(child => child.is(Class) && !child.isAbstract) as Class[]
  return classes.map(clazz => classCompletionItem(clazz, false))
}
