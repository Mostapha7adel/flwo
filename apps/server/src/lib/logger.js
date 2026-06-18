import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  redact: {
    paths: ['req.headers.cookie', 'req.headers.authorization', 'body.password', 'body.currentPassword', 'body.newPassword', 'body.token'],
    censor: '[REDACTED]',
  },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, ip: req.ip }),
    res: (res) => ({ statusCode: res.statusCode }),
    err: pino.stdSerializers.err,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

export function requestLogger() {
  return (req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
      const duration = Date.now() - start
      logger.info({ req, res, duration: `${duration}ms` }, 'request completed')
    })
    next()
  }
}
