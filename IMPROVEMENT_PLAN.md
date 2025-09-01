# 🚀 Plan d'Amélioration Technique - W40K Scoring

**Approche** : Excellence Technique avec Refonte Optimisée  
**Équipe** : 1 développeur intermédiaire + Claude Code  
**Contexte** : Volume modéré (<10 utilisateurs), données critiques, budget serré

---

## 🎯 Stratégie Globale

### **Principe Directeur**

> **"Excellence technique sans compromis, solutions pragmatiques et économiques"**

### **Stack Technique Optimisée**

- **Base actuelle** : AdonisJS 6 + Vue 3 ✅ (excellente, on garde)
- **Ajouts proposés** :
  - **SQLite en dev** → **PostgreSQL optimisé** (déjà en place)
  - **Cache applicatif** → Solution Node.js native (sans Redis)
  - **Monitoring** → Pino + structured logging
  - **Security** → Shield + Helmet complets

---

## 📋 Phase 1: Corrections Critiques Sécuritaires

### **🚨 Priorité Absolue (Délai: 3-5 jours)**

#### **1.1 Élimination Logs Sensibles**

```typescript
// ❌ AVANT (admin_user_service.ts:378,384)
console.log(`Welcome email would be sent to ${user.email} with temp password: ${tempPassword}`)

// ✅ APRÈS - Solution sécurisée
import logger from '@adonisjs/core/services/logger'

// Logging sécurisé avec structure
logger.info('User password reset initiated', {
  userId: user.id,
  userEmail: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Email masqué
  action: 'password_reset',
  timestamp: DateTime.now().toISO(),
  // ❌ JAMAIS de mot de passe dans les logs
})

// Service de notification séparé
class SecureNotificationService {
  private async sendPasswordEmail(user: User, tempPassword: string) {
    // Email envoyé directement sans logging du password
    logger.info(`Password reset email queued for user ${user.id}`)
  }
}
```

#### **1.2 Sécurisation CORS Complète**

```typescript
// config/cors.ts - Configuration production-ready
import env from '#start/env'

const corsConfig = defineConfig({
  enabled: true,
  origin: (origin, callback) => {
    // Environnement-specific origins
    const allowedOrigins =
      env.get('NODE_ENV') === 'production'
        ? ['https://w40kscoring.yourdomain.com', 'https://www.w40kscoring.yourdomain.com']
        : [
            'http://localhost:3333',
            'http://localhost:5173', // Vite dev server
            'http://127.0.0.1:3333',
          ]

    // Allow no origin (pour les apps mobiles futures)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      logger.warn(`CORS blocked origin: ${origin}`)
      callback(new Error('CORS policy violation'), false)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  headers: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
  ],
  maxAge: 86400, // 24h cache des preflight
})
```

#### **1.3 Content Security Policy Robuste**

```typescript
// config/shield.ts - CSP complet pour W40K app
import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  csp: {
    enabled: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Pour Inertia.js (minimal nécessaire)
        '@viteDevUrl', // Dev uniquement
        '@viteUrl', // Production
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Pour Tailwind utilities
        'https://fonts.googleapis.com', // Si Google Fonts utilisées
      ],
      imgSrc: [
        "'self'",
        'data:', // Pour les avatars base64 futurs
        'https:', // Images externes W40K si nécessaire
      ],
      fontSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      connectSrc: [
        "'self'",
        '@viteHmrUrl', // HMR dev
      ],
      frameSrc: ["'none'"], // Pas d'iframe
      objectSrc: ["'none'"], // Sécurité
      upgradeInsecureRequests: [], // Force HTTPS en prod
    },
    reportOnly: false, // Active en production
  },

  // Headers sécuritaires additionnels
  hsts: {
    enabled: true,
    maxAge: '1 year',
    includeSubDomains: true,
  },

  xFrame: {
    enabled: true,
    action: 'DENY', // Anti-clickjacking
  },

  contentTypeSniffing: {
    enabled: true, // Anti-MIME sniffing
  },
})
```

#### **1.4 Rate Limiting Complet**

