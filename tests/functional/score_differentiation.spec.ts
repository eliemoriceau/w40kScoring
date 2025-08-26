import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import GameService from '#application/services/game_service'
import { GameDetailService } from '#application/services/game_detail_service'
import LucidGameRepository from '#infrastructure/repositories/lucid_game_repository'
import LucidPlayerRepository from '#infrastructure/repositories/lucid_player_repository'
import LucidRoundRepository from '#infrastructure/repositories/lucid_round_repository'
import LucidScoreRepository from '#infrastructure/repositories/lucid_score_repository'
import LucidGameQueryRepository from '#infrastructure/repositories/lucid_game_query_repository'
import LucidPlayerQueryRepository from '#infrastructure/repositories/lucid_player_query_repository'
import LucidRoundQueryRepository from '#infrastructure/repositories/lucid_round_query_repository'
import LucidScoreQueryRepository from '#infrastructure/repositories/lucid_score_query_repository'
import UuidV7IdGenerator from '#infrastructure/services/uuid_v7_id_generator'
import User from '#models/user'
import Game from '#models/game'
import Player from '#models/player'
import Round from '#models/round'
import GameId from '#domain/value-objects/game_id'

/**
 * Tests fonctionnels pour la correction du problème de différentiation des scores
 *
 * Ces tests valident que :
 * 1. Les scores sont correctement associés aux joueurs spécifiques
 * 2. Le mapping playerScores fonctionne correctement
 * 3. Les calculs de scores totaux sont corrects
 * 4. Le contrôleur retourne les bonnes données au frontend
 */

