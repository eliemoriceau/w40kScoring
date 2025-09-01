import type { ApplicationService } from '@adonisjs/core/types'

/**
 * Repositories Provider - IoC Dependency Injection
 *
 * 🚀 OPTIMISATION MAJEURE - Injection de dépendances automatisée
 *
 * AVANT : Création manuelle des repositories dans chaque contrôleur
 * APRÈS : Injection automatique via conteneur IoC
 *
 * Avantages :
 * - Découplage total entre contrôleurs et implémentations
 * - Facilite les tests unitaires avec mocks
 * - Configuration centralisée des dépendances
 * - Possibilité de switcher entre implémentations (optimisées/standard)
 * - Respect des principes SOLID (Inversion de dépendance)
 */

export default class RepositoriesProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Enregistre les bindings IoC pour tous les repositories
   */
  register() {
    // Game Repositories - avec fallback vers implémentations standards
    this.app.container.bind('GameCommandRepository', async () => {
      const { LucidGameCommandRepository } = await import(
        '#infrastructure/repositories/lucid_game_command_repository'
      )
      return new LucidGameCommandRepository()
    })

    this.app.container.bind('GameQueryRepository', async () => {
      const { LucidGameQueryRepository } = await import(
        '#infrastructure/repositories/lucid_game_query_repository'
      )
      return new LucidGameQueryRepository()
    })

    // Player Repositories
    this.app.container.bind('PlayerCommandRepository', async () => {
      const { LucidPlayerCommandRepository } = await import(
        '#infrastructure/repositories/lucid_player_command_repository'
      )
      return new LucidPlayerCommandRepository()
    })

    this.app.container.bind('PlayerQueryRepository', async () => {
      const { LucidPlayerQueryRepository } = await import(
        '#infrastructure/repositories/lucid_player_query_repository'
      )
      return new LucidPlayerQueryRepository()
    })

    // Round Repositories
    this.app.container.bind('RoundCommandRepository', async () => {
      const { LucidRoundCommandRepository } = await import(
        '#infrastructure/repositories/lucid_round_command_repository'
      )
      return new LucidRoundCommandRepository()
    })

    this.app.container.bind('RoundQueryRepository', async () => {
      const { LucidRoundQueryRepository } = await import(
        '#infrastructure/repositories/lucid_round_query_repository'
      )
      return new LucidRoundQueryRepository()
    })

    // Score Repositories - avec version optimisée prioritaire
    this.app.container.bind('ScoreCommandRepository', async () => {
      const { LucidScoreCommandRepository } = await import(
        '#infrastructure/repositories/lucid_score_command_repository'
      )
      return new LucidScoreCommandRepository()
    })

    this.app.container.bind('ScoreQueryRepository', async () => {
      // 🚀 OPTIMISATION - Utilise la version enhanced par défaut
      try {
        const { EnhancedScoreQueryRepository } = await import(
          '#infrastructure/repositories/enhanced_score_query_repository'
        )
        return new EnhancedScoreQueryRepository()
      } catch (error) {
        // Fallback vers l'implémentation standard si enhanced non disponible
        const { LucidScoreQueryRepository } = await import(
          '#infrastructure/repositories/lucid_score_query_repository'
        )
        return new LucidScoreQueryRepository()
      }
    })

    // Services - avec versions cachées optimisées
    this.app.container.bind('GameDetailService', async () => {
      const { CachedGameDetailService } = await import(
        '#application/services/cached_game_detail_service'
      )
      const { MemoryCacheService } = await import('#infrastructure/cache/memory_cache_service')

      // Récupération des repositories via le container
      const gameQueryRepo = await this.app.container.use('GameQueryRepository')
      const playerQueryRepo = await this.app.container.use('PlayerQueryRepository')
      const roundQueryRepo = await this.app.container.use('RoundQueryRepository')
      const scoreQueryRepo = await this.app.container.use('ScoreQueryRepository')

      const cacheService = new MemoryCacheService()

      return new CachedGameDetailService(
        cacheService,
        gameQueryRepo,
        playerQueryRepo,
        roundQueryRepo,
        scoreQueryRepo
      )
    })

    // Cache Service - Singleton pattern
    this.app.container.singleton('MemoryCacheService', async () => {
      const { MemoryCacheService } = await import('#infrastructure/cache/memory_cache_service')
      return new MemoryCacheService()
    })
  }

  /**
   * Méthode appelée après l'enregistrement de tous les providers
   */
  async boot() {
    // Configuration post-registration si nécessaire
  }

  /**
   * Méthode appelée lors de l'arrêt de l'application
   */
  async shutdown() {
    // Cleanup des ressources si nécessaire (fermeture cache, etc.)
    try {
      const cacheService = this.app.container.use('MemoryCacheService')
      // Le cache se nettoie automatiquement, rien à faire ici
    } catch (error) {
      // Ignore si le service n'est pas initialisé
    }
  }
}
