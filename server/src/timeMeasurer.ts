export class TimeMeasurer {
  private times: Array<TimeElement> = []
  private initialTime: number = this.now()

  reset(): void {
    this.times = []
    this.initialTime = this.now()
  }

  finalReport(): void {
    if (!this.times) return
    console.info('Performance metrics')
    console.info('=========================')
    this.times.forEach ((timeRow, index) => {
      const time = this.elapsedTime(index)
      console.info(`o- ${timeRow.processName} ${time}`)
    })
    console.info('')
    this.reset()
  }

  addTime(processName: string): void {
    this.times.push(new TimeElement(processName, this.now()))
  }

  private now(): number {
    return this.getTime(process.hrtime.bigint())
  }

  private elapsedTime(index: number): number {
    const previousTime = index > 0 ? this.times[index - 1].time : this.initialTime
    const currentTime = this.times[index].time
    return currentTime - previousTime
  }

  private getTime(value: bigint): number {
    return Number(value / BigInt(1000000))
  }

}

class TimeElement {
  constructor(public processName: string, public time: number) {}
}