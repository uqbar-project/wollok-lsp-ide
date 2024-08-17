object pepita {
  var energia = 100
  
  method comer(comida) {
    energia += comida.calorrrr()
  }
}

object manolo {
  method estaTentado() = alpiste.esSabroso()
}

object alpiste {
  const diametro = 10
  
  method calorrrr() = diametro * 4
  
  method esSabroso() = diametro > 10
}

object manzana {
  method calorrrr() = 10
}

object nutricionista {
  method recomendariaAlpiste() = alpiste.esSabroso() && (alpiste.calorrrr() > 40)
}