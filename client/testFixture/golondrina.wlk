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
  var aVar = 2
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
  method volar() { kilometros = kilometros + 100 }
}

//ShouldNotDuplicateVariablesInLinearization
//object pepitaaa inherits Caminante and Volador and Ave {}

class AbstracC {
  method c()
}

//ShouldImplementAbstractMethods
object concreto inherits AbstracC {}