```typescript
// middleware/enhanced_rate_limit_middleware.ts
import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessful?: boolean
}

class EnhancedRateLimitMiddleware {
  // Configuration par endpoint
  private configs: Record<string, RateLimitConfig> = {
    'auth:login': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 tentatives/15min
    'auth:register': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 inscriptions/h
    'admin:*': { windowMs: 5 * 60 * 1000, maxRequests: 100 }, // 100 actions admin/5min
    'api:*': { windowMs: 60 * 1000, maxRequests: 60 }, // 60 req/min par défaut
    'password:reset': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 reset/h
  }

  async handle({ request, response, session }: HttpContext, next: NextFn) {
    const key = this.getRouteKey(request)
    const config = this.getConfig(key)

    if (!config) return next()

    const identifier = this.getIdentifier(request, session)
    const isAllowed = await this.checkRateLimit(identifier, key, config)

    if (!isAllowed) {
      logger.warn(`Rate limit exceeded`, {
        ip: request.ip(),
        route: key,
        userAgent: request.header('user-agent'),
      })

      return response.tooManyRequests({
        error: 'Trop de tentatives. Veuillez patienter.',
        retryAfter: config.windowMs / 1000,
      })
    }

    return next()
  }
}
```

---

## 🔧 Phase 2: Optimisation Performance Critique

### **🚀 Architecture de Données (Délai: 1 semaine)**

#### **2.1 Résolution N+1 Queries - Solution DDD**

```typescript
// domain/repositories/enhanced_score_repository.ts
interface ScoreQueryRepository {
  // ✅ Nouvelle méthode optimisée
  findByGameIdWithRounds(gameId: GameId): Promise<Score[]>
  findScoresByGameIdGroupedByRound(gameId: GameId): Promise<Map<RoundId, Score[]>>
}

// infrastructure/repositories/lucid_score_query_repository.ts
export class LucidScoreQueryRepository implements ScoreQueryRepository {
  async findByGameIdWithRounds(gameId: GameId): Promise<Score[]> {
    // 🚀 Une seule requête optimisée avec JOIN
    const scoreModels = await ScoreModel.query()
      .join('rounds', 'scores.round_id', 'rounds.id')
      .where('rounds.game_id', gameId.value)
      .preload('round') // Eager loading
      .orderBy('rounds.round_number')
      .orderBy('scores.created_at')

    return scoreModels.map((model) => this.toDomainEntity(model))
  }

  async findScoresByGameIdGroupedByRound(gameId: GameId): Promise<Map<RoundId, Score[]>> {
    const scores = await this.findByGameIdWithRounds(gameId)

    // Groupement en mémoire (plus efficace que plusieurs requêtes)
    const groupedScores = new Map<RoundId, Score[]>()

    for (const score of scores) {
      const roundId = score.roundId
      if (!groupedScores.has(roundId)) {
        groupedScores.set(roundId, [])
      }
      groupedScores.get(roundId)!.push(score)
    }

    return groupedScores
  }
}

// application/services/game_detail_service.ts - REFACTORÉ
export class GameDetailService {
  // ✅ APRÈS - Une seule requête
  private async getScoresForGame(gameId: GameId): Promise<Score[]> {
    return await this.scoreQueryRepository.findByGameIdWithRounds(gameId)
  }

  // ✅ Méthode optimisée pour le dashboard
  private async getScoresGroupedByRound(gameId: GameId): Promise<Map<RoundId, Score[]>> {
    return await this.scoreQueryRepository.findScoresByGameIdGroupedByRound(gameId)
  }
}
```

#### **2.2 Cache Applicatif Intelligent (sans Redis)**

