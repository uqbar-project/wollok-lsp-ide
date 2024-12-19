import { CompletionItem } from 'vscode-languageserver'
import { Body, Class, Describe, Entity, Environment, Import, Method, Mixin, New, Node, Package, Program, Reference, Singleton, Test, Variable, implicitImport, match, parentImport, when } from 'wollok-ts'
import { logger } from '../../utils/logger'
import { classCompletionItem, entityCompletionItem, fieldCompletionItem, initializerCompletionItem, parameterCompletionItem, singletonCompletionItem, variableCompletionItem, withImport } from './autocomplete'
import { optionAsserts, optionConstReferences, optionDescribes, optionImports, optionInitialize, optionMethods, optionModules, optionPrograms, optionPropertiesAndReferences, optionReferences, optionTests } from './options-autocomplete'

export const completionsForNode = (node: Node): CompletionItem[] => {
  try {
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
      when(Reference<Class>)(completeReference),
      when(New)(completeNew)
    )
  } catch (error) {
    logger.error(`✘ Completions for node ${node.kind} (${node.sourceMap} - ${node.sourceFileName}) failed: ${error}`, error)
    return [] // completeForParent(node)
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

const completeTest = (node: Test): CompletionItem[] => [
  ...optionReferences,
  ...optionAsserts,
  ...node.parent.is(Describe) ? node.parent.allFields.map(fieldCompletionItem) : [],
  ...completeAllSigletons(node),
]

const completeModule = (): CompletionItem[] => [
  ...optionPropertiesAndReferences,
  ...optionMethods,
]

const completeBody = (node: Body): CompletionItem[] => [
  ...completeForParent(node),
  ...node.scope.localContributions()
    .filter((value) => value[1].is(Variable))
    .map((value) => variableCompletionItem(value[1] as Variable)),
]

const completeMethod = (node: Method): CompletionItem[] => {
  const parent = node.parent
  return [
    ...node.parameters.map(parameterCompletionItem),
    ...parent.fields.map(fieldCompletionItem),
    ...completeAllSigletons(node),
  ]
}

const completeDescribe = (node: Describe): CompletionItem[] => isTestFile(node) ? [...optionConstReferences, ...optionTests, ...optionInitialize] : []

export const completeForParent = (node: Node): CompletionItem[] => {
  if (!node.parent) throw new Error('Node has no parent')
  return completionsForNode(node.parent)
}

const completeReference = (node: Reference<Class>): CompletionItem[] => {
  const nodeImport = parentImport(node)
  if (nodeImport) return completeImports(nodeImport)
  const classes = node.environment.descendants.filter(child => child.is(Class) && !child.isAbstract) as Class[]
  return classes.map(withImport(classCompletionItem)(node)).concat(completeForParent(node))
}

const completeNew = (node: New): CompletionItem[] =>
  node.instantiated.target && node.instantiated.target.is(Class) ? [withImport(initializerCompletionItem)(node)(node.instantiated.target)] : []

const availableForImport = (node: Node) => (node.is(Class) || node.is(Singleton) || node.is(Reference) || node.is(Mixin)) && node.name && (node as Entity).fullyQualifiedName && !implicitImport(node)

const completeImports = (node: Import) => (node.environment.descendants.filter(availableForImport) as Entity[]).map(entityCompletionItem)

const completeAllSigletons = (originNode: Node) => (originNode.environment.descendants.filter(node => node.is(Singleton) && !node.isClosure()) as Singleton[]).map(withImport(singletonCompletionItem)(originNode))