object pepita {
  var property energy = 100
  const name = "Pepita"

  method fly(minutes) {
    energy = energy + (10 * minutes)
  }

  method realEnergy() = energy * self.nameValue()
  method nameValue() = name.length()
  method nativeMethod() native
}