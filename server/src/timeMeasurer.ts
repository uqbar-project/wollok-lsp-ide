export class TimeMeasurer {

  lastTime = this.now()

  get timeElapsed() {
    return this.now() - this.lastTime
  }

  setLastTime() {
    this.lastTime = this.now()
  }

  now(): number {
    return this.getTime(process.hrtime.bigint())
  }

  private getTime(value: bigint): number {
    return Number(value / BigInt(1000000))
  }

}