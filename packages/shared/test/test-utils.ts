export function continueAfter(condition: () => boolean): Promise<void> {
  return new Promise(function (resolve, _reject) {
      (function waitForCondition(){
          if (condition()) return resolve()
          setTimeout(waitForCondition, 30)
      })()
  })
}
