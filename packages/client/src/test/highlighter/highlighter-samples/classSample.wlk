class Bird {
  var energy = 100
  var property birthdate = new Date(day = 5, month = 5, year = 2022)

  method fly(minutes) {
    energy = energy + (10 * minutes)
  }

  method isYoung() {
    const years = new Date().difference(birthdate) / 365
    return years < 5
  }
}