import { Body, Class, Describe, Environment, Mixin, Node, Package, Program, Singleton, buildEnvironment } from 'wollok-ts'
import { buildPepitaEnvironment } from './utils/wollok-test-utils'
import { expect } from 'expect'
import { completionsForNode, completeForParent } from '../functionalities/autocomplete/node-completion'

describe('autocomplete', () => {
  describe('completions for singleton node', () => {
    let pepitaEnvironment: Environment
    let pepita: Singleton

    beforeEach(() => {
      pepitaEnvironment = buildPepitaEnvironment()
      pepita = pepitaEnvironment.getNodeByFQN<Singleton>('pepita.pepita')
    })

    it('package should complete with snippets', () => {
      testCompletionLabelsForNode(pepitaEnvironment.getNodeByFQN('pepita'), ['import', 'const attribute', 'object', 'class'])
    })

    it('singleton should complete with snippets', () => {
      testCompletionLabelsForNode(pepita, ['var attribute', 'var property', 'const attribute', 'const property', 'method (effect)', 'method (return)'])
    })

    it('method should complete with module fields, parameters and WKOs', () => {
      const comerMethod = pepita.lookupMethod('comer', 1)
      testCompletionLabelsForNodeIncludes(comerMethod!, ['comida', 'peso', 'game', 'pepita', 'keyboard', 'assert', 'console'])
    })

    it('unhandled node should complete with parent completions', () => {
      const unhandledNodeMock: Node = {
        kind: 'UnhandledNode',
        parent: pepita,
      } as unknown as Node
      expect(completionsForNode(unhandledNodeMock)).toEqual(completeForParent(unhandledNodeMock))
    })

    it('should return parents completion', () => {
      const peso = pepita.lookupField('peso')!
      expect(completeForParent(peso)).toEqual(completionsForNode(pepita))
    })

    it('should throw error when no parent available', () => {
      const unhandledNodeMock: Node = { kind: 'UnhandledNode' } as unknown as Node
      expect(() => completeForParent(unhandledNodeMock)).toThrow('Node has no parent')
    })

    it('body should complete with parent completions', () => {
      const comer = pepita.lookupMethod('comer', 1)!
      const body = comer.body! as Body
      expect(completionsForNode(body)).toEqual(completeForParent(body))
    })
  })

  describe('completions for class node', () => {
    let environment: Environment
    let birdClass: Class
    const fileName = 'completeUnitClass.wlk'
    const className = 'completeUnitClass.Bird'

    beforeEach(() => {
      environment = buildEnvironment([{ name: fileName, content: `
      class Bird {

        method fly(minutes) {
      
        }
        
      }
      
      ` }])
      birdClass = environment.getNodeByFQN<Class>(className)
    })

    it('class should complete with snippets', () => {
      testCompletionLabelsForNode(environment.getNodeByFQN(className), ['var attribute', 'var property', 'const attribute', 'const property', 'method (effect)', 'method (return)'])
    })

    it('body should complete with parent completions', () => {
      const fly = birdClass.lookupMethod('fly', 1)!
      const body = fly.body! as Body
      expect(completionsForNode(body)).toEqual(completeForParent(body))
    })
  })

  describe('completions for mixin node', () => {
    let environment: Environment
    let aMixin: Mixin
    const fileName = 'completeUnitMixin.wlk'
    const mixinName = 'completeUnitMixin.Flier'

    beforeEach(() => {
      environment = buildEnvironment([{ name: fileName, content: `
      mixin Flier {

        method fly(minutes) {
      
        }
        
      }
      
      ` }])
      aMixin = environment.getNodeByFQN<Mixin>(mixinName)
    })

    it('mixin should complete with snippets', () => {
      testCompletionLabelsForNode(environment.getNodeByFQN(mixinName), ['var attribute', 'var property', 'const attribute', 'const property', 'method (effect)', 'method (return)'])
    })

    it('body should complete with parent completions', () => {
      const fly = aMixin.lookupMethod('fly', 1)!
      const body = fly.body! as Body
      expect(completionsForNode(body)).toEqual(completeForParent(body))
    })
  })

  describe('completions for describe & tests nodes', () => {
    let environment: Environment
    let aDescribe: Describe
    const packageName = 'completeUnit'
    const fileName = 'completeUnit.wtest'

    beforeEach(() => {
      environment = buildEnvironment([{ name: fileName, content: `
      describe "group" {

        test "basic" {
          
        }
        
      }
      
      ` }])
      aDescribe = environment.getNodeByFQN<Package>(packageName).children[0] as Describe
    })

    it('describe should complete with snippets', () => {
      testCompletionLabelsForNode(aDescribe, ['const attribute', 'test', 'initializer'])
    })

    it('test should complete with snippets', () => {
      const firstTest = aDescribe.tests[0]
      testCompletionLabelsForNode(firstTest, ['var attribute', 'const attribute', 'assert equality', 'assert boolean', 'assert throws', 'assert throws message'])
    })
  })

  describe('completions for program node', () => {
    let environment: Environment
    let aProgram: Program
    const programName = 'completeUnit'
    const fileName = 'completeUnit.wpgm'

    beforeEach(() => {
      environment = buildEnvironment([{ name: fileName, content: `
      program theGame {


      }
      ` }])
      aProgram = environment.getNodeByFQN<Package>(programName).children[0] as Program
    })

    it('program should complete with snippets', () => {
      testCompletionLabelsForNode(aProgram, ['var attribute', 'const attribute'])
    })

  })

})


function testCompletionLabelsForNodeIncludes(node: Node, expectedLabels: string[]) {
  const completions = completionsForNode(node).map(completion => completion.label)
  expectedLabels.forEach(label => expect(completions).toContain(label))
}

function testCompletionLabelsForNode(node: Node, expectedLabels: string[]) {
  const completions = completionsForNode(node)
  expect(completions.map(completion => completion.label)).toStrictEqual(expectedLabels)
}