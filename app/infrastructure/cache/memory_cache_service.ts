import { LRUCache } from 'lru-cache'
import logger from '@adonisjs/core/services/logger'

interface CacheOptions {
  maxSize: number
  ttlMs: number
  staleWhileRevalidate?: number
}

interface CacheMetrics {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
}

/**
 * Memory Cache Service - High Performance In-Memory Caching
 *
 * Utilise LRU-cache pour une performance optimale sans Redis
 * - Caches spécialisés par domaine métier
 * - Invalidation intelligente par pattern
 * - Métriques et monitoring intégrés
 * - Stratégie cache-aside avec fallback automatique
 */
export class MemoryCacheService {
  private caches: Map<string, LRUCache<string, any>> = new Map()
  private metrics: Map<string, CacheMetrics> = new Map()

  constructor() {
    // Caches spécialisés par domaine avec TTL optimisés
    this.createCache('game_details', {
      maxSize: 100,
      ttlMs: 5 * 60 * 1000, // 5min - données fréquemment consultées
      staleWhileRevalidate: 30000, // 30s de grâce pour revalidation
    })

    this.createCache('user_sessions', {
      maxSize: 200,
      ttlMs: 30 * 60 * 1000, // 30min - sessions utilisateur
    })

    this.createCache('static_data', {
      maxSize: 50,
      ttlMs: 60 * 60 * 1000, // 1h - données statiques (missions, types)
    })

    this.createCache('score_aggregates', {
      maxSize: 500,
      ttlMs: 2 * 60 * 1000, // 2min - stats dynamiques
    })

    // Setup periodic cleanup et métriques
    this.setupPeriodicTasks()
  }

  /**
   * Crée un cache spécialisé avec configuration
   */
  private createCache(name: string, options: CacheOptions): void {
    const cache = new LRUCache({
      max: options.maxSize,
      ttl: options.ttlMs,
      allowStale: !!options.staleWhileRevalidate,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
      // Callbacks pour métriques
      dispose: () => this.incrementMetric(name, 'evictions'),
    })

    this.caches.set(name, cache)
    this.metrics.set(name, { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 })

    logger.debug(`Cache '${name}' initialized`, {
      maxSize: options.maxSize,
      ttlMs: options.ttlMs,
      staleWhileRevalidate: options.staleWhileRevalidate,
    })
  }

  /**
   * Récupère une valeur du cache
   */
  async get<T>(cacheName: string, key: string): Promise<T | null> {
    const cache = this.caches.get(cacheName)
    if (!cache) {
      logger.warn(`Cache '${cacheName}' not found`)
      return null
    }

    const value = cache.get(key)

    if (value !== undefined) {
      this.incrementMetric(cacheName, 'hits')
      return value
    }

    this.incrementMetric(cacheName, 'misses')
    return null
  }

  /**
   * Stocke une valeur dans le cache
   */
  async set<T>(cacheName: string, key: string, value: T, customTtl?: number): Promise<void> {
    const cache = this.caches.get(cacheName)
    if (!cache) {
      logger.warn(`Cache '${cacheName}' not found`)
      return
    }

    const options = customTtl ? { ttl: customTtl } : undefined
    cache.set(key, value, options)
    this.incrementMetric(cacheName, 'sets')
  }

  /**
   * Pattern cache-aside avec fallback automatique
   * 🚀 OPTIMISATION CLEF - Une seule méthode pour get-or-compute
   */
  async getOrSet<T>(
    cacheName: string,
    key: string,
    fallbackFn: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    // Tentative de récupération en cache
    let cached = await this.get<T>(cacheName, key)

    if (cached !== null) {
      return cached
    }

    // Cache miss - exécuter le fallback
    logger.debug(`Cache miss for '${cacheName}:${key}' - executing fallback`)

    try {
      const fresh = await fallbackFn()
      await this.set(cacheName, key, fresh, customTtl)
      return fresh
    } catch (error) {
      logger.error(`Fallback failed for '${cacheName}:${key}'`, {
        error: error.message,
        cacheName,
        key,
      })
      throw error
    }
  }

  /**
   * Supprime une clé spécifique
   */
  async delete(cacheName: string, key: string): Promise<boolean> {
    const cache = this.caches.get(cacheName)
    if (!cache) {
      return false
    }

    const deleted = cache.delete(key)
    if (deleted) {
      this.incrementMetric(cacheName, 'deletes')
    }

    return deleted
  }

  /**
   * Invalidation par pattern (ex: "game_123:*")
   * 🚀 OPTIMISATION - Invalidation intelligente par préfixe
   */
  async invalidatePattern(cacheName: string, pattern: string): Promise<number> {
    const cache = this.caches.get(cacheName)
    if (!cache) {
      return 0
    }

    const keysToDelete: string[] = []

    // Si le pattern contient "*", c'est un wildcard
    if (pattern.includes('*')) {
      const prefix = pattern.replace('*', '')

      for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
          keysToDelete.push(key)
        }
      }
    } else {
      // Pattern exact
      if (cache.has(pattern)) {
        keysToDelete.push(pattern)
      }
    }

    // Suppression en lot
    keysToDelete.forEach((key) => {
      cache.delete(key)
      this.incrementMetric(cacheName, 'deletes')
    })

    if (keysToDelete.length > 0) {
      logger.debug(`Invalidated ${keysToDelete.length} keys with pattern '${pattern}'`, {
        cacheName,
        pattern,
        keysDeleted: keysToDelete.length,
      })
    }

    return keysToDelete.length
  }

  /**
   * Vide complètement un cache
   */
  async clear(cacheName: string): Promise<void> {
    const cache = this.caches.get(cacheName)
    if (!cache) {
      return
    }

    const size = cache.size
    cache.clear()

    logger.info(`Cache '${cacheName}' cleared`, { itemsCleared: size })
  }

  /**
   * Récupère les statistiques d'un cache
   */
  getCacheStats(cacheName: string): {
    size: number
    maxSize: number
    metrics: CacheMetrics
    hitRate: number
  } | null {
    const cache = this.caches.get(cacheName)
    const metrics = this.metrics.get(cacheName)

    if (!cache || !metrics) {
      return null
    }

    const totalRequests = metrics.hits + metrics.misses
    const hitRate = totalRequests > 0 ? (metrics.hits / totalRequests) * 100 : 0

    return {
      size: cache.size,
      maxSize: cache.max,
      metrics,
      hitRate: Math.round(hitRate * 100) / 100, // 2 décimales
    }
  }

  /**
   * Récupère les stats globales de tous les caches
   */
  getAllCacheStats(): Record<string, any> {
    const stats: Record<string, any> = {}

    for (const cacheName of this.caches.keys()) {
      stats[cacheName] = this.getCacheStats(cacheName)
    }

    return stats
  }

  /**
   * Vérifie la santé du cache (pour monitoring)
   */
  getHealthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
  } {
    const allStats = this.getAllCacheStats()
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    const details: Record<string, any> = {}

    for (const [cacheName, stats] of Object.entries(allStats)) {
      if (!stats) continue

      // Critères de santé
      const isNearCapacity = stats.size / stats.maxSize > 0.9
      const hasLowHitRate = stats.hitRate < 50 // Moins de 50% de hit rate

      let cacheStatus = 'healthy'

      if (isNearCapacity && hasLowHitRate) {
        cacheStatus = 'unhealthy'
        overallStatus = 'unhealthy'
      } else if (isNearCapacity || hasLowHitRate) {
        cacheStatus = 'degraded'
        if (overallStatus === 'healthy') {
          overallStatus = 'degraded'
        }
      }

      details[cacheName] = {
        ...stats,
        status: cacheStatus,
        nearCapacity: isNearCapacity,
        lowHitRate: hasLowHitRate,
      }
    }

    return { status: overallStatus, details }
  }

  /**
   * Accès direct à une instance de cache (pour les cas avancés)
   */
  getCacheInstance(cacheName: string): LRUCache<string, any> | null {
    return this.caches.get(cacheName) || null
  }

  /**
   * Incrémente une métrique
   */
  private incrementMetric(cacheName: string, metric: keyof CacheMetrics): void {
    const metrics = this.metrics.get(cacheName)
    if (metrics) {
      metrics[metric]++
    }
  }

  /**
   * Setup des tâches périodiques
   */
  private setupPeriodicTasks(): void {
    // Log des métriques toutes les 10 minutes
    setInterval(
      () => {
        const allStats = this.getAllCacheStats()
        logger.info('Cache metrics report', { cacheStats: allStats })
      },
      10 * 60 * 1000
    )

    // Health check toutes les 5 minutes
    setInterval(
      () => {
        const health = this.getHealthCheck()
        if (health.status !== 'healthy') {
          logger.warn('Cache health degraded', {
            status: health.status,
            details: health.details,
          })
        }
      },
      5 * 60 * 1000
    )
  }
}
