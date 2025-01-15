object pepita {
  @NotExpect(code="malformedMember")
  method doNothing() {
    // some comment
  }
}

/*
    Comment 2
*/
class Bird {
  @Type(name="Void")
  override method add(@Type(name="Element") element) native
}

/*
    Comment 3  
*/