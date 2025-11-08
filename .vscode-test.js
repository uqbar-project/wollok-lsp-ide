var { defineConfig } = require('@vscode/test-cli')

module.exports = defineConfig({
  tests: [
    {
      files: 'out/client/src/test/**/*.test.js',
      version: 'stable',
      extensionDevelopmentPath: __dirname,
      workspaceFolder: `${__dirname}/packages/client/testFixture`,
      mocha: {
        color: true,
        timeout: 10 * 1000,
        ui: 'tdd',
      },
    },
  ],
})
