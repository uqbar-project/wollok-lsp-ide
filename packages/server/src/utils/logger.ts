import * as winston from 'winston'

export const consoleFormat = winston.format.printf(info => info.message + (info.timeElapsed ? ` | ${info.timeElapsed} ms` : ''))

export const ignorePrivate = winston.format(info => {
  if (info.private) return false
  return info
})

export const removePrivate = winston.format(info => {
  delete info.private
  return info
})

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File(
      {
        filename: 'log/wollok.log',
        maxsize: 1000000,
        format: winston.format.combine(
          ignorePrivate(),
          removePrivate(),
          winston.format.timestamp(),
          winston.format.json(),
        ),
      },
    ),
  ],
})