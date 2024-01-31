import { maxThreshold } from './settings'
import { logger } from './utils/logger'

export class TimeMeasurer {
  private times: Array<TimeElement> = []
  private initialTime: number = this.now()

  reset(): void {
    this.times = []
    this.initialTime = this.now()
  }

  finalReport(): void {
    if (!this.times) return
    this.times.forEach((timeRow, index) => {
      const time = this.elapsedTime(index)
      const thresholdReached = time > maxThreshold()
      const icon = thresholdReached ? '⌛' : '🕒'
      logger.info({
        message: `${icon} ${timeRow.processName}`,
        timeElapsed: time,
        private: !thresholdReached,
      })
    })
    this.reset()
  }

  addTime(processName: string): void {
    this.times.push(new TimeElement(processName, this.now()))
  }

  private now(): number {
    return this.getTime(process.hrtime.bigint())
  }

  private elapsedTime(index: number): number {
    const previousTime =
      index > 0 ? this.times[index - 1].time : this.initialTime
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
