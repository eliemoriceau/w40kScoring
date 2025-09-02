import Game from '#models/game'
import User from '#models/user'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

/**
 * Service pour collecter les métriques business W40K Scoring
 */
export default class BusinessMetricsService {
  /**
   * Collecte toutes les métriques business pour Prometheus
   */
  static async collectBusinessMetrics() {
    try {
      const [
        totalGames,
        activeUsers24h,
        averageScore,
        completionRate,
        gamesByType,
        gamesByStatus,
        weeklyGrowth,
      ] = await Promise.all([
        this.getTotalGames(),
        this.getActiveUsers24h(),
        this.getAverageScore(),
        this.getCompletionRate(),
        this.getGamesByType(),
        this.getGamesByStatus(),
        this.getWeeklyGrowth(),
      ])

      return {
        totalGames,
        activeUsers24h,
        averageScore,
        completionRate,
        gamesByType,
        gamesByStatus,
        weeklyGrowth,
      }
    } catch (error) {
      console.error('Error collecting business metrics:', error)
      // Return default values on error
      return {
        totalGames: 0,
        activeUsers24h: 0,
        averageScore: 0,
        completionRate: 0,
        gamesByType: {},
        gamesByStatus: {},
        weeklyGrowth: { current: 0, previous: 0, growth: 0 },
      }
    }
  }

  /**
   * Nombre total de parties créées
   */
  static async getTotalGames(): Promise<number> {
    const count = await Game.query().count('* as total')
    return Number.parseInt(count[0].$extras.total || '0')
  }

  /**
   * Utilisateurs actifs sur les dernières 24h
   */
  static async getActiveUsers24h(): Promise<number> {
    const yesterday = DateTime.now().minus({ hours: 24 })

    const count = await Game.query()
      .where('created_at', '>=', yesterday.toSQL())
      .distinct('user_id')
      .count('user_id as total')

    return Number.parseInt(count[0].$extras.total || '0')
  }

  /**
   * Score moyen des parties terminées
   */
  static async getAverageScore(): Promise<number> {
    const result = await db
      .from('games')
      .whereNotNull('player_score')
      .whereNotNull('opponent_score')
      .avg('player_score as avg_player')
      .avg('opponent_score as avg_opponent')
      .first()

    if (result && result.avg_player && result.avg_opponent) {
      return (Number.parseFloat(result.avg_player) + Number.parseFloat(result.avg_opponent)) / 2
    }
    return 0
  }

  /**
   * Taux de completion des parties (% de parties terminées)
   */
  static async getCompletionRate(): Promise<number> {
    const [total, completed] = await Promise.all([
      Game.query().count('* as total'),
      Game.query().where('status', 'COMPLETED').count('* as completed'),
    ])

    const totalCount = Number.parseInt(total[0].$extras.total || '0')
    const completedCount = Number.parseInt(completed[0].$extras.completed || '0')

    return totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  }

  /**
   * Répartition des parties par type
   */
  static async getGamesByType(): Promise<Record<string, number>> {
    const results = await Game.query().select('game_type').count('* as total').groupBy('game_type')

    const distribution: Record<string, number> = {}
    results.forEach((row) => {
      distribution[row.gameType] = Number.parseInt(row.$extras.total || '0')
    })

    return distribution
  }

  /**
   * Répartition des parties par statut
   */
  static async getGamesByStatus(): Promise<Record<string, number>> {
    const results = await Game.query().select('status').count('* as total').groupBy('status')

    const distribution: Record<string, number> = {}
    results.forEach((row) => {
      distribution[row.status] = Number.parseInt(row.$extras.total || '0')
    })

    return distribution
  }

  /**
   * Croissance hebdomadaire (parties créées cette semaine vs semaine précédente)
   */
  static async getWeeklyGrowth(): Promise<{ current: number; previous: number; growth: number }> {
    const now = DateTime.now()
    const weekStart = now.startOf('week')
    const previousWeekStart = weekStart.minus({ weeks: 1 })

    const [currentWeek, previousWeek] = await Promise.all([
      Game.query().where('created_at', '>=', weekStart.toSQL()).count('* as total'),
      Game.query()
        .where('created_at', '>=', previousWeekStart.toSQL())
        .where('created_at', '<', weekStart.toSQL())
        .count('* as total'),
    ])

    const current = Number.parseInt(currentWeek[0].$extras.total || '0')
    const previous = Number.parseInt(previousWeek[0].$extras.total || '0')
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0

    return { current, previous, growth }
  }

  /**
   * Métriques de performance utilisateur
   */
  static async getUserEngagementMetrics(): Promise<{
    totalUsers: number
    activeUsers7d: number
    avgGamesPerUser: number
    retentionRate: number
  }> {
    try {
      const weekAgo = DateTime.now().minus({ days: 7 })
      const monthAgo = DateTime.now().minus({ days: 30 })

      const [totalUsers, activeUsers7d, avgGames, retention] = await Promise.all([
        User.query().count('* as total'),
        Game.query()
          .where('created_at', '>=', weekAgo.toSQL())
          .distinct('user_id')
          .count('user_id as active'),
        // Simplified avg games calculation using direct query
        db.from('games').count('* as total_games'),
        // Simplified retention - users active in last 7 days
        Game.query()
          .where('created_at', '>=', weekAgo.toSQL())
          .distinct('user_id')
          .count('user_id as retained'),
      ])

      const totalUsersCount = Number.parseInt(totalUsers[0].$extras.total || '0')
      const totalGamesCount = Number.parseInt(
        avgGames[0]?.total_games || avgGames[0]?.$extras?.total_games || '0'
      )
      const avgGamesPerUser = totalUsersCount > 0 ? totalGamesCount / totalUsersCount : 0

      return {
        totalUsers: totalUsersCount,
        activeUsers7d: Number.parseInt(activeUsers7d[0].$extras.active || '0'),
        avgGamesPerUser: avgGamesPerUser,
        retentionRate: Number.parseFloat(retention[0].$extras.retained || '0'),
      }
    } catch (error) {
      console.error('Error collecting engagement metrics:', error)
      return {
        totalUsers: 0,
        activeUsers7d: 0,
        avgGamesPerUser: 0,
        retentionRate: 0,
      }
    }
  }
}
