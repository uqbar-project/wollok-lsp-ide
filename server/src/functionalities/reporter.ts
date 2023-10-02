import { Problem } from 'wollok-ts'
import { lang } from '../settings'

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// VALIDATION MESSAGES DEFINITION
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

type Message = { [key: string]: string }

const FAILURE = 'failure'

const validationMessagesEn: Message = {
  nameShouldBeginWithLowercase: 'The name {0} must start with lowercase',
  nameShouldBeginWithUppercase: 'The name {0} must start with uppercase',
  nameShouldNotBeKeyword:
    'The name {0} is a keyword, you should pick another one',
  shouldNotBeEmpty: 'Should not make an empty definition.',
  shouldUseConditionalExpression:
    'Bad usage of if! You must return the condition itself without using if.',
  shouldPassValuesToAllAttributes: 'Reference {0} not found in {1}',
  namedArgumentShouldExist: 'Reference {0} not found in {1}',
  linearizationShouldNotRepeatNamedArguments:
    'Reference {0} is initialized more than once during linearization',
  namedArgumentShouldNotAppearMoreThanOnce:
    'Reference {0} is initialized more than once',
  shouldInitializeAllAttributes:
    'You must provide initial value to the following references: {0}',
  shouldImplementAllMethodsInHierarchy:
    'Inconsistent hierarchy. Methods on mixins without super implementation on hierarchy',
  shouldUseSelfAndNotSingletonReference:
    "Don't use the name within the object. Use 'self' instead.",
  shouldNotReassignConst: 'Cannot modify constants',
  shouldNotHaveLoopInHierarchy: 'Infinite loop in hierarchy',
  shouldOnlyInheritFromMixin: 'Mixin can only inherit from another mixin',
  shouldNotDefineMoreThanOneSuperclass:
    'Bad Linearization: you cannot define multiple parent classes',
  superclassShouldBeLastInLinearization:
    'Bad Linearization: superclass should be last in linearization',
  shouldNotUseOverride: 'Method does not override anything',
  possiblyReturningBlock:
    "This method is returning a block, consider removing the '=' before curly braces.",
  shouldUseOverrideKeyword:
    'Method should be marked as override, since it overrides a superclass method',
  shouldMatchSuperclassReturnValue:
    'Superclass method returned value does not match current definition',
  getterMethodShouldReturnAValue: 'Getter should return a value',
  methodShouldHaveDifferentSignature: 'Duplicated method',
  shouldNotDuplicateVariables:
    'There is already a variable with this name in the hierarchy',
  shouldNotDuplicateFields:
    'There is already a field with this name in the hierarchy',
  shouldNotDuplicateLocalVariables:
    'There is already a local variable with this name in the hierarchy',
  shouldNotDuplicateGlobalDefinitions:
    'There is already a definition with this name in the hierarchy',
  shouldNotDuplicateVariablesInLinearization:
    'There are attributes with the same name in the hierarchy: [{0}]',
  shouldNotDuplicateEntities:
    'This name is already defined (imported from {0})',
  shouldNotImportSameFile: 'Cannot import same file',
  shouldNotImportMoreThanOnce: 'This file is already imported',
  parameterShouldNotDuplicateExistingVariable: 'Duplicated Name',
  methodShouldExist: 'Method does not exist or invalid number of arguments',
  shouldImplementInheritedAbstractMethods:
    'You must implement all inherited abstract methods',
  shouldHaveBody:
    'Method without body. You must implement it',
  shouldNotUseVoidMethodAsValue:
    'Message send "{0}" produces no value (missing return in method?)',
  shouldInitializeGlobalReference: 'Reference is never initialized',
  shouldNotDefineUnusedVariables: 'Unused variable',
  shouldNotDefineGlobalMutableVariables:
    "Global 'var' references are not allowed. You should use 'const' instead.",
  shouldDefineConstInsteadOfVar: 'Variable should be const',
  shouldNotCompareEqualityOfSingleton:
    'Comparing against named object is discouraged (missing polymorphism?)',
  shouldUseBooleanValueInIfCondition: 'Expecting a boolean',
  shouldUseBooleanValueInLogicOperation: 'Expecting a boolean',
  shouldNotDefineUnnecesaryIf: 'Unnecessary if always evaluates to true!',
  codeShouldBeReachable: 'Unreachable code',
  shouldNotDefineUnnecessaryCondition: 'Unnecessary condition',
  shouldCatchUsingExceptionHierarchy:
    'Can only catch wollok.lang.Exception or a subclass of it',
  catchShouldBeReachable: 'Unreachable catch block',
  shouldNotUseReservedWords: '{0} is a reserved name for a core element',
  shouldNotDuplicatePackageName: 'Duplicated package',
  shouldMatchFileExtension: "The file extension doesn't allow this definition",
  shouldHaveNonEmptyName: 'Tests must have a non-empty description',
  shouldHaveAssertInTest:
    'Tests must send at least one message to assert object',
  overridingMethodShouldHaveABody: 'Overriding method must have a body',
  shouldNotDefineEmptyDescribe: 'Describe should not be empty',
  shouldNotMarkMoreThanOneOnlyTest:
    "You should mark a single test with the flag 'only' (the others will not be executed)",
  [FAILURE]: 'Rule failure: ',
}

