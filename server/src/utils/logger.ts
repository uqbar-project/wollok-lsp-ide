import winston, { format } from 'winston'

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: format.combine(
        format.splat(),
        format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'wollok.log' }),
  ],
})