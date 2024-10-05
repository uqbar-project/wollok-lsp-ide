object pepita {
  method vola() {
    
  }
}

object manolo {
  method hacerVolarAPepita() {
    pepita.vola()
  }
}

object  pepita_2 {
	var property vida = 2 
}

object gandalf {

	method poder() = pepita_2.vida() + 1
}