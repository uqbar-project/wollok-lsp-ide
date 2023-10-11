import { expect } from 'expect'
import { buildEnvironment } from 'wollok-ts'
import { print } from '../utils/code-generation/format'

describe('formatter', () => {
  it('should format singletons', () => {
    testFormat(
      `object     pepita {var energia =    10}`,
      `object pepita {\n var energia = 10\n}`
    )
  })


})



function testFormat(unformatted: string, expectedFormat: string) {
  const TEST_FILE_NAME = 'test'
  const file = buildEnvironment([{ name: TEST_FILE_NAME, content: unformatted }])
  expect(print(file.getNodeByFQN(TEST_FILE_NAME))).toBe(expectedFormat)
}