```typescript
// infrastructure/cache/memory_cache_service.ts
import { LRUCache } from 'lru-cache'

interface CacheOptions {
  maxSize: number
  ttlMs: number
  staleWhileRevalidate?: number
}

class MemoryCacheService {
  private caches: Map<string, LRUCache<string, any>> = new Map()

  constructor() {
    // Caches spécialisés par domaine
    this.createCache('game_details', { maxSize: 100, ttlMs: 5 * 60 * 1000 }) // 5min
    this.createCache('user_sessions', { maxSize: 50, ttlMs: 30 * 60 * 1000 }) // 30min
    this.createCache('static_data', { maxSize: 20, ttlMs: 60 * 60 * 1000 }) // 1h
  }

  private createCache(name: string, options: CacheOptions): void {
    this.caches.set(
      name,
      new LRUCache({
        max: options.maxSize,
        ttl: options.ttlMs,
        allowStale: true,
        updateAgeOnGet: true,
      })
    )
  }

  async get<T>(cacheName: string, key: string): Promise<T | null> {
    const cache = this.caches.get(cacheName)
    return cache?.get(key) || null
  }

  async set<T>(cacheName: string, key: string, value: T): Promise<void> {
    const cache = this.caches.get(cacheName)
    cache?.set(key, value)
  }

  // Pattern cache-aside avec fallback automatique
  async getOrSet<T>(cacheName: string, key: string, fallbackFn: () => Promise<T>): Promise<T> {
    let cached = await this.get<T>(cacheName, key)

    if (cached !== null) {
      return cached
    }

    const fresh = await fallbackFn()
    await this.set(cacheName, key, fresh)
    return fresh
  }
}

// application/services/cached_game_detail_service.ts
export class CachedGameDetailService extends GameDetailService {
  constructor(
    private cache: MemoryCacheService,
    ...baseParams: ConstructorParameters<typeof GameDetailService>
  ) {
    super(...baseParams)
  }

  async getGameDetail(gameId: GameId, userId: number): Promise<GameDetailSummary | null> {
    const cacheKey = `${gameId.value}:${userId}`

    return await this.cache.getOrSet('game_details', cacheKey, () =>
      super.getGameDetail(gameId, userId)
    )
  }

  // Invalidation intelligente lors des updates
  async invalidateGameCache(gameId: GameId): Promise<void> {
    // Pattern de cache busting par préfixe
    const cache = this.cache.getCacheInstance('game_details')
    const keysToDelete = Array.from(cache.keys()).filter((key) =>
      key.startsWith(`${gameId.value}:`)
    )

    keysToDelete.forEach((key) => cache.delete(key))

    logger.debug(`Cache invalidated for game ${gameId.value}`, {
      keysDeleted: keysToDelete.length,
    })
  }
}
```

#### **2.3 Injection de Dépendances Professionnelle**

```typescript
// providers/repositories_provider.ts
import { ApplicationService } from '@adonisjs/core/types'

export default class RepositoriesProvider {
  constructor(protected app: ApplicationService) {}

  async register() {
    // Repositories singletons
    this.app.container.singleton('GameQueryRepository', () => {
      return new LucidGameQueryRepository()
    })

    this.app.container.singleton('ScoreQueryRepository', () => {
      return new LucidScoreQueryRepository()
    })

    // Services avec dépendances
    this.app.container.singleton('CacheService', () => {
      return new MemoryCacheService()
    })

    this.app.container.singleton('GameDetailService', () => {
      return new CachedGameDetailService(
        this.app.container.use('CacheService'),
        this.app.container.use('GameQueryRepository'),
        this.app.container.use('ScoreQueryRepository')
        // ... autres dépendances
      )
    })
  }
}

// controllers/parties_controller.ts - REFACTORÉ
import { inject } from '@adonisjs/core'
import type { GameDetailService } from '#application/services/game_detail_service'

@inject()
export default class PartiesController {
  constructor(
    private gameDetailService: GameDetailService,
    private gameCreationService: GameCreationService,
    private userSearchService: UserSearchService
  ) {}

  // ✅ Plus d'instanciation manuelle, IoC automatique
  async show({ params, auth, inertia }: HttpContext) {
    // Service déjà injecté et optimisé
    const gameDetail = await this.gameDetailService.getGameDetail(
      new GameId(params.id),
      auth.user!.id
    )

    return inertia.render('parties/show', { game: gameDetail })
  }
}
```

---

## 🎨 Phase 3: Refonte Frontend Optimisée

### **🧩 Décomposition Composants (Délai: 1 semaine)**

#### **3.1 Architecture Composants W40K**

