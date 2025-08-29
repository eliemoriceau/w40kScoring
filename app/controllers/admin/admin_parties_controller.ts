import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import User from '#models/user'
import Round from '#models/round'
import { DateTime } from 'luxon'

/**
 * Contrôleur pour la gestion des parties en administration
 * Phase 3 - Gestion des parties (admin)
 */
export default class AdminPartiesController {
  /**
   * Affiche la liste des parties avec pagination et filtres
   */
  async index({ inertia, request }: HttpContext) {
    const page = request.input('page', 1)
    const status = request.input('status', '')
    const gameType = request.input('gameType', '')
    const search = request.input('search', '')

    let query = Game.query()
      .preload('user', (userQuery) => {
        userQuery.select(['id', 'username', 'fullName'])
      })
      .preload('opponent', (opponentQuery) => {
        opponentQuery.select(['id', 'username', 'fullName'])
      })
      .orderBy('createdAt', 'desc')

    // Filtres
    if (status) {
      query = query.where('status', status)
    }

    if (gameType) {
      query = query.where('gameType', gameType)
    }

    // Recherche par nom d'utilisateur
    if (search) {
      query = query
        .whereHas('user', (userQuery) => {
          userQuery
            .whereRaw('LOWER(username) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereRaw('LOWER(full_name) LIKE ?', [`%${search.toLowerCase()}%`])
        })
        .orWhereHas('opponent', (opponentQuery) => {
          opponentQuery
            .whereRaw('LOWER(username) LIKE ?', [`%${search.toLowerCase()}%`])
            .orWhereRaw('LOWER(full_name) LIKE ?', [`%${search.toLowerCase()}%`])
        })
    }

    const games = await query.paginate(page, 20)

    // Statistiques globales des parties
    const [totalGames, activeGames, completedGames, cancelledGames] = await Promise.all([
      Game.query().count('*').first(),
      Game.query().where('status', 'IN_PROGRESS').count('*').first(),
      Game.query().where('status', 'COMPLETED').count('*').first(),
      Game.query().where('status', 'CANCELLED').count('*').first(),
    ])

    const stats = {
      total: totalGames?.$extras['count(*)'] || 0,
      active: activeGames?.$extras['count(*)'] || 0,
      completed: completedGames?.$extras['count(*)'] || 0,
      cancelled: cancelledGames?.$extras['count(*)'] || 0,
    }

    return inertia.render('admin/parties/Index', {
      games: {
        data: games.all().map((game) => ({
          id: game.id,
          gameType: game.gameType,
          pointsLimit: game.pointsLimit,
          status: game.status,
          playerScore: game.playerScore,
          opponentScore: game.opponentScore,
          mission: game.mission,
          deployment: game.deployment,
          startedAt: game.startedAt?.toFormat('dd/MM/yyyy HH:mm') || null,
          completedAt: game.completedAt?.toFormat('dd/MM/yyyy HH:mm') || null,
          createdAt: game.createdAt.toFormat('dd/MM/yyyy HH:mm'),
          user: {
            id: game.user.id,
            username: game.user.username,
            fullName: game.user.fullName,
          },
          opponent: game.opponent
            ? {
                id: game.opponent.id,
                username: game.opponent.username,
                fullName: game.opponent.fullName,
              }
            : null,
        })),
        meta: games.getMeta(),
      },
      filters: {
        status,
        gameType,
        search,
      },
      stats,
      breadcrumbItems: [
        { label: 'Administration', href: '/admin' },
        { label: 'Gestion des Parties' },
      ],
    })
  }

  /**
   * Affiche le détail d'une partie avec les rounds
   */
  async show({ inertia, params }: HttpContext) {
    const game = await Game.query()
      .where('id', params.id)
      .preload('user', (userQuery) => {
        userQuery.select(['id', 'username', 'fullName', 'email'])
      })
      .preload('opponent', (opponentQuery) => {
        opponentQuery.select(['id', 'username', 'fullName', 'email'])
      })
      .firstOrFail()

    // Charger les rounds de la partie
    const rounds = await Round.query().where('gameId', game.id).orderBy('roundNumber', 'asc')

    return inertia.render('admin/parties/Show', {
      game: {
        id: game.id,
        gameType: game.gameType,
        pointsLimit: game.pointsLimit,
        status: game.status,
        playerScore: game.playerScore,
        opponentScore: game.opponentScore,
        mission: game.mission,
        deployment: game.deployment,
        primaryScoringMethod: game.primaryScoringMethod,
        notes: game.notes,
        startedAt: game.startedAt?.toFormat('dd/MM/yyyy HH:mm:ss') || null,
        completedAt: game.completedAt?.toFormat('dd/MM/yyyy HH:mm:ss') || null,
        createdAt: game.createdAt.toFormat('dd/MM/yyyy HH:mm:ss'),
        updatedAt: game.updatedAt?.toFormat('dd/MM/yyyy HH:mm:ss') || null,
        user: {
          id: game.user.id,
          username: game.user.username,
          fullName: game.user.fullName,
          email: game.user.email,
        },
        opponent: game.opponent
          ? {
              id: game.opponent.id,
              username: game.opponent.username,
              fullName: game.opponent.fullName,
              email: game.opponent.email,
            }
          : null,
      },
      rounds: rounds.map((round) => ({
        id: round.id,
        roundNumber: round.roundNumber,
        playerScore: round.playerScore,
        opponentScore: round.opponentScore,
        isCompleted: round.isCompleted,
        createdAt: round.createdAt.toFormat('dd/MM/yyyy HH:mm'),
        updatedAt: round.updatedAt?.toFormat('dd/MM/yyyy HH:mm') || null,
      })),
      breadcrumbItems: [
        { label: 'Administration', href: '/admin' },
        { label: 'Gestion des Parties', href: '/admin/parties' },
        { label: `Partie #${game.id}` },
      ],
    })
  }

  /**
   * Met à jour le statut d'une partie
   */
  async updateStatus({ request, response, params }: HttpContext) {
    const { status } = request.only(['status'])

    const validStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return response.badRequest({ message: 'Statut invalide' })
    }

    const game = await Game.findOrFail(params.id)
    const oldStatus = game.status

    game.status = status

    // Mettre à jour les timestamps selon le statut
    if (status === 'IN_PROGRESS' && !game.startedAt) {
      game.startedAt = DateTime.now()
    } else if (status === 'COMPLETED' && !game.completedAt) {
      game.completedAt = DateTime.now()
    } else if (status === 'CANCELLED') {
      game.completedAt = DateTime.now()
    }

    await game.save()

    return response.json({
      message: 'Statut mis à jour avec succès',
      game: {
        id: game.id,
        status: game.status,
        startedAt: game.startedAt?.toFormat('dd/MM/yyyy HH:mm') || null,
        completedAt: game.completedAt?.toFormat('dd/MM/yyyy HH:mm') || null,
      },
      changes: {
        old_status: oldStatus,
        new_status: status,
      },
    })
  }

