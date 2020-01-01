# Wollok Linter

Starting from [LSP sample code](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide) for Visual Studio Code, we developed a couple of tools for Wollok using Language Server Protocol (for VSC, IntelliJ, Eclipse, Atom, Sublime, etc.)


## Linter

By now we have a first working version of a linter, calling wollok-ts implementation. For a deeper developer guide, please refer to the [wiki](https://github.com/uqbar-project/wollok-linter/wiki)

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

- Enhance validation messages
- Build an autocomplete tool
- Develop a new highlighter based on AST
- Build an internal cache and detect small changes, in order to avoid calling wollok-ts all the time
- Develop a formatter (based on AST, too)