```vue
<!-- components/game/W40KScoreBoard.vue - Composant orchestrateur -->
<template>
  <div class="w40k-scoreboard">
    <W40KGameHeader :game="game" :currentRound="currentRound" @round-change="handleRoundChange" />

    <W40KPlayerGrid
      :players="game.players"
      :scores="currentRoundScores"
      :editable="canEdit"
      @score-update="handleScoreUpdate"
    />

    <W40KSecondaryObjectives
      v-if="showSecondaries"
      :objectives="secondaryObjectives"
      :playerScores="secondaryScores"
      @objective-score="handleSecondaryScore"
    />

    <W40KScoreActions
      :canSave="hasChanges"
      :saving="isSaving"
      @save="saveScores"
      @reset="resetChanges"
    />
  </div>
</template>

<script setup lang="ts">
// Composable pour la logique métier
const {
  game,
  currentRound,
  currentRoundScores,
  secondaryScores,
  hasChanges,
  isSaving,
  canEdit,
  handleRoundChange,
  handleScoreUpdate,
  handleSecondaryScore,
  saveScores,
  resetChanges,
} = useW40KScoring(props.gameId)

// Composable pour les objectifs secondaires
const { secondaryObjectives, showSecondaries } = useW40KSecondaryObjectives(game)
</script>
```

#### **3.2 Composables Optimisés**

```typescript
// composables/useW40KScoring.ts
import { ref, computed, watch } from 'vue'
import { useForm } from '@inertiajs/vue3'

export function useW40KScoring(gameId: string) {
  // État réactif centralisé
  const game = ref<Game | null>(null)
  const currentRound = ref<number>(1)
  const scores = ref<Map<string, ScoreValue>>(new Map())
  const isSaving = ref(false)
  const hasChanges = ref(false)

  // Cache des calculs coûteux
  const currentRoundScores = computed(() => {
    if (!game.value) return []

    return game.value.rounds.find((r) => r.roundNumber === currentRound.value)?.scores || []
  })

  const totalScores = computed(() => {
    // Memoization des calculs de totaux
    const totals = new Map<string, number>()

    game.value?.players.forEach((player) => {
      const total = game.value!.rounds.reduce((sum, round) => {
        const playerScores = round.scores.filter((s) => s.playerId === player.id)
        return sum + playerScores.reduce((roundSum, score) => roundSum + score.value, 0)
      }, 0)

      totals.set(player.id, total)
    })

    return totals
  })

  // Actions optimisées
  const handleScoreUpdate = (playerId: string, scoreType: string, value: number) => {
    const key = `${playerId}-${scoreType}-${currentRound.value}`
    scores.value.set(key, { playerId, scoreType, value, roundNumber: currentRound.value })
    hasChanges.value = true
  }

  const saveScores = async () => {
    if (!hasChanges.value) return

    isSaving.value = true
    try {
      // Optimisation: batch update des scores
      const scoresToSave = Array.from(scores.value.values())

      await router.post(
        `/games/${gameId}/scores/batch`,
        {
          scores: scoresToSave,
          roundNumber: currentRound.value,
        },
        {
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            hasChanges.value = false
            scores.value.clear()
          },
        }
      )
    } finally {
      isSaving.value = false
    }
  }

  // Auto-save intelligent
  const debouncedSave = debounce(saveScores, 2000)
  watch(hasChanges, (newVal) => {
    if (newVal) {
      debouncedSave()
    }
  })

  return {
    game: readonly(game),
    currentRound: readonly(currentRound),
    currentRoundScores,
    totalScores,
    hasChanges: readonly(hasChanges),
    isSaving: readonly(isSaving),
    canEdit: computed(() => game.value?.canEdit ?? false),
    handleRoundChange: (round: number) => {
      currentRound.value = round
    },
    handleScoreUpdate,
    saveScores,
    resetChanges: () => {
      scores.value.clear()
      hasChanges.value = false
    },
  }
}
```

#### **3.3 Optimisation CSS Bundle**

```typescript
// tailwind.config.js - Configuration optimisée
import type { Config } from 'tailwindcss'

export default {
  content: [
    './inertia/**/*.vue',
    './inertia/**/*.ts',
    './resources/views/**/*.edge'
  ],

  theme: {
    extend: {
      colors: {
        // Thème W40K optimisé - Design tokens
        w40k: {
          red: {
            50: '#fef2f2',
            500: '#dc2626',
            900: '#7f1d1d',
          },
          gold: {
            50: '#fefce8',
            500: '#eab308',
            900: '#713f12',
          },
          dark: {
            50: '#f8fafc',
            900: '#0f172a',
          }
        }
      },

      fontFamily: {
        'w40k': ['Cinzel', 'serif'], // Police thématique
      },

      animation: {
        'score-update': 'pulse 0.5s ease-in-out',
        'dice-roll': 'spin 0.3s ease-in-out',
      }
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],

  // Optimisations production
  experimental: {
    optimizeUniversalDefaults: true,
  },

  // JIT activé par défaut dans v3+
  jit: true,

} satisfies Config

// inertia/css/app.css - Simplifié drastiquement
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Import Google Fonts avec display=swap pour performance */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

/* Composants W40K réutilisables uniquement */
@layer components {
  .btn-w40k-primary {
    @apply bg-w40k-red-500 hover:bg-w40k-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200;
  }

  .score-cell {
    @apply border border-gray-300 p-2 text-center font-mono text-sm focus:ring-2 focus:ring-w40k-gold-500 focus:border-transparent;
  }

  .w40k-card {
    @apply bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700;
  }
}

/* Variables CSS custom pour les thèmes dynamiques */
:root {
  --w40k-primary: theme('colors.w40k.red.500');
  --w40k-secondary: theme('colors.w40k.gold.500');
  --w40k-accent: theme('colors.w40k.dark.900');
}

/* Suppression de toutes les classes utilitaires manuelles */
/* Tailwind JIT les génère automatiquement */
```

---

## 📊 Phase 4: Monitoring & Observabilité

### **📈 Structured Logging (Délai: 2-3 jours)**

```typescript
// config/logger.ts - Configuration production-ready
import pino from 'pino'

const loggerConfig = pino({
  level: env.get('LOG_LEVEL', 'info'),

  // Format JSON structuré pour analyse
  formatters: {
    level(label: string) {
      return { level: label }
    },
    log(object: any) {
      return {
        ...object,
        hostname: os.hostname(),
        pid: process.pid,
        environment: env.get('NODE_ENV'),
      }
    },
  },

  // Timestamp ISO pour parsing facile
  timestamp: pino.stdTimeFunctions.isoTime,

  // Transport pour développement (pretty print)
  transport:
    env.get('NODE_ENV') === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        }
      : undefined,

  // Redaction des données sensibles
  redact: {
    paths: ['password', 'token', 'authorization', 'cookie'],
    censor: '[REDACTED]',
  },
})

// Middleware de logging des requêtes
export class RequestLoggingMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const startTime = process.hrtime.bigint()
    const requestId = randomUUID()

    // Contexte de requête
    const requestContext = {
      requestId,
      method: request.method(),
      url: request.url(),
      userAgent: request.header('user-agent'),
      ip: request.ip(),
      referer: request.header('referer'),
    }

    logger.info('Request started', requestContext)

    try {
      await next()

      const endTime = process.hrtime.bigint()
      const duration = Number(endTime - startTime) / 1000000 // ms

      logger.info('Request completed', {
        ...requestContext,
        statusCode: response.getStatus(),
        responseTime: duration,
        success: true,
      })
    } catch (error) {
      logger.error('Request failed', {
        ...requestContext,
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
        },
      })
      throw error
    }
  }
}
```

### **🔍 Performance Monitoring Intégré**

```typescript
// monitoring/performance_monitor.ts
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  // Mesure automatique des requêtes DB
  async measureDatabaseQuery<T>(operation: string, queryFn: () => Promise<T>): Promise<T> {
    const start = performance.now()

    try {
      const result = await queryFn()
      const duration = performance.now() - start

      this.recordMetric(`db.${operation}`, duration)

      // Alert si requête lente
      if (duration > 1000) {
        logger.warn(`Slow database query detected`, {
          operation,
          duration: `${duration.toFixed(2)}ms`,
          threshold: '1000ms',
        })
      }

      return result
    } catch (error) {
      logger.error(`Database query failed`, {
        operation,
        error: error.message,
      })
      throw error
    }
  }

  // Métriques de cache
  recordCacheHit(cacheName: string): void {
    this.recordMetric(`cache.${cacheName}.hits`, 1)
  }

  recordCacheMiss(cacheName: string): void {
    this.recordMetric(`cache.${cacheName}.misses`, 1)
  }

  // Export des métriques (endpoint /metrics pour monitoring externe)
  getMetrics(): Record<string, any> {
    const summary: Record<string, any> = {}

    this.metrics.forEach((values, key) => {
      summary[key] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      }
    })

    return summary
  }

  private recordMetric(key: string, value: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }

    const values = this.metrics.get(key)!
    values.push(value)

    // Garder seulement les 1000 dernières valeurs
    if (values.length > 1000) {
      values.shift()
    }
  }
}

// Intégration dans les repositories
export class MonitoredLucidScoreQueryRepository extends LucidScoreQueryRepository {
  constructor(private monitor: PerformanceMonitor) {
    super()
  }

  async findByGameIdWithRounds(gameId: GameId): Promise<Score[]> {
    return await this.monitor.measureDatabaseQuery('scores.findByGameIdWithRounds', () =>
      super.findByGameIdWithRounds(gameId)
    )
  }
}
```

---

## 🎖️ Phase 5: Excellence Technique Avancée

### **⚡ Optimisations Base de Données**

```sql
-- migrations/add_strategic_indices.sql
-- Indices pour les requêtes critiques identifiées

-- Index composé pour les games par utilisateur et statut
CREATE INDEX IF NOT EXISTS idx_games_user_status_created
ON games (user_id, status, created_at DESC);

-- Index pour les scores par game (via rounds)
CREATE INDEX IF NOT EXISTS idx_scores_game_round
ON scores (round_id)
INCLUDE (score_type, score_value, player_id);

-- Index pour les rounds par game
CREATE INDEX IF NOT EXISTS idx_rounds_game_number
ON rounds (game_id, round_number);

-- Index pour les players par game
CREATE INDEX IF NOT EXISTS idx_players_game_user
ON players (game_id, user_id)
WHERE user_id IS NOT NULL;

-- Statistiques automatiques pour l'optimiseur
ANALYZE games;
ANALYZE rounds;
ANALYZE scores;
ANALYZE players;
```

### **🧪 Testing Strategy Avancée**

```typescript
// tests/performance/benchmark.spec.ts
import { test } from '@japa/runner'
import { performance } from 'perf_hooks'

test.group('Performance Benchmarks', () => {
  test('Game detail loading should be under 100ms', async ({ assert }) => {
    const gameId = new GameId('test-game-id')
    const userId = 1

    const iterations = 10
    const durations: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()

      await gameDetailService.getGameDetail(gameId, userId)

      const end = performance.now()
      durations.push(end - start)
    }

    const avgDuration = durations.reduce((a, b) => a + b) / durations.length
    const maxDuration = Math.max(...durations)

    console.log(`Average: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`)

    // Assertions de performance
    assert.isBelow(
      avgDuration,
      100,
      `Average response time ${avgDuration.toFixed(2)}ms exceeds 100ms`
    )
    assert.isBelow(maxDuration, 200, `Max response time ${maxDuration.toFixed(2)}ms exceeds 200ms`)
  })

  test('Cache should improve performance by 80%+', async ({ assert }) => {
    const gameId = new GameId('cache-test-game')

    // Premier appel (sans cache)
    const start1 = performance.now()
    await gameDetailService.getGameDetail(gameId, 1)
    const uncachedDuration = performance.now() - start1

    // Deuxième appel (avec cache)
    const start2 = performance.now()
    await gameDetailService.getGameDetail(gameId, 1)
    const cachedDuration = performance.now() - start2

    const improvement = ((uncachedDuration - cachedDuration) / uncachedDuration) * 100

    console.log(`Cache improvement: ${improvement.toFixed(1)}%`)
    assert.isAbove(improvement, 80, `Cache improvement ${improvement.toFixed(1)}% is below 80%`)
  })
})
```

---

## 📅 Roadmap d'Implémentation Détaillée

### **Sprint 1: Sécurité Critique (3-5 jours)**

```
Jour 1-2: 🚨 Corrections sécuritaires
├── Élimination logs sensibles
├── Configuration CORS restrictive
├── Activation CSP complète
└── Tests sécuritaires

Jour 3-4: 🛡️ Rate limiting étendu
├── Middleware rate limiting avancé
├── Configuration par endpoint
├── Logging des tentatives
└── Tests de charge

Jour 5: ✅ Validation sécuritaire
├── Audit sécuritaire complet
├── Tests d'intrusion basiques
└── Documentation sécuritaire
```

### **Sprint 2: Performance Critique (5-7 jours)**

```
Jour 1-2: 🚀 Résolution N+1
├── Nouvelles méthodes repository
├── Requêtes optimisées avec JOIN
├── Tests de performance
└── Benchmarks avant/après

Jour 3-4: 🏗️ Injection dépendances
├── Provider IoC
├── Refactoring contrôleurs
├── Services singletons
└── Tests d'intégration

Jour 5-7: 💾 Cache applicatif
├── MemoryCacheService
├── Intégration services
├── Invalidation intelligente
└── Métriques cache
```

### **Sprint 3: Frontend Optimisé (5-7 jours)**

```
Jour 1-3: 🧩 Décomposition composants
├── Refactoring W40KScoreBoard
├── Composables métier
├── États réactifs optimisés
└── Tests composants

Jour 4-5: 🎨 Optimisation CSS
├── Configuration Tailwind JIT
├── Suppression utilities manuelles
├── Design tokens W40K
└── Bundle size analysis

Jour 6-7: ⚡ Performance frontend
├── Lazy loading composants
├── Virtual scrolling si nécessaire
├── Optimisation images
└── Tests Lighthouse
```

### **Sprint 4: Monitoring & Finitions (3-5 jours)**

```
Jour 1-2: 📊 Structured logging
├── Configuration Pino
├── Middleware logging
├── Contextes de requête
└── Redaction données sensibles

Jour 3-4: 🔍 Performance monitoring
├── Métriques automatiques
├── Monitoring DB queries
├── Cache hit/miss tracking
└── Endpoint /metrics

Jour 5: 🎖️ Excellence technique
├── Indices base de données
├── Tests performance
├── Documentation complète
└── Déploiement final
```

---

## 🎯 Résultats Attendus

### **Métriques de Performance**

- ⚡ **Temps de réponse**: <100ms (vs 500ms+ actuellement)
- 🎯 **Requêtes DB**: -85% (1 requête au lieu de 6+)
- 💾 **Cache hit ratio**: >90% pour données fréquentes
- 📦 **Bundle JS**: -40% après optimisation CSS
- 🚀 **Lighthouse Score**: >95 (Performance, Accessibility, Best Practices)

### **Métriques de Sécurité**

- 🛡️ **Vulnérabilités**: 0 critique, 0 haute priorité
- 🔒 **Headers sécuritaires**: 100% compliance
- 🚨 **Rate limiting**: Protection complète endpoints
- 📝 **Audit logs**: Traçabilité complète actions sensibles

### **Métriques de Qualité**

- 📊 **Test coverage**: >90% domaine, >80% application
- 🏗️ **Architecture compliance**: 100% respect principes DDD/Hexagonal
- 🧹 **Technical debt**: -70% après refactoring
- 📚 **Documentation**: Spécifications techniques complètes

---

## 💡 Recommandations Bonus

### **Évolutions Futures (6+ mois)**

1. **API GraphQL** pour frontend avancé
2. **WebSockets** pour scores temps réel
3. **PWA** pour usage mobile/offline
4. **Microservices** si croissance importante
5. **IA/ML** pour analyse statistiques W40K

### **Stack Technique Recommandée à Long Terme**

```
Production Stack:
├── Backend: AdonisJS 6 + PostgreSQL + Redis (si budget)
├── Frontend: Vue 3 + Inertia.js + Tailwind v4
├── Monitoring: Pino + Grafana/Prometheus (si budget)
├── Deployment: Docker + Traefik/Caddy
└── CI/CD: GitHub Actions + Automated testing
```

Ce plan vous donnera une application W40K scoring de **qualité industrielle** avec d'excellentes performances, une sécurité robuste, et une architecture évolutive. L'approche progressive permet d'implémenter par priorité tout en maintenant la qualité.

Êtes-vous prêt à commencer par la Phase 1 (Sécurité Critique) ?