const validationMessagesEs: Message = {
  nameShouldBeginWithLowercase:
    'El nombre {0} debe comenzar con min\u00FAsculas',
  nameShouldBeginWithUppercase:
    'El nombre {0} debe comenzar con may\u00FAsculas',
  nameShouldNotBeKeyword:
    'El nombre {0} es una palabra reservada, debe cambiarla',
  shouldNotBeEmpty:
    'El elemento no puede estar vac\u00EDo: falta escribir c\u00F3digo.',
  shouldUseConditionalExpression:
    'Est\u00E1s usando incorrectamente el if. Devolv\u00E9 simplemente la expresi\u00F3n booleana.',
  shouldPassValuesToAllAttributes: 'No se encuentra la referencia {0} en {1}',
  namedArgumentShouldExist: 'No se encuentra la referencia {0} en {1}',
  linearizationShouldNotRepeatNamedArguments:
    'La referencia {0} est\u00E1 inicializada m\u00E1s de una vez',
  namedArgumentShouldNotAppearMoreThanOnce:
    'La referencia {0} est\u00E1 inicializada m\u00E1s de una vez',
  shouldInitializeAllAttributes:
    'Debe proveer un valor inicial a las siguientes referencias: {0}',
  shouldImplementAllMethodsInHierarchy:
    'Jerarqu\u00EDa inconsistente. Existen m\u00E9todos en mixins que requieren implementaci\u00F3n en super',
  shouldUseSelfAndNotSingletonReference:
    "No debe usar el nombre del objeto dentro del mismo. Use 'self'.",
  shouldNotReassignConst: 'No se pueden modificar las referencias constantes',
  shouldNotHaveLoopInHierarchy:
    'La jerarqu\u00EDa de clases produce un ciclo infinito',
  shouldOnlyInheritFromMixin:
    'Los mixines solo pueden heredar de otros mixines',
  shouldNotDefineMoreThanOneSuperclass:
    'Linearizaci\u00F3n: no se puede definir m\u00E1s de una superclase',
  superclassShouldBeLastInLinearization:
    'Linearizaci\u00F3n: la superclase deber\u00EDa estar \u00FAltima en linearizaci\u00F3n',
  shouldNotUseOverride:
    'Este m\u00E9todo no sobrescribe ning\u00FAn otro m\u00E9todo',
  possiblyReturningBlock:
    "Este m\u00E9todo devuelve un bloque, si no es la intenci\u00F3n elimine el '=' antes de las llaves.",
  shouldUseOverrideKeyword:
    "Deber\u00EDa marcarse el m\u00E9todo con 'override', ya que sobrescribe el de sus superclases",
  shouldMatchSuperclassReturnValue:
    'El valor del tipo devuelto no coincide con el m\u00E9todo definido en la superclase',
  getterMethodShouldReturnAValue:
    'El m\u00E9todo getter debe retornar un valor',
  methodShouldHaveDifferentSignature: 'M\u00E9todo duplicado',
  shouldNotDuplicateVariables:
    'Ya existe una variable con este nombre en la jerarqu\u00EDa',
  shouldNotDuplicateFields:
    'Ya existe un atributo con este nombre en la jerarqu\u00EDa',
  shouldNotDuplicateLocalVariables:
    'Ya existe una variable local con este nombre en la jerarqu\u00EDa',
  shouldNotDuplicateGlobalDefinitions:
    'Ya existe una definici\u00F3n con este nombre en la jerarqu\u00EDa',
  shouldNotDuplicateVariablesInLinearization:
    'En la jerarqu\u00EDa hay atributos con el mismo nombre: [{0}]',
  shouldNotDuplicateEntities:
    'Este nombre ya est\u00E1 definido (importado de {0})',
  shouldNotImportSameFile: 'No se puede importar el mismo archivo',
  shouldNotImportMoreThanOnce: 'Este archivo ya est\u00E1 importado',
  parameterShouldNotDuplicateExistingVariable: 'Nombre duplicado',
  methodShouldExist:
    'El m\u00E9todo no existe o n\u00FAmero incorrecto de argumentos',
  shouldImplementInheritedAbstractMethods:
    'Debe implementar todos los m\u00E9todos abstractos heredados',
  shouldHaveBody:
    'El método debe tener una implementación',
  shouldNotUseVoidMethodAsValue:
    'El mensaje "{0}" no retorna ning\u00FAn valor (quiz\u00E1s te falte un return en el m\u00E9todo)',
  shouldInitializeGlobalReference: 'La referencia nunca se inicializa',
  shouldNotDefineUnusedVariables: 'Esta variable nunca se utiliza',
  shouldNotDefineGlobalMutableVariables:
    'Solo se permiten las variables globales de tipo const',
  shouldDefineConstInsteadOfVar: 'Esta variable deber\u00EDa ser una constante',
  shouldNotCompareEqualityOfSingleton:
    'No se aconseja comparar objetos nombrados, considere utilizar polimorfismo.',
  shouldUseBooleanValueInIfCondition: 'Se espera un booleano',
  shouldUseBooleanValueInLogicOperation: 'Se espera un booleano',
  shouldNotDefineUnnecesaryIf:
    'If innecesario. Siempre se eval\u00FAa como verdadero',
  codeShouldBeReachable: 'Este c\u00F3digo nunca se va a ejecutar',
  shouldNotDefineUnnecessaryCondition: 'Condici\u00F3n innecesaria',
  shouldCatchUsingExceptionHierarchy:
    "Solo se puede aplicar 'catch' a un objeto de tipo wollok.lang.Exception o una subclase",
  catchShouldBeReachable:
    'Este catch nunca se va a ejecutar debido a otro catch anterior',
  shouldNotUseReservedWords:
    '{0} es una palabra reservada por la biblioteca de Wollok',
  shouldNotDuplicatePackageName: 'Package duplicado',
  shouldMatchFileExtension:
    'La extensi\u00F3n del archivo no permite esta definici\u00F3n',
  shouldHaveNonEmptyName:
    'Los tests deben tener una descripci\u00F3n no vac\u00EDa',
  shouldHaveAssertInTest:
    'Los tests deben enviar al menos un mensaje al WKO "assert"',
  overridingMethodShouldHaveABody:
    'Si sobrescribe debe especificar el cuerpo del m\u00E9todo',
  shouldNotDefineEmptyDescribe: 'El describe no deber\u00EDa estar vac\u00EDo',
  shouldNotMarkMoreThanOneOnlyTest:
    "Solo un test puede marcarse como 'only' (los otros no se ejecutar\u00E1n)",
  [FAILURE]: 'La siguiente regla fall\u00F3: ',
}

const MISSING_WOLLOK_TS_CLI = 'missing_wollok_ts_cli'

const lspMessagesEn = {
  [MISSING_WOLLOK_TS_CLI]: 'Missing configuration WollokLSP/cli-pat in order to run Wollok tasks',
}

const lspMessagesEs = {
  [MISSING_WOLLOK_TS_CLI]: 'Falta la configuración WollokLSP/cli-path para poder ejecutar tareas de Wollok',
}

const messages: { [key: string]: Message } = {
  en: {
    ...validationMessagesEn,
    ...lspMessagesEn,
  },
  es: {
    ...validationMessagesEs,
    ...lspMessagesEs,
  },
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const convertToHumanReadable = (code: string) => {
  if (!code) {
    return ''
  }
  const result = code.replace(
    /[A-Z0-9]+/g,
    (match) => ' ' + match.toLowerCase()
  )
  return (
    validationI18nized()[FAILURE] +
    result.charAt(0).toUpperCase() +
    result.slice(1, result.length)
  )
}

const interpolateValidationMessage = (message: string, ...values: string[]) =>
  message.replace(/{\d*}/g, (match: string) => {
    const index = match.replace('{', '').replace('}', '') as unknown as number
    return values[index] || ''
  })

const validationI18nized = () => messages[lang()] as Message

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export const reportValidationMessage = (problem: Problem): string =>
  getMessage(problem.code, problem.values.concat())

export const getMessage = (message: string, values: string[]): string =>
  interpolateValidationMessage(validationI18nized()[message] || convertToHumanReadable(message), ...values)