  /**
   * Supprime une partie (soft delete avec CANCELLED)
   */
  async destroy({ response, params }: HttpContext) {
    const game = await Game.findOrFail(params.id)

    // Au lieu de supprimer, on met le statut CANCELLED
    if (game.status !== 'CANCELLED') {
      game.status = 'CANCELLED'
      game.completedAt = DateTime.now()
      await game.save()
    }

    return response.json({
      message: 'Partie annulée avec succès',
      game: {
        id: game.id,
        status: game.status,
      },
    })
  }

  /**
   * Récupère les statistiques des parties pour les graphiques
   */
  async stats({ response }: HttpContext) {
    const [gamesByStatus, gamesByType, gamesLastWeek, averageGameDuration, topPlayers] =
      await Promise.all([
        // Répartition par statut
        Game.query().select('status').count('* as total').groupBy('status'),

        // Répartition par type
        Game.query().select('gameType').count('* as total').groupBy('gameType'),

        // Parties créées dans la dernière semaine
        Game.query()
          .where('createdAt', '>=', DateTime.now().minus({ days: 7 }).toSQL())
          .count('*')
          .first(),

        // Durée moyenne des parties terminées
        Game.query()
          .where('status', 'COMPLETED')
          .whereNotNull('startedAt')
          .whereNotNull('completedAt')
          .select([
            Game.query().client.raw(
              'AVG(JULIANDAY(completed_at) - JULIANDAY(started_at)) as avg_duration'
            ),
          ])
          .first(),

        // Top 5 joueurs les plus actifs
        User.query()
          .select('users.id', 'users.username', 'users.fullName')
          .leftJoin('games', 'users.id', 'games.userId')
          .count('games.id as games_count')
          .groupBy('users.id', 'users.username', 'users.fullName')
          .orderBy('games_count', 'desc')
          .limit(5),
      ])

    const stats = {
      byStatus: gamesByStatus.map((item) => ({
        status: item.status,
        count: Number(item.$extras.total),
      })),
      byType: gamesByType.map((item) => ({
        type: item.gameType,
        count: Number(item.$extras.total),
      })),
      recentGames: Number(gamesLastWeek?.$extras['count(*)'] || 0),
      averageDuration: averageGameDuration?.$extras.avg_duration || 0,
      topPlayers: topPlayers.map((player) => ({
        id: player.id,
        username: player.username,
        fullName: player.fullName,
        gamesCount: Number(player.$extras.games_count),
      })),
    }

    return response.json(stats)
  }
}
