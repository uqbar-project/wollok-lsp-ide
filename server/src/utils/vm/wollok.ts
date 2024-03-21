import { Environment, Package } from 'wollok-ts'

export const projectPackages = (environment: Environment): Package[] =>
  environment.members.slice(1)

export const isImportedIn = (importedPackage: Package, importingPackage: Package): boolean =>
  importedPackage !== importingPackage &&
  !importingPackage.imports.some(imported => imported.entity.target === importedPackage) &&
  !importedPackage.isGlobalPackage