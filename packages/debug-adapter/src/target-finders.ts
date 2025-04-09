import { Describe, Environment, Node, Package, Program, Test } from 'wollok-ts'
import { build } from 'urijs'
import uriToPath = require('file-uri-to-path')

export type LaunchTargetArguments =
  { type: 'test', file: string, test: string, describe?: string } |
  { type: 'program', program: string, file: string, } |
  { type: 'fqn', fqn: string }

export type Target = Program | Test

export function targetFinder(type: LaunchTargetArguments): TargetFinder {
  switch(type.type) {
    case 'test': return new TestTargetFinder(type.file, type.test, type.describe)
    case 'program': return new ProgramTargetFinder(type.file, type.program)
    case 'fqn': return new FqnTargetFinder(type.fqn)
  }
}

abstract class TargetFinder {
  findTarget(environment: Environment): Target {
    const container = this.findTargetOrUndefined(environment)
    if(!container) throw new Error('Container not found')
    return container
  }

  abstract findTargetOrUndefined(environment: Environment): Target | undefined
}

export class FqnTargetFinder extends TargetFinder {
  constructor(private fqn: string) {
    super()
  }

  findTargetOrUndefined(environment: Environment): Target | undefined {
    return environment.descendants.find(node =>
      (node.is(Program) || node.is(Test)) &&
      node.fullyQualifiedName.endsWith(this.fqn)
    ) as Program | Test | undefined
  }
}

export abstract class FileTargetFinder extends TargetFinder {
  private uri: string
  constructor(clientPath: string) {
    super()
    this.uri = build({ protocol: 'file', path: clientPath })
  }

  findTargetOrUndefined(environment: Environment): Target | undefined {
    const pkg = environment.descendants.find(node => node.is(Package) && uriToPath(this.uri) === node.sourceFileName) as Package | undefined
    if(!pkg) return undefined
    return pkg.descendants.find(node => this.isValidTarget(node)) as Target | undefined
  }

  abstract isValidTarget(node: Node): boolean
}

export class ProgramTargetFinder extends FileTargetFinder {
  constructor(filePath: string, private program: string){
    super(filePath)
  }

  isValidTarget(node: Node): boolean {
    return node.is(Program) && node.name === this.program
  }
}

export class TestTargetFinder extends FileTargetFinder {
  constructor(filePath: string, private test: string, private describe?: string){
    super(filePath)
  }

  isValidTarget(node: Node): boolean {
    return node.is(Test) && node.name === `"${this.test}"` && (!this.describe || node.parent?.is(Describe) && node.parent.name === `"${this.describe}"`)
  }
}