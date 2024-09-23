import { expect } from 'expect'
import * as path from 'path'
import { Position, Range } from 'vscode-languageserver'
import { Literal, Node, Package, SourceMap } from 'wollok-ts'
import { between, findPackageJSON, nodeToLocation, relativeFilePath, setWorkspaceUri } from '../utils/text-documents'

const { join, resolve }  = path.posix

describe('text document utilities', () => {
  describe('between', () => {
    it('should return true when position is between start and end lines', () => {
      expect(between({ line: 2, character: 0 }, { line: 1, character: 0 }, { line: 3, character: 0 })).toBe(true)
    })

    it('should return false when position is outside start and end lines', () => {
      expect(between({ line: 5, character: 0 }, { line: 1, character: 0 }, { line: 3, character: 0 })).toBe(false)
    })

    it('should return true when position is on start line and after start character', () => {
      expect(between({ line: 1, character: 4 }, { line: 1, character: 2 }, { line: 4, character: 3 })).toBe(true)
    })

    it('should return false when position is on start line and after before character', () => {
      expect(between({ line: 1, character: 1 }, { line: 1, character: 2 }, { line: 4, character: 3 })).toBe(false)
    })

    it('should return true when position is on finish line and before end character', () => {
      expect(between({ line: 4, character: 1 }, { line: 1, character: 2 }, { line: 4, character: 3 })).toBe(true)
    })

    it('should return false when position is on end line and after end character', () => {
      expect(between({ line: 4, character: 4 }, { line: 1, character: 2 }, { line: 4, character: 3 })).toBe(false)
    })

    it('should return false when position is on both end and start line and position is outside of character range', () => {
      expect(between({ line: 4, character: 32 }, { line: 4, character: 8 }, { line: 4, character: 18 })).toBe(false)
    })

  })

  describe('node to location', () => {

    const pepitaPackage: Package = new Package({ name: 'pepita', fileName: 'src/pepita.wlk' })
    const testNodeLocation = (node: Node, expectedFile: string, expectedRange: Range) => {
      const location = nodeToLocation(node)
      expect(location.uri).toEqual('examples/example-project/' + expectedFile)
      expect(location.range).toEqual(expectedRange)
    }

    beforeEach(() => {
      setWorkspaceUri(join('examples', 'example-project'))
    })

    it('package location', () => {
      testNodeLocation(
        pepitaPackage,
        'src/pepita.wlk',
        Range.create(Position.create(0, 0), Position.create(0, 0))
      )
    })

    it('node location', () => {
      const literal = new Literal({
        value: 42,
        sourceMap: new SourceMap({
          start: { line: 1, column: 2, offset: 2 },
          end: { line: 1, column: 4, offset: 4 },
        }),
        parent: pepitaPackage,
      })

      testNodeLocation(
        literal,
        'src/pepita.wlk',
        Range.create(Position.create(0, 1), Position.create(0, 3))
      )
    })

    it('missing file location', () => {
      const brokenPackage = new Package({ name: 'broken' })

      expect(() => nodeToLocation(brokenPackage)).toThrowError('No source file found for node')
    })

    it('missing source map location', () => {
      const literal = new Literal({
        value: 42,
        parent: pepitaPackage,
      })

      expect(() => nodeToLocation(literal)).toThrowError('No source map found for node')
    })
  })
})

describe('relative file path', () => {

  beforeEach(() => {
    setWorkspaceUri(join('examples', 'example-project'))
  })

  it('solves relative file path for a file in root path - file prefix', () => {
    setWorkspaceUri(resolve('examples', 'example-project').toString())
    const exampleFile = join('examples', 'example-project', 'example.wlk')
    expect(relativeFilePath(resolve(exampleFile).toString())).toEqual('example.wlk')
  })

  it('solves relative file path for a file in root path - without file', () => {
    const exampleFile = join('examples', 'example-project', 'example.wlk')
    expect(relativeFilePath(exampleFile)).toEqual('example.wlk')
  })

  it('solves relative file path for a file in root path - missing root folder', () => {
    const exampleFile = join('examples', 'missing-project', 'example2.wlk')
    expect(relativeFilePath(exampleFile)).toEqual(join('examples', 'missing-project', 'example2.wlk'))
  })

  it('solves relative file path for a file in root path - missing file', () => {
    const exampleFile = join('examples', 'example-project', 'example2.wlk')
    expect(relativeFilePath(exampleFile)).toEqual('example2.wlk')
  })

  it('solves relative file path for a file in root path - inner folder', () => {
    const exampleFile = join('examples', 'example-project', 'innerFolder', 'some-file.wlk')
    expect(relativeFilePath(exampleFile)).toEqual(join('innerFolder', 'some-file.wlk'))
  })

})

describe.skip('find package.json', () => {
  it('solves root folder for common project', () => {
    const defaultFolder = join('examples', 'example-project')
    expect(findPackageJSON(defaultFolder)).toEqual(join('examples', 'example-project'))
  })

  it('returns empty string if package json is not present in path', () => {
    const defaultFolder = join('missingFolder', 'example-project')
    expect(findPackageJSON(defaultFolder)).toEqual('')
  })

  it('solves root folder when package.json is in a parent folder', () => {
    const defaultFolder = join('examples', 'another-project', 'inner-folder1', 'inner-folder2')
    expect(findPackageJSON(defaultFolder)).toEqual(join('examples', 'another-project', 'inner-folder1'))
  })
})
