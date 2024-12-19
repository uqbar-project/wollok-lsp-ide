object pepita {
  var property energy = 100
  const nombre = "Pepita"

  method fly(minutes) {
    energy = energy + (10 * minutes)
  }

  method realEnergy() = energy * self.nameValue()
  method nameValue() = nombre.length()
}