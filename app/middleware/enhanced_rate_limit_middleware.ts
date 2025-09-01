import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Exception } from '@adonisjs/core/exceptions'

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs?: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (ctx: HttpContext) => string
  onLimitReached?: (ctx: HttpContext) => void | Promise<void>
}

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
  blockedUntil?: number
}

export default class EnhancedRateLimitMiddleware {
  private static store = new Map<string, RateLimitEntry>()
  private static cleanupInterval: NodeJS.Timeout | null = null

  static create(config: RateLimitConfig) {
    return new EnhancedRateLimitMiddleware(config)
  }

  constructor(private config: RateLimitConfig) {
    this.setupCleanup()
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const key = this.generateKey(ctx)
    const now = Date.now()
    const entry = this.getOrCreateEntry(key, now)

    // Check if currently blocked
    if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
      const remainingMs = entry.blockedUntil - now
      ctx.response.header('Retry-After', Math.ceil(remainingMs / 1000).toString())
      ctx.response.header('X-RateLimit-Limit', this.config.maxAttempts.toString())
      ctx.response.header('X-RateLimit-Remaining', '0')
      ctx.response.header('X-RateLimit-Reset', entry.blockedUntil.toString())

      throw new Exception('Too many requests', {
        status: 429,
        code: 'E_TOO_MANY_REQUESTS',
      })
    }

    // Reset if window expired
    if (now > entry.resetTime) {
      entry.count = 0
      entry.resetTime = now + this.config.windowMs
      entry.blocked = false
      entry.blockedUntil = undefined
    }

    // Check rate limit before processing request
    if (entry.count >= this.config.maxAttempts) {
      // Block for extended period
      entry.blocked = true
      entry.blockedUntil = now + (this.config.blockDurationMs || this.config.windowMs * 2)

      await this.config.onLimitReached?.(ctx)

      ctx.response.header('Retry-After', Math.ceil((entry.blockedUntil - now) / 1000).toString())
      ctx.response.header('X-RateLimit-Limit', this.config.maxAttempts.toString())
      ctx.response.header('X-RateLimit-Remaining', '0')
      ctx.response.header('X-RateLimit-Reset', entry.blockedUntil.toString())

      throw new Exception('Too many requests', {
        status: 429,
        code: 'E_TOO_MANY_REQUESTS',
      })
    }

    // Increment counter
    if (!this.config.skipSuccessfulRequests || !this.config.skipFailedRequests) {
      entry.count++
    }

    // Set rate limit headers
    const remaining = Math.max(0, this.config.maxAttempts - entry.count)
    ctx.response.header('X-RateLimit-Limit', this.config.maxAttempts.toString())
    ctx.response.header('X-RateLimit-Remaining', remaining.toString())
    ctx.response.header('X-RateLimit-Reset', entry.resetTime.toString())

    await next()

    // Adjust count based on response status
    const statusCode = ctx.response.getStatus()
    if (this.config.skipSuccessfulRequests && statusCode < 400) {
      entry.count = Math.max(0, entry.count - 1)
    } else if (this.config.skipFailedRequests && statusCode >= 400) {
      entry.count = Math.max(0, entry.count - 1)
    }
  }

  private generateKey(ctx: HttpContext): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(ctx)
    }

    const ip = ctx.request.ip()
    const userAgent = ctx.request.header('user-agent') || ''
    const route = ctx.route?.pattern || ctx.request.url()

    return `${ip}:${route}:${this.hashString(userAgent)}`
  }

  private getOrCreateEntry(key: string, now: number): RateLimitEntry {
    let entry = EnhancedRateLimitMiddleware.store.get(key)

    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        blocked: false,
      }
      EnhancedRateLimitMiddleware.store.set(key, entry)
    }

    return entry
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  private setupCleanup() {
    if (EnhancedRateLimitMiddleware.cleanupInterval) {
      return
    }

    // Clean up expired entries every 5 minutes
    EnhancedRateLimitMiddleware.cleanupInterval = setInterval(
      () => {
        const now = Date.now()
        for (const [key, entry] of EnhancedRateLimitMiddleware.store.entries()) {
          const isExpired =
            now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)
          if (isExpired) {
            EnhancedRateLimitMiddleware.store.delete(key)
          }
        }
      },
      5 * 60 * 1000
    )
  }

  // Predefined configurations
  static loginLimiter() {
    return EnhancedRateLimitMiddleware.create({
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes block
      skipSuccessfulRequests: true,
      onLimitReached: async (ctx) => {
        console.warn(`Login rate limit exceeded for IP: ${ctx.request.ip()}`)
      },
    })
  }

  static registerLimiter() {
    return EnhancedRateLimitMiddleware.create({
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 60 * 60 * 1000, // 1 hour block
      onLimitReached: async (ctx) => {
        console.warn(`Registration rate limit exceeded for IP: ${ctx.request.ip()}`)
      },
    })
  }

  static adminLimiter() {
    return EnhancedRateLimitMiddleware.create({
      maxAttempts: 50,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 15 * 60 * 1000, // 15 minutes block
      onLimitReached: async (ctx) => {
        console.warn(`Admin rate limit exceeded for IP: ${ctx.request.ip()}`)
      },
    })
  }

  static apiLimiter() {
    return EnhancedRateLimitMiddleware.create({
      maxAttempts: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 5 * 60 * 1000, // 5 minutes block
      skipFailedRequests: true,
      onLimitReached: async (ctx) => {
        console.warn(`API rate limit exceeded for IP: ${ctx.request.ip()}`)
      },
    })
  }

  static generalLimiter() {
    return EnhancedRateLimitMiddleware.create({
      maxAttempts: 200,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 2 * 60 * 1000, // 2 minutes block
      skipFailedRequests: true,
    })
  }
}
