// /* --------------------------------------------------------------------------------------------
//  * Copyright (c) Microsoft Corporation. All rights reserved.
//  * Licensed under the MIT License. See License.txt in the project root for license information.
//  * ------------------------------------------------------------------------------------------ */
import * as path from 'path'
import * as Mocha from 'mocha'
import * as glob from 'glob'
import * as NYC from 'nyc'
import 'ts-node/register'
import 'source-map-support/register'


// Thanks to https://frenya.net/blog/vscode-extension-code-coverage-nyc
// based on https://github.com/frenya/vscode-recall/blob/master/src/test/suite/index.ts
export async function run(): Promise<void> {
  let nyc: NYC | undefined

  // eslint-disable-next-line no-constant-condition
  const coverage = !!process.env.COVERAGE
  if (coverage) { // TODO: replace with parameter
    nyc = await initCoverage()
  }
  await runTests()
  if (coverage) {
    await nyc.writeCoverageFile()
    console.info(await captureStdout(nyc.report.bind(nyc)))
  }
}

export async function initCoverage(): Promise<NYC> {
  const nyc = new NYC({
    cwd: path.join(__dirname, '..', '..', '..'),
    reporter: ['json'],
    all: true,
    silent: false,
    instrument: true,
    hookRequire: true,
    hookRunInContext: true,
    hookRunInThisContext: true,
    reportDir: 'client/coverage',
    include: ['client/out/**/*.js', 'client/out/**/*.ts'],
    exclude: ['client/out/test/**'],
  })
  await nyc.reset()
  await nyc.wrap()

  // Print a warning for any module that should be instrumented and is already loaded,
  // delete its cache entry and re-require
  // NOTE: This would not be a good practice for production code (possible memory leaks), but can be accepted for unit tests
  Object.keys(require.cache).filter(file => nyc.exclude.shouldInstrument(file)).forEach(module => {
    console.warn('Module loaded before NYC, invalidating:', module)
    delete require.cache[module]
    require(module)
  })

  return nyc
}

async function runTests(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    timeout: 10 * 1000,
    color: true,
  })

  const testsRoot = __dirname

  return new Promise((resolve, reject) => {
    glob('hover.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        return reject(err)
      }

      // Add files to the test suite
      files.forEach((file) => mocha.addFile(path.resolve(testsRoot, file)))

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`))
          } else {
            resolve()
          }
        })
      } catch (err) {
        console.error(err)
        reject(err)
      }
    })
  })
}

async function captureStdout(fn): Promise<string> {
  const stdout = process.stdout.write
  let buffer = ''
  process.stdout.write = (message: string) => {
    buffer = buffer + message
    return true
  }
  await fn()
  process.stdout.write = stdout
  return buffer
}