import { Body, Environment, Node, Singleton } from 'wollok-ts'
import { buildPepitaEnvironment } from './utils/wollok-test-utils'
import { expect } from 'expect'
import { completionsForNode, completeForParent } from '../autocomplete/node-completion'

describe('autocomplete', () => {
  describe('completions for node', () => {
    let pepitaEnvironment: Environment
    let pepita: Singleton

    beforeEach(() => {
      pepitaEnvironment = buildPepitaEnvironment()
      pepita = pepitaEnvironment.getNodeByFQN<Singleton>('pepita.pepita')
    })

    it('package should complete with snippets', () => {
      testCompletionLabelsForNode(pepitaEnvironment.getNodeByFQN('pepita'), ['object', 'class'])
    })

    it('singleton should complete with snippets', () => {
      testCompletionLabelsForNode(pepita, ['var attribute', 'const attribute', 'method'])
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
})


function testCompletionLabelsForNodeIncludes(node: Node, expectedLabels: string[]) {
  const completions = completionsForNode(node).map(c => c.label)
  expectedLabels.forEach(label => expect(completions).toContain(label))
}

function testCompletionLabelsForNode(node: Node, expectedLabels: string[]) {
  const completions = completionsForNode(node)
  expect(completions.map(c => c.label)).toStrictEqual(expectedLabels)
}