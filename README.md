# Wollok Linter

<!-- [![Build Status](https://travis-ci.org/uqbar-project/wollok-linter.svg?branch=master)](https://travis-ci.org/uqbar-project/wollok-linter) -->

Starting from [LSP sample code](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide) for Visual Studio Code, we developed a couple of tools for Wollok using Language Server Protocol (for VSC, IntelliJ, Eclipse, Atom, Sublime, etc.)


## Linter itself

By now we have a first working version of a linter, calling wollok-ts implementation. For a deeper developer guide, please refer to the [wiki](https://github.com/uqbar-project/wollok-linter/wiki). See [installation instructions for developers](https://github.com/uqbar-project/wollok-linter/wiki/Development-Environment).

## Structure

```
.
├── client // Language Client
│   ├── src
│   │   ├── test // End to End tests for Language Client / Server
│   │   └── extension.ts // Language Client entry point
├── package.json // The extension manifest.
└── server // Language Server
    └── src
        └── server.ts // Language Server entry point
```

## TODO List

- Develop a [Test Runner](https://code.visualstudio.com/api/extension-guides/testing)
- Enhance validation messages
- Develop a [new highlighter based on AST](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide)
- Develop a REPL
- Build an internal cache and detect small changes, in order to avoid calling wollok-ts all the time
-----
- Develop an autocomplete tool (and conect with WollokDOC)
- Develop Quick fixes & Refactors
- Develop a [Dynamic Diagram view, maybe thru Notebooks](https://code.visualstudio.com/api/extension-guides/notebook)
- Develop a Type system
- Develop a Wollok Game view
- Develop a formatter (based on AST, too)
- Develop a Static Diagram view
- Develop a [Debugger](https://code.visualstudio.com/api/extension-guides/debugger-extension)
- Develop [Web extensions](https://code.visualstudio.com/api/extension-guides/web-extensions)
- Develop a [Snippet extension](https://code.visualstudio.com/api/language-extensions/snippet-guide)
