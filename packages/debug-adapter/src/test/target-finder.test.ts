import { FqnTargetFinder, LaunchTargetArguments, ProgramTargetFinder, targetFinder, TestTargetFinder } from '../target-finders'
import * as assert from 'node:assert'
import { buildEnvironment, Environment } from 'wollok-ts'

const PROGRAM_PATH = '/users/user/documents/my-project/a/pepitaProgram.wpgm'
const TEST_PATH = '/users/user/documents/my-project/a/pepitaTests.wtest'
const program = `
program pepitaRun {
  pepita.fly(10)
}
`

const test = `
describe "pepita tests" {
  test "pepita can fly" {
    pepita.fly(10)
  }
}
`


describe('target finder', () => {
  const fqnTargetConfiguration: LaunchTargetArguments = {
    type: 'fqn',
    fqn: 'pepitaTests."pepita tests"."pepita can fly"',
  }
  const testTargetConfiguration: LaunchTargetArguments = {
    type: 'test',
    file: TEST_PATH,
    test: 'pepita can fly',
    describe: 'pepita tests',
  }

  const programTargetConfiguration: LaunchTargetArguments = {
    type: 'program',
    program: 'pepitaRun',
    file: PROGRAM_PATH,
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

  describe('finds the target', () => {
    let environment: Environment
    beforeEach(() => {
      environment = buildEnvironment([
        {
          content: program,
          name: PROGRAM_PATH,
        },
        {
          content: test,
          name: TEST_PATH,
        },
      ])
    })

    it('should throw an error when the target is not found', () => {
      const finder = targetFinder({ type: 'fqn', fqn: 'some.wrong.fqn' })
      assert.throws(() => finder.findTarget(environment))
    })

    it('fqn target finder', () => {
      const finder = targetFinder(fqnTargetConfiguration)
      const target = finder.findTarget(environment)
      assert.equal(target.name, '"pepita can fly"')
    })

    it('test target finder', () => {
      const finder = targetFinder(testTargetConfiguration)
      const target = finder.findTarget(environment)
      assert.equal(target.name, '"pepita can fly"')
    })

    it('program target finder', () => {
      const finder = targetFinder(programTargetConfiguration)
      const target = finder.findTarget(environment)
      assert.equal(target.name, 'pepitaRun')
    })
  })
})