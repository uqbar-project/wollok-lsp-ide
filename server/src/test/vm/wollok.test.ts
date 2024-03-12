import { expect } from 'expect'
import { join, resolve } from 'path'
import { findPackageJSON, relativeFilePath, rootFolder } from '../../utils/vm/wollok'

describe('root folder', () => {
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

describe('relative file path', () => {

  before(() => {
    // Cache the base folder
    rootFolder(join('examples', 'example-project'))
  })

  it('solves relative file path for a file in root path - file prefix', () => {
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