// TODO: Create a .wlk file
export const pepitaFile = `object pepita {
  var peso = 0

  method comer(comida){
    var gramos = comida.calorias()
    peso = peso + gramos
  }
}`