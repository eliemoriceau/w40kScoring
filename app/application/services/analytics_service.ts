/**
 * Service principal pour les analytics de l'application W40K Scoring
 * Fournit des métriques de base pour les performances joueurs, insights jeu et métriques plateforme
 */

import Game from '#models/game'
import User from '#models/user'
import Round from '#models/round'
import { DateTime } from 'luxon'

export interface PlayerStats {
  totalGames: number
  winRate: number
  averagePlayerScore: number
  averageOpponentScore: number
  favoriteGameType: string
  mostActiveHour: string
  winLossStreak: number
  improvementTrend: 'up' | 'down' | 'stable'
}

export interface GameInsights {
  totalGames: number
  averageGameDuration: string
  gamesByType: Record<string, number>
  gamesByStatus: Record<string, number>
  averageScorePerRound: number
  mostCompetitiveMatches: Array<{
    id: number
    scoreDifference: number
    players: string
    date: string
  }>
}

export interface PlatformMetrics {
  activeUsers24h: number
  activeUsersThisWeek: number
  totalRegisteredUsers: number
  gamesCreatedToday: number
  gamesCompletedToday: number
  averageSessionDuration: string
  peakHours: Array<{ hour: number; count: number }>
  growthRate: number
}

export interface PeriodComparison {
  current: {
    totalGames: number
    activeUsers: number
    averageScore: number
  }
  previous: {
    totalGames: number
    activeUsers: number
    averageScore: number
  }
  changes: {
    gamesChange: number
    usersChange: number
    scoreChange: number
  }
}

export default class AnalyticsService {
  /**
   * Obtient les statistiques détaillées d'un joueur
   */
  async getPlayerStats(userId: number, period: 'week' | 'month' | 'all' = 'all'): Promise<PlayerStats> {
    const startDate = this.getStartDate(period)
    
    const playerGames = await Game.query()
      .where('user_id', userId)
      .if(startDate, (query) => query.where('created_at', '>=', startDate))
      .preload('opponent')
    
    const completedGames = playerGames.filter(game => game.status === 'COMPLETED')
    const totalGames = completedGames.length
    
    if (totalGames === 0) {
      return {
        totalGames: 0,
        winRate: 0,
        averagePlayerScore: 0,
        averageOpponentScore: 0,
        favoriteGameType: 'MATCHED_PLAY',
        mostActiveHour: '20',
        winLossStreak: 0,
        improvementTrend: 'stable'
      }
    }

    // Calcul du taux de victoire
    const wins = completedGames.filter(game => 
      (game.playerScore || 0) > (game.opponentScore || 0)
    ).length
    const winRate = Math.round((wins / totalGames) * 100)

    // Scores moyens
    const averagePlayerScore = Math.round(
      completedGames.reduce((sum, game) => sum + (game.playerScore || 0), 0) / totalGames
    )
    const averageOpponentScore = Math.round(
      completedGames.reduce((sum, game) => sum + (game.opponentScore || 0), 0) / totalGames
    )

    // Type de jeu favori
    const gameTypeCounts = completedGames.reduce((counts, game) => {
      counts[game.gameType] = (counts[game.gameType] || 0) + 1
      return counts
    }, {} as Record<string, number>)
    const favoriteGameType = Object.entries(gameTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'MATCHED_PLAY'

    // Heure la plus active
    const hourCounts = completedGames.reduce((counts, game) => {
      const hour = DateTime.fromISO(game.createdAt.toString()).hour
      counts[hour] = (counts[hour] || 0) + 1
      return counts
    }, {} as Record<number, number>)
    const mostActiveHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '20'

    // Série actuelle (approximation simple)
    const recentGames = completedGames.slice(-10)
    let streak = 0
    for (let i = recentGames.length - 1; i >= 0; i--) {
      const game = recentGames[i]
      const isWin = (game.playerScore || 0) > (game.opponentScore || 0)
      if ((streak >= 0 && isWin) || (streak < 0 && !isWin)) {
        streak += isWin ? 1 : -1
      } else {
        break
      }
    }

    // Tendance d'amélioration (sur les 20 derniers jeux)
    const improvementTrend = this.calculateImprovementTrend(completedGames)

    return {
      totalGames,
      winRate,
      averagePlayerScore,
      averageOpponentScore,
      favoriteGameType,
      mostActiveHour,
      winLossStreak: streak,
      improvementTrend
    }
  }

  /**
   * Obtient les insights généraux sur les jeux
   */
  async getGameInsights(): Promise<GameInsights> {
    const allGames = await Game.query()
      .preload('user')
      .preload('opponent')
      .orderBy('created_at', 'desc')

    const completedGames = allGames.filter(game => game.status === 'COMPLETED')
    const totalGames = allGames.length

    // Durée moyenne des jeux (estimation basée sur les timestamps)
    const avgDuration = this.calculateAverageGameDuration(completedGames)

    // Répartition par type de jeu
    const gamesByType = allGames.reduce((counts, game) => {
      counts[game.gameType] = (counts[game.gameType] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    // Répartition par statut
    const gamesByStatus = allGames.reduce((counts, game) => {
      counts[game.status] = (counts[game.status] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    // Score moyen par round (estimation)
    const averageScorePerRound = completedGames.length > 0 ? 
      Math.round(
        completedGames.reduce((sum, game) => 
          sum + ((game.playerScore || 0) + (game.opponentScore || 0)), 0
        ) / (completedGames.length * 5) // 5 rounds par jeu
      ) : 0

    // Matchs les plus compétitifs
    const mostCompetitiveMatches = completedGames
      .map(game => ({
        id: game.id,
        scoreDifference: Math.abs((game.playerScore || 0) - (game.opponentScore || 0)),
        players: `${game.user.username} vs ${game.opponent?.username || 'IA/Bot'}`,
        date: DateTime.fromISO(game.createdAt.toString()).toFormat('dd/MM/yyyy')
      }))
      .sort((a, b) => a.scoreDifference - b.scoreDifference)
      .slice(0, 5)

    return {
      totalGames,
      averageGameDuration: avgDuration,
      gamesByType,
      gamesByStatus,
      averageScorePerRound,
      mostCompetitiveMatches
    }
  }

  /**
   * Obtient les métriques générales de la plateforme
   */
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    const now = DateTime.now()
    const yesterday = now.minus({ days: 1 })
    const weekAgo = now.minus({ weeks: 1 })

    // Utilisateurs actifs (basé sur les jeux créés récemment)
    const activeUsers24h = await User.query()
      .whereHas('games', (query) => {
        query.where('created_at', '>=', yesterday.toSQL())
      })
      .count('* as total')
    
    const activeUsersThisWeek = await User.query()
      .whereHas('games', (query) => {
        query.where('created_at', '>=', weekAgo.toSQL())
      })
      .count('* as total')

    const totalRegisteredUsers = await User.query().count('* as total')

    // Jeux créés aujourd'hui
    const gamesCreatedToday = await Game.query()
      .where('created_at', '>=', now.startOf('day').toSQL())
      .count('* as total')

    const gamesCompletedToday = await Game.query()
      .where('status', 'COMPLETED')
      .where('completed_at', '>=', now.startOf('day').toSQL())
      .count('* as total')

    // Heures de pic (approximation)
    const peakHours = await this.calculatePeakHours()

    // Taux de croissance (utilisateurs du mois dernier vs ce mois)
    const growthRate = await this.calculateGrowthRate()

    return {
      activeUsers24h: Number(activeUsers24h[0]?.total || 0),
      activeUsersThisWeek: Number(activeUsersThisWeek[0]?.total || 0),
      totalRegisteredUsers: Number(totalRegisteredUsers[0]?.total || 0),
      gamesCreatedToday: Number(gamesCreatedToday[0]?.total || 0),
      gamesCompletedToday: Number(gamesCompletedToday[0]?.total || 0),
      averageSessionDuration: '45 min', // Valeur fixe pour l'instant
      peakHours,
      growthRate
    }
  }

  /**
   * Compare les métriques entre deux périodes
   */
  async getPeriodComparison(): Promise<PeriodComparison> {
    const now = DateTime.now()
    const weekAgo = now.minus({ weeks: 1 })
    const twoWeeksAgo = now.minus({ weeks: 2 })

    // Période actuelle (dernière semaine)
    const currentGames = await Game.query()
      .where('created_at', '>=', weekAgo.toSQL())
      .preload('user')

    const currentUsers = new Set(currentGames.map(game => game.userId)).size
    const currentCompleted = currentGames.filter(game => game.status === 'COMPLETED')
    const currentAvgScore = currentCompleted.length > 0 ?
      Math.round(
        currentCompleted.reduce((sum, game) => 
          sum + ((game.playerScore || 0) + (game.opponentScore || 0)), 0
        ) / (currentCompleted.length * 2)
      ) : 0

    // Période précédente (semaine d'avant)
    const previousGames = await Game.query()
      .where('created_at', '>=', twoWeeksAgo.toSQL())
      .where('created_at', '<', weekAgo.toSQL())
      .preload('user')

    const previousUsers = new Set(previousGames.map(game => game.userId)).size
    const previousCompleted = previousGames.filter(game => game.status === 'COMPLETED')
    const previousAvgScore = previousCompleted.length > 0 ?
      Math.round(
        previousCompleted.reduce((sum, game) => 
          sum + ((game.playerScore || 0) + (game.opponentScore || 0)), 0
        ) / (previousCompleted.length * 2)
      ) : 0

    return {
      current: {
        totalGames: currentGames.length,
        activeUsers: currentUsers,
        averageScore: currentAvgScore
      },
      previous: {
        totalGames: previousGames.length,
        activeUsers: previousUsers,
        averageScore: previousAvgScore
      },
      changes: {
        gamesChange: this.calculatePercentageChange(previousGames.length, currentGames.length),
        usersChange: this.calculatePercentageChange(previousUsers, currentUsers),
        scoreChange: this.calculatePercentageChange(previousAvgScore, currentAvgScore)
      }
    }
  }

  private getStartDate(period: 'week' | 'month' | 'all'): string | null {
    const now = DateTime.now()
    switch (period) {
      case 'week':
        return now.minus({ weeks: 1 }).toSQL()
      case 'month':
        return now.minus({ months: 1 }).toSQL()
      default:
        return null
    }
  }

  private calculateImprovementTrend(games: any[]): 'up' | 'down' | 'stable' {
    if (games.length < 10) return 'stable'
    
    const recent = games.slice(-10)
    const older = games.slice(-20, -10)
    
    const recentAvg = recent.reduce((sum, game) => sum + (game.playerScore || 0), 0) / recent.length
    const olderAvg = older.length > 0 ? older.reduce((sum, game) => sum + (game.playerScore || 0), 0) / older.length : recentAvg
    
    const difference = recentAvg - olderAvg
    if (difference > 2) return 'up'
    if (difference < -2) return 'down'
    return 'stable'
  }

  private calculateAverageGameDuration(games: any[]): string {
    const durations = games
      .filter(game => game.completedAt && game.startedAt)
      .map(game => {
        const start = DateTime.fromISO(game.startedAt.toString())
        const end = DateTime.fromISO(game.completedAt.toString())
        return end.diff(start, 'minutes').minutes
      })
    
    if (durations.length === 0) return '60 min'
    
    const avgMinutes = Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
    return `${avgMinutes} min`
  }

  private async calculatePeakHours(): Promise<Array<{ hour: number; count: number }>> {
    const games = await Game.query().select('created_at')
    
    const hourCounts = games.reduce((counts, game) => {
      const hour = DateTime.fromISO(game.createdAt.toString()).hour
      counts[hour] = (counts[hour] || 0) + 1
      return counts
    }, {} as Record<number, number>)

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private async calculateGrowthRate(): Promise<number> {
    const now = DateTime.now()
    const thisMonth = await User.query()
      .where('created_at', '>=', now.startOf('month').toSQL())
      .count('* as total')
    
    const lastMonth = await User.query()
      .where('created_at', '>=', now.minus({ months: 1 }).startOf('month').toSQL())
      .where('created_at', '<', now.startOf('month').toSQL())
      .count('* as total')

    const thisMonthCount = Number(thisMonth[0]?.total || 0)
    const lastMonthCount = Number(lastMonth[0]?.total || 0)
    
    return this.calculatePercentageChange(lastMonthCount, thisMonthCount)
  }

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0
    return Math.round(((newValue - oldValue) / oldValue) * 100)
  }
}