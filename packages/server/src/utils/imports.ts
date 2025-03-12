import { Entity, Import, Package, print, Reference } from 'wollok-ts'

export const writeImportFor = (node: Entity): string => print(new Import({ entity: new Reference({ name: node.fullyQualifiedName }), isGeneric: node.is(Package) }))
