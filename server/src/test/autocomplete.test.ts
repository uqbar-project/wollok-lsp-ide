import { expect } from 'expect'
import { CompletionItem } from 'vscode-languageserver'
import { Body, Describe, Environment, Field, Import, Literal, Method, New, Node, Package, Program, Reference, Sentence, Singleton, buildEnvironment, link } from 'wollok-ts'
import { completeForParent, completionsForNode } from '../functionalities/autocomplete/node-completion'
import { completeMessages } from '../functionalities/autocomplete/send-completion'
import { buildPepitaEnvironment } from './utils/wollok-test-utils'

describe('autocomplete', () => {
  it('completions for body should be local variables plus the parents completions', () => {
    const environment = buildPepitaEnvironment()
    const body = (environment.getNodeByFQN('pepita.pepita') as Singleton).allMethods[0].body as Body
    const completions = completionsForNodeSorted(body)
    expect(
      completions.map(completion => completion.label))
      .toEqual(['gramos', ...completeForParent(body).map(completion => completion.label)]
    )
  })

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

    it('method should complete with variables, module fields, parameters and WKOs', () => {
      const comerMethod = pepita.lookupMethod('comer', 1)!.body as Body
      testCompletionLabelsForNodeIncludes(comerMethod!, ['gramos', 'comida', 'peso', 'game', 'pepita', 'keyboard', 'assert', 'console'])
    })

    it('unhandled node should complete with parent completions', () => {
      const unhandledNodeMock: Node = {
        kind: 'UnhandledNode',
        parent: pepita,
      } as unknown as Node
      expect(completionsForNodeSorted(unhandledNodeMock)).toEqual(completeForParent(unhandledNodeMock))
    })

    it('should return parents completion', () => {
      const peso = pepita.lookupField('peso')!
      expect(completeForParent(peso)).toEqual(completionsForNodeSorted(pepita))
    })

    it('should throw error when no parent available', () => {
      const unhandledNodeMock: Node = { kind: 'UnhandledNode' } as unknown as Node
      expect(() => completeForParent(unhandledNodeMock)).toThrow('Node has no parent')
    })
  })

  describe('completions for class node', () => {
    let environment: Environment
    const fileName = 'completeUnitClass.wlk'
    const className = 'completeUnitClass.Bird'

    beforeEach(() => {
      environment = buildEnvironment([{ name: fileName, content: `
      class Bird {

        method fly(minutes) {
      
        }
        
      }
      ` }])
    })

    it('class should complete with snippets', () => {
      testCompletionLabelsForNode(environment.getNodeByFQN(className), ['var attribute', 'var property', 'const attribute', 'const property', 'method (effect)', 'method (return)'])
    })
  })

  describe('completions for mixin node', () => {
    let environment: Environment
    const fileName = 'completeUnitMixin.wlk'
    const mixinName = 'completeUnitMixin.Flier'

    beforeEach(() => {
      environment = buildEnvironment([{ name: fileName, content: `
      mixin Flier {

        method fly(minutes) {
      
        }
        
      }
      
      ` }])
    })

    it('mixin should complete with snippets', () => {
      testCompletionLabelsForNode(environment.getNodeByFQN(mixinName), ['var attribute', 'var property', 'const attribute', 'const property', 'method (effect)', 'method (return)'])
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
        var aField = "bar"
        test "basic" {
          var aVar = "baz"
        }
        
      }
      
      ` }])
      aDescribe = environment.getNodeByFQN<Package>(packageName).children[0] as Describe
    })

    it('describe should complete with snippets', () => {
      testCompletionLabelsForNode(aDescribe, ['const attribute', 'initializer', 'test'])
    })

    it('test should complete with snippets', () => {
      const firstTest = aDescribe.tests[0].body
      testCompletionLabelsForNode(firstTest, [
        // local variables
        'aVar',
        // parent fields
        'aField',
        // WKOs
        'game',
        'keyboard',
        'void',
        'collection',
        'calendar',
        'io',
        'console',
        'assert',
        'runtime',
        // snippets
        'var attribute',
        'const attribute',
        'assert equality',
        'assert boolean',
        'assert throws',
        'assert throws message',
      ])
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

  describe('completions for messages', () => {

    it('literal should show number methods first and then object methods', () => {
      const completions = completionsForMessage(new Literal({ value: 5 }))
      testFirstCompletionShouldBe(completions, 'Number')
      testCompletionOrderMessage(completions, 'square', 'identity')
    })

    it('literal should show boolean methods first and then object methods', () => {
      const completions = completionsForMessage(new Literal({ value: true }))
      testFirstCompletionShouldBe(completions, 'Boolean')
      testCompletionOrderMessage(completions, 'negate', 'identity')
    })

    it('literal should show string methods first and then object methods', () => {
      const completions = completionsForMessage(new Literal({ value: "pepita" }))
      testFirstCompletionShouldBe(completions, 'String')
      testCompletionOrderMessage(completions, 'trim', 'identity')
    })

    it('literal should show list methods first, then collection methods and finally object methods', () => {
      const completions = completionsForMessage(new Literal({ value: [new Reference({ name: 'wollok.lang.List' }), []]  }))
      testFirstCompletionShouldBe(completions, 'List')
      testCompletionOrderMessage(completions, 'size', 'map')
      testCompletionOrderMessage(completions, 'map', 'identity')
    })

    it('literal should show set methods first, then collection methods and finally object methods', () => {
      const completions = completionsForMessage(new Literal({ value: [new Reference({ name: 'wollok.lang.Set' }), []]  }))
      testFirstCompletionShouldBe(completions, 'Set')
      testCompletionOrderMessage(completions, 'union', 'map')
      testCompletionOrderMessage(completions, 'map', 'identity')
    })

    it('literal inside a body should show number methods first and then object methods', () => {
      const environment = getPepitaEnvironment('2.')
      const body = (environment.getNodeByFQN('example.pepita') as Singleton).allMethods[0].body as Body
      return completeMessages(body.environment, body)
    })

    it('should show singleton methods first and then object methods', () => {
      const completions = completionsForMessage(new Reference({ name: 'wollok.lib.assert' }))
      testCompletionOrderMessage(completions, 'throwsException', 'identity')
    })

    it('should show custom singleton methods first and then object methods', () => {
      const completions = completionsForMessage(new Reference({ name: 'example.pepita' }), getPepitaEnvironment(''))
      testFirstCompletionShouldBe(completions, 'pepita')
      expect(completions.map(completion => completion.label).slice(0, 3)).toEqual(['fly', 'eat', 'energy'])
      testCompletionOrderMessage(completions, 'energy', 'equals')
    })

    it('should show custom classes methods first, then abstract classes and finally objects', () => {
      const completions = completionsForMessage(new New({ instantiated: new Reference({ name: 'example.Cebra' }) }), getInheritanceEnvironment())
      testFirstCompletionShouldBe(completions, 'Cebra')
      testCompletionOrderMessage(completions, 'comer', 'dormir')
      testCompletionOrderMessage(completions, 'dormir', 'aparearse')
      testCompletionOrderMessage(completions, 'aparearse', '==')
    })

    it('instantiation should show target class methods first and then object methods', () => {
      const completions = completionsForMessage(new New({ instantiated: new Reference({ name: 'wollok.lang.Date' }) }))
      testFirstCompletionShouldBe(completions, 'Date')
      testCompletionOrderMessage(completions, 'isLeapYear', 'kindName')
    })

    it('default message autocompletion should show all possible options', () => {
      const testModulesContains = (modules: string[], startModule: string) => modules.find(module => module.startsWith(startModule))
      const environment = getPepitaEnvironment('(1..2)')
      const body = (environment.getNodeByFQN('example.pepita') as Singleton).allMethods[0].body as Body
      const completions = completeMessages(body.environment, body)
      const modules: string[] = [...new Set(completions.map((completion) => completion.detail ?? ''))]
      const allModules = ['pepita', 'Object', 'game', 'assert', 'Number', 'Set', 'io', 'String', 'Boolean', 'keyboard']
      allModules.forEach(module => {
        expect(testModulesContains(modules, module)).toBeTruthy()
      })
    })

  })

  describe('completion for new', () => {

    it('autocomplete options should include initializers', () => {
      const environment = getBaseEnvironment(new New({ instantiated: new Reference({ name: 'wollok.lang.Date' }) }))
      const sentence = ((environment.getNodeByFQN('aPackage.anObject') as Singleton).allMethods[0].body as Body)!.sentences[0]
      const completions = completionsForNodeSorted(sentence)
      expect(completions.length).toBe(1)
      expect(completions[0].label).toEqual('initializers')
    })

  })

  describe('completion for references', () => {

    it('autocomplete options for reference inside imports shows imports in the right order (custom, lang, lib, etc.)', () => {
      const environment = link([
        new Package({
          name:'aPackage',
          imports: [
            new Import({ isGeneric: true, entity: new Reference({ name: 'wollok.game.*' }) }),
          ],
        }),
      ], getBirdEnvironment())
      const nodeImport = (environment.getNodeByFQN('aPackage') as Package).imports[0].children[0]
      const completions = completionsForNodeSorted(nodeImport).sort(bySortText)
      expect(completions[0].label).toEqual('example.Bird')
      expect(completions[1].label).toEqual('example.Food')
    })

    it('autocomplete options for common references shows imports in the right order (custom, lang, lib, etc.)', () => {
      const environment = link([
        new Package({
          name:'aPackage',
          members: [
            new Singleton({
              name: 'pepita',
              members: [
                new Field({ name: 'x', isConstant: false, value: new Reference({ name: 'x' }) }),
              ],
            }),
          ],
        }),
      ], getBirdEnvironment())
      const nodeReference = ((environment.getNodeByFQN('aPackage.pepita') as Singleton).members[0] as Field).value
      const completions = completionsForNodeSorted(nodeReference)
      expect(completions[0].label).toEqual('Bird')
      expect(completions[1].label).toEqual('Food')
      testCompletionOrderMessage(completions, 'Date', 'Position')
    })

  })
})

function testCompletionLabelsForNodeIncludes(node: Node, expectedLabels: string[]) {
  const completions = completionsForNodeSorted(node).map(completion => completion.label)
  expectedLabels.forEach(label => expect(completions).toContain(label))
}

function testCompletionLabelsForNode(node: Node, expectedLabels: string[]) {
  const completions = completionsForNodeSorted(node).sort(bySortText)
  expect(completions.map(completion => completion.label)).toStrictEqual(expectedLabels)
}

function getBaseEnvironment(node: Sentence, baseEnvironment: Environment  | undefined = undefined): Environment {
  return link([
    new Package({
      name:'aPackage',
      members: [
        new Singleton({
          name: 'anObject',
          members: [
            new Method({
              name: 'aMethod',
              body: new Body({
                sentences: [
                  node,
                ],
              }),
            }),
          ],
        }),
      ],
    }),
  ], baseEnvironment ?? buildEnvironment([]))
}

function testFirstCompletionShouldBe(completions: CompletionItem[], moduleName: string) {
  expect((completions[0].detail ?? '').startsWith(moduleName)).toBeTruthy()
}

function testCompletionOrderMessage(completions: CompletionItem[], firstMessage: string, secondMessage: string) {
  const completionLabels = completions.map(completion => completion.label)
  const firstIndex = completionLabels.findIndex(message => message.startsWith(firstMessage))
  const secondIndex = completionLabels.findIndex(message => message.startsWith(secondMessage))
  expect(firstIndex).toBeLessThan(secondIndex)
}

function getPepitaEnvironment(code: string) {
  return buildEnvironment([{ name: 'example.wlk', content: `
    object pepita {
      var energy = 100

      method fly(minutes) {
        ${code}
      }

      method eat(food) {}
      method energy() = energy
    }
    `,
  }])
}

function getInheritanceEnvironment() {
  return buildEnvironment([{ name: 'example.wlk', content: `
    class Animal {
      var enCelo = true
      var apareamientos = 0

      method comer(comida)
      method aparearse() {
        if (enCelo) {
          apareamientos = apareamientos + 1
        }
      }
    }

    class Cebra inherits Animal {
      var energia = 100

      override method comer(comida) {
        energia = energia + (comida * 2)
      }
      override method dormir() {
        energia = 100
      }
    }
    `,
  }])

}

function getBirdEnvironment() {
  return buildEnvironment([{ name: 'example.wlk', content: `
    class Bird {
      var energy = 100

      method fly(minutes) {
      }
    }

    class Food {}
    `,
  }])
}

function bySortText(a: CompletionItem, b: CompletionItem) {
  return a.sortText!.localeCompare(b.sortText!)
}

function completionsForNodeSorted(node: Node) {
  return completionsForNode(node).sort(bySortText)
}

function completionsForMessage(node: Sentence, baseEnvironment: Environment | undefined = undefined): CompletionItem[] {
  const environment = getBaseEnvironment(node, baseEnvironment)
  const sentence = ((environment.getNodeByFQN('aPackage.anObject') as Singleton).allMethods[0].body as Body)!.sentences[0]
  return completeMessages(sentence.environment, sentence).sort(bySortText)
}
