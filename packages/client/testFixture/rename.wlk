object pepita {
  var energia = 100
  
  method comer(comida) {
    energia = energia + comida.calorias()
  }
}