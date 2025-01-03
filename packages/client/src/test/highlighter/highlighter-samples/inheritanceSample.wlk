class Bird {
  var energy = 10
  method fly() {}
}

object pepita inherits Bird(energy = 100) {}

class MockingBird inherits Bird(energy = 120) {}

const someBird = object inherits Bird(energy = 90) {
  override method fly() {
    super()
    super()
  }
}
