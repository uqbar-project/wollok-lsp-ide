//Clase con variable que debe inicializarse 
class Golondrina {
  var energia

  method comer() {
    energia -=20
  }
}

object nido {

  //shouldPassValuesToAllAttributes
  //const pajaro = new Golondrina()

  //namedArgumentShouldExist
  //const otroPajaro = new Golondrina(e = 90, energia=0)

  //namedArgumentShouldNotAppearMoreThanOnce
  //const pajaroLoco = new Golondrina(energia =10, energia = 11)
  
  const pepa = new Golondrina(energia = 100)
  const ramas = 3

  method alimentarNido(){
    pajaro.comer()
    otroPajaro.comer()
    pajaroLoco.comer()
    pepa.comer()
  }

  method r() {return ramas}

  method aux(){
    //shouldUseSelfAndNotSingletonReference
    //nido.alimentarNido()

    //ShouldNotReassignConst
    //ramas += 2
  }
}

//ShouldInitializeAllAttributes
//object pepita inherits Golondrina {}

//Mixin para inicializar
mixin LinM0 {
  const property x
}
//Mixin que heredan sin inicializar
mixin LinM1 inherits LinM0 { }
mixin LinM2 inherits LinM0 { }

//linearizationShouldNotRepeatNamedArguments
//class LinC1 inherits LinM1(x = 1) and LinM2(x = 1) { }

// Mixin con super()
mixin Doctor {
	override method name() = "Dr. " + super()
}

//ShouldImplementAllMethodsInHierarchy
//class Tomato inherits Doctor {}

//ShouldNotHaveLoopInHierarchy
//class AfromB inherits BfromA {}
//class BfromA inherits AfromB {}

//shouldOnlyInheritFromMixin
//mixin HeredaClase inherits Golondrina {}

class AClass {}
mixin A {}

//shouldNotDefineMoreThanOneSuperclass
//class BadSubclass inherits AClass and Golondrina {}

//superclassShouldBeLastInLinearization
//class BadElBurroPorDelante inherits AClass and A {}

class OtraClaseMas {
  var property aVar = 2
  //shouldNotUseOverride
  //override method algo(){}

  //possiblyReturningBlock
  //method returning() = { return 2 }

  method a() { return aVar}
  method b() { nido.alimentarNido()}
}

class HijaDeOtraClase inherits OtraClaseMas {
  //shouldNotDuplicateFields
  //var aVar = 1
  const forGetter = 1
  //ShouldUseOverrideKeyword
  //method a() { return 2}

  //shouldMatchSuperclassReturnValue
  //override method b() {return "hola"}

  //getterMethodShouldReturnAValue
  //method forGetter(){console.println("what?")}

  method c(){return aVar + forGetter}
  //methodShouldHaveDifferentSignature
  //method c(){}

  method e(){
    var a = 1
    a = a+1
    //shouldNotDuplicateLocalVariables
    //var a = 2
    return a
  }
}

//shouldNotDuplicateGlobalDefinitions
//object nido{}

class Ave {
  var energia = 100
  method comer() { energia = energia + 50 }

  //parameterShouldNotDuplicateExistingVariable
  //method algo(energia) { return energia}

  //methodShouldExist
  //method otro() {self.noExisto()}
}

mixin Caminante {
  var property kilometros = 0
  method caminar(tiempo) { kilometros = kilometros + (4 * tiempo) }
}

mixin Volador {
  var property kilometros = 0
  //shouldDefineConstInsteadOfVar
  //var shouldBeConst = 3
  //ShouldNotDefineUnusedVariables
  //var unused = 2
  method volar() { kilometros = kilometros + 100 }
  
  method returntres () {
     return shouldBeConst
  }
  //shouldNotUseVoidMethodAsValue
  /*method usingVoid() {
    const a = self.volar()
    return a
  }//*/
}

//ShouldNotDuplicateVariablesInLinearization
//object pepitaaa inherits Caminante and Volador and Ave {}

class AbstracC {
  method a()

  //shouldNotCompareEqualityOfSingleton
  //method compare(algo){return algo==nido}

  //shouldUseBooleanValueInIfCondition
  //method nobool(){if(2){return 2}return 1}

  //shouldUseBooleanValueInLogicOperation
  //method b() { return !2}

  //shouldNotDefineUnnecesaryIf
  //method c() {if(true){return 1} return 3}

  //codeShouldBeReachable
  //method d() {if(false){return 1} return 2}

  //unnecesaryCondition
  //method e(aa) {if(true && 2==aa){return 1} return 2}
}

//ShouldImplementAbstractMethods
//object concreto inherits AbstracC {}

//shouldInitializeGlobalReference
//const globalnotinicialiced

//shouldNotDefineGlobalMutableVariables
//var globalvar = 1

//shouldNotUseReservedWords
//class Object {}

/*package otherPackage {class A {}}
package otherPackage {}//*/

//shouldMatchFileExtension
//shouldHaveNonEmptyName
/*describe "" {
  test "" {
    assert.that(true)
  }
}//*/

/*test "testTryCatchWithoutAssert" {
  try {
    1 / 0
  } catch e : Exception {
    1 + 1
  }
}//*/

class overidingC inherits AbstracC {
  //overridingMethodShouldHaveABody
  //override method a()
}

//shouldNotDefineEmptyDescribe
//describe "empty" {}