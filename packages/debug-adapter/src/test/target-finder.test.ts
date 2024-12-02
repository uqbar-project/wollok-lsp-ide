import { FqnTargetFinder, LaunchTargetArguments, ProgramTargetFinder, targetFinder, TestTargetFinder } from '../target-finders'
import * as assert from 'node:assert'

describe('target finder', () => {
  const fqnTargetConfiguration: LaunchTargetArguments = {
    type: 'fqn',
    fqn: 'pepitaTests."pepita tests"."pepita can fly"',
  }
  const testTargetConfiguration: LaunchTargetArguments = {
    type: 'test',
    file: './pepitaTests',
    test: 'pepita can fly',
    describe: 'pepita tests',
  }

  const programTargetConfiguration: LaunchTargetArguments = {
    type: 'program',
    program: 'pepitaRun',
    file: './pepitaProgram',
  }

  describe('selects the correct target finder', () => {
    it('fqn target finder', () => {
      const finder = targetFinder(fqnTargetConfiguration)
      assert(finder instanceof FqnTargetFinder)
    })

    it('test target finder', () => {
      const finder = targetFinder(testTargetConfiguration)
      assert(finder instanceof TestTargetFinder)
    })

    it('program target finder', () => {
      const finder = targetFinder(programTargetConfiguration)
      assert(finder instanceof ProgramTargetFinder)
    })
  })
})