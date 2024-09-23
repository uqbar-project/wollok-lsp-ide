/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as path from 'path'
import { runTests } from '@vscode/test-electron'

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../../../')

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './index')

    const coverage = !!process.env.COVERAGE
    console.info(`Running e2e tests ${coverage ? 'with coverage' : ''}...`)

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        path.resolve(extensionDevelopmentPath, path.resolve(__dirname, '../../../../packages/client/testFixture')),
      ],
    })
  } catch (err) {
    console.error('✘ Failed to run tests', err)
    process.exit(1)
  }
}

main()