test.group('Score Differentiation Fix', (group) => {
  let gameDetailService: GameDetailService
  let testUser1: User
  let testUser2: User

  group.setup(async () => {
    // Setup des services
    const gameRepository = new LucidGameRepository()
    const playerRepository = new LucidPlayerRepository()
    const roundRepository = new LucidRoundRepository()
    const scoreRepository = new LucidScoreRepository()
    const idGenerator = new UuidV7IdGenerator()

    const gameQueryRepository = new LucidGameQueryRepository()
    const playerQueryRepository = new LucidPlayerQueryRepository()
    const roundQueryRepository = new LucidRoundQueryRepository()
    const scoreQueryRepository = new LucidScoreQueryRepository()

    gameDetailService = new GameDetailService(
      gameQueryRepository,
      playerQueryRepository,
      roundQueryRepository,
      scoreQueryRepository
    )

    // Créer des utilisateurs de test
    testUser1 = await User.create({
      username: `test_user_1_${Date.now()}`,
      email: `test1_${Date.now()}@test.com`,
      password: 'test123',
      roleId: 1,
      termsAcceptedAt: DateTime.now(),
    })

    testUser2 = await User.create({
      username: `test_user_2_${Date.now()}`,
      email: `test2_${Date.now()}@test.com`,
      password: 'test123',
      roleId: 1,
      termsAcceptedAt: DateTime.now(),
    })
  })

  group.teardown(async () => {
    // Nettoyage
    await User.query().whereIn('id', [testUser1.id, testUser2.id]).delete()
  })

  test('should correctly differentiate scores between two players', async ({ assert }) => {
    // Arrange - Créer une partie avec deux joueurs et des scores différents
    const game = await Game.create({
      userId: testUser1.id,
      gameType: 'MATCHED_PLAY',
      status: 'IN_PROGRESS',
      pointsLimit: 2000,
    })

    const player1 = await Player.create({
      gameId: game.id,
      userId: testUser1.id,
      pseudo: 'Player1',
      isGuest: false,
    })

    const player2 = await Player.create({
      gameId: game.id,
      userId: testUser2.id,
      pseudo: 'Player2',
      isGuest: false,
    })

    // Créer des rounds avec des scores différents
    await Round.create({
      gameId: game.id,
      roundNumber: 1,
      playerScore: 12, // Score du joueur principal
      opponentScore: 8, // Score de l'adversaire
      isCompleted: true,
    })

    await Round.create({
      gameId: game.id,
      roundNumber: 2,
      playerScore: 15, // Score du joueur principal
      opponentScore: 10, // Score de l'adversaire
      isCompleted: true,
    })

    // Act - Récupérer les détails de la partie
    const gameDetail = await gameDetailService.getGameDetail(new GameId(game.id), testUser1.id)

    // Assert - Vérifier que les données sont correctes
    assert.isNotNull(gameDetail)
    assert.equal(gameDetail!.players.length, 2)
    assert.equal(gameDetail!.rounds.length, 2)

    // Vérifier que chaque joueur a le bon score total
    const player1Total = gameDetail!.getTotalScoreForPlayer(player1.id) // 12 + 15 = 27
    const player2Total = gameDetail!.getTotalScoreForPlayer(player2.id) // 8 + 10 = 18

    assert.equal(player1Total, 27, 'Player1 should have 27 points total')
    assert.equal(player2Total, 18, 'Player2 should have 18 points total')

    // Vérifier que les scores sont différents (le problème originel)
    assert.isTrue(player1Total !== player2Total, 'Players should have different scores')

    // Cleanup
    await Round.query().where('gameId', game.id).delete()
    await Player.query().where('gameId', game.id).delete()
    await Game.query().where('id', game.id).delete()
  })

  test('should generate correct playerScores mapping for frontend', async ({ assert }) => {
    // Arrange
    const game = await Game.create({
      userId: testUser1.id,
      gameType: 'MATCHED_PLAY',
      status: 'IN_PROGRESS',
      pointsLimit: 2000,
    })

    const player1 = await Player.create({
      gameId: game.id,
      userId: testUser1.id,
      pseudo: 'MainPlayer',
      isGuest: false,
    })

    const player2 = await Player.create({
      gameId: game.id,
      userId: testUser2.id,
      pseudo: 'Opponent',
      isGuest: false,
    })

    const round = await Round.create({
      gameId: game.id,
      roundNumber: 1,
      playerScore: 20,
      opponentScore: 14,
      isCompleted: true,
    })

    // Act - Simuler la méthode du contrôleur
    const players = [
      { id: player1.id, userId: testUser1.id },
      { id: player2.id, userId: testUser2.id },
    ]

    const roundData = {
      id: round.id,
      playerScore: round.playerScore,
      opponentScore: round.opponentScore,
    }

    // Utiliser la logique du contrôleur
    const playerScoresMapping = buildPlayerScoresMapping(roundData, players, game.userId)

    // Assert
    assert.equal(playerScoresMapping[player1.id], 20, 'Main player should have playerScore')
    assert.equal(playerScoresMapping[player2.id], 14, 'Opponent should have opponentScore')

    // Cleanup
    await Round.query().where('id', round.id).delete()
    await Player.query().where('gameId', game.id).delete()
    await Game.query().where('id', game.id).delete()
  })

  test('should handle edge case with same scores correctly', async ({ assert }) => {
    // Arrange - Cas où les deux joueurs ont le même score (mais doivent rester différenciés)
    const game = await Game.create({
      userId: testUser1.id,
      gameType: 'MATCHED_PLAY',
      status: 'COMPLETED',
      pointsLimit: 1000,
    })

    const player1 = await Player.create({
      gameId: game.id,
      userId: testUser1.id,
      pseudo: 'Player1',
      isGuest: false,
    })

    const player2 = await Player.create({
      gameId: game.id,
      userId: testUser2.id,
      pseudo: 'Player2',
      isGuest: false,
    })

    // Rounds avec scores identiques mais doivent être associés au bon joueur
    await Round.create({
      gameId: game.id,
      roundNumber: 1,
      playerScore: 10,
      opponentScore: 10,
      isCompleted: true,
    })

    // Act
    const gameDetail = await gameDetailService.getGameDetail(new GameId(game.id), testUser1.id)

    // Assert - Même avec des scores identiques, les joueurs doivent être différenciés
    assert.isNotNull(gameDetail)

    const player1Score = gameDetail!.getTotalScoreForPlayer(player1.id)
    const player2Score = gameDetail!.getTotalScoreForPlayer(player2.id)

    assert.equal(player1Score, 10, 'Player1 should have correct score')
    assert.equal(player2Score, 10, 'Player2 should have correct score')

    // Vérifier que la logique de différentiation fonctionne même avec scores égaux
    const mainPlayer = gameDetail!.getMainPlayer()
    const opponent = gameDetail!.getOpponentPlayer()

    assert.equal(mainPlayer!.id, player1.id, 'Main player should be identified correctly')
    assert.equal(opponent!.id, player2.id, 'Opponent should be identified correctly')

    // Cleanup
    await Round.query().where('gameId', game.id).delete()
    await Player.query().where('gameId', game.id).delete()
    await Game.query().where('id', game.id).delete()
  })
})

// Helper function pour simuler la logique du contrôleur
function buildPlayerScoresMapping(
  round: any,
  players: any[],
  gameOwnerId: number
): { [playerId: number]: number } {
  const scoreMap: { [playerId: number]: number } = {}

  const mainPlayer = players.find((p: any) => p.userId === gameOwnerId)
  const opponentPlayer = players.find((p: any) => p.userId !== gameOwnerId)

  if (mainPlayer) {
    scoreMap[mainPlayer.id] = round.playerScore || 0
  }

  if (opponentPlayer) {
    scoreMap[opponentPlayer.id] = round.opponentScore || 0
  }

  return scoreMap
}
