mixin Flier {
  var energy = 100

  method fly(minutes) {
    energy = energy - (3 * minutes)
  }
}

class Bird inherits Flier {
  var name

  method eat(food) {
    energy = energy + food.energy()
  }
}