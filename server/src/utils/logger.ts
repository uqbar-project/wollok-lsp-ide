import winston, { format } from 'winston'

export const consoleFormat = format.printf(info => info.message + (info.timeElapsed ? ` | ${info.timeElapsed} ms` : ''))

export const ignorePrivate = format(info => {
  if (info.private) return false
  return info
})

export const removePrivate = format(info => {
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
        format: format.combine(
          ignorePrivate(),
          removePrivate(),
          format.timestamp(),
          format.json(),
        ),
      },
    ),
  ],
})