import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, targets } from '@adonisjs/core/logger'

const loggerConfig = defineConfig({
  default: 'app',

  /**
   * The loggers object can be used to define multiple loggers.
   * By default, we configure only one logger (named "app").
   */
  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL'),
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, {
            target: 'pino-pretty',
            level: env.get('LOG_LEVEL', 'info'),
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          })
          .pushIf(app.inProduction, {
            target: 'pino/file',
            level: env.get('LOG_LEVEL', 'info'),
            options: {
              destination: 1, // stdout
            },
          })
          .toArray(),
      },
      // Configuration pour logs structurés avec corrélation OpenTelemetry
      redact: {
        paths: [
          'password',
          '*.password',
          'token',
          '*.token',
          'secret',
          '*.secret',
          'authorization',
          'cookie',
          'req.headers.authorization',
          'req.headers.cookie',
        ],
        censor: '[REDACTED]',
      },
      // Champs de base pour tous les logs
      base: {
        service: 'w40k-scoring',
        version: env.get('APP_VERSION', '1.0.0'),
        environment: env.get('NODE_ENV', 'development'),
        pid: process.pid,
      },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
