import { test } from '@japa/runner'
import {
  GameDetailSummary,
  PlayerSummary,
  RoundSummary,
  ScoreSummary,
} from '#domain/value-objects/game_detail_summary'

test.group('GameDetailSummary', () => {
  // Données de test valides
  const validData = {
    gameId: 1,
    userId: 100,
    gameType: 'MATCHED_PLAY',
    pointsLimit: 2000,
    status: 'COMPLETED',
    opponentId: 101,
    playerScore: 85,
    opponentScore: 72,
    mission: 'Take and Hold',
    deployment: 'Dawn of War',
    primaryScoringMethod: 'Progressive',
    notes: 'Great game!',
    createdAt: new Date('2024-01-01'),
    startedAt: new Date('2024-01-01T10:00:00'),
    completedAt: new Date('2024-01-01T12:00:00'),
    players: [
      {
        id: 1,
        gameId: 1,
        userId: 100,
        pseudo: 'Player1',
        isGuest: false,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 2,
        gameId: 1,
        userId: 101,
        pseudo: 'Player2',
        isGuest: false,
        createdAt: new Date('2024-01-01'),
      },
    ] as PlayerSummary[],
    rounds: [
      {
        id: 1,
        gameId: 1,
        roundNumber: 1,
        playerScore: 25,
        opponentScore: 20,
        isCompleted: true,
        createdAt: new Date('2024-01-01T10:30:00'),
      },
      {
        id: 2,
        gameId: 1,
        roundNumber: 2,
        playerScore: 30,
        opponentScore: 25,
        isCompleted: true,
        createdAt: new Date('2024-01-01T11:00:00'),
      },
    ] as RoundSummary[],
    secondaryScores: [
      {
        id: 1,
        roundId: 1,
        playerId: 1,
        scoreType: 'SECONDARY',
        scoreName: 'Deploy Scramblers',
        scoreValue: 10,
        createdAt: new Date('2024-01-01T10:30:00'),
      },
    ] as ScoreSummary[],
  }

  test('should create valid GameDetailSummary', ({ assert }) => {
    const summary = new GameDetailSummary(
      validData.gameId,
      validData.userId,
      validData.gameType,
      validData.pointsLimit,
      validData.status,
      validData.opponentId,
      validData.playerScore,
      validData.opponentScore,
      validData.mission,
      validData.deployment,
      validData.primaryScoringMethod,
      validData.notes,
      validData.createdAt,
      validData.startedAt,
      validData.completedAt,
      validData.players,
      validData.rounds,
      validData.secondaryScores
    )

    assert.equal(summary.gameId, 1)
    assert.equal(summary.userId, 100)
    assert.equal(summary.gameType, 'MATCHED_PLAY')
    assert.equal(summary.players.length, 2)
    assert.equal(summary.rounds.length, 2)
  })

  test('should throw error for invalid game ID', ({ assert }) => {
    assert.throws(() => {
      new GameDetailSummary(
        0, // Invalid game ID
        validData.userId,
        validData.gameType,
        validData.pointsLimit,
        validData.status,
        validData.opponentId,
        validData.playerScore,
        validData.opponentScore,
        validData.mission,
        validData.deployment,
        validData.primaryScoringMethod,
        validData.notes,
        validData.createdAt,
        validData.startedAt,
        validData.completedAt,
        validData.players,
        validData.rounds,
        validData.secondaryScores
      )
    }, 'Game ID must be a positive number')
  })

  test('should throw error for invalid user ID', ({ assert }) => {
    assert.throws(() => {
      new GameDetailSummary(
        validData.gameId,
        0, // Invalid user ID
        validData.gameType,
        validData.pointsLimit,
        validData.status,
        validData.opponentId,
        validData.playerScore,
        validData.opponentScore,
        validData.mission,
        validData.deployment,
        validData.primaryScoringMethod,
        validData.notes,
        validData.createdAt,
        validData.startedAt,
        validData.completedAt,
        validData.players,
        validData.rounds,
        validData.secondaryScores
      )
    }, 'User ID must be a positive number')
  })

  test('should throw error for no players', ({ assert }) => {
    assert.throws(() => {
      new GameDetailSummary(
        validData.gameId,
        validData.userId,
        validData.gameType,
        validData.pointsLimit,
        validData.status,
        validData.opponentId,
        validData.playerScore,
        validData.opponentScore,
        validData.mission,
        validData.deployment,
        validData.primaryScoringMethod,
        validData.notes,
        validData.createdAt,
        validData.startedAt,
        validData.completedAt,
        [], // No players
        validData.rounds,
        validData.secondaryScores
      )
    }, 'Game must have at least one player')
  })

  test('should get main player correctly', ({ assert }) => {
    const summary = new GameDetailSummary(
      validData.gameId,
      validData.userId,
      validData.gameType,
      validData.pointsLimit,
      validData.status,
      validData.opponentId,
      validData.playerScore,
      validData.opponentScore,
      validData.mission,
      validData.deployment,
      validData.primaryScoringMethod,
      validData.notes,
      validData.createdAt,
      validData.startedAt,
      validData.completedAt,
      validData.players,
      validData.rounds,
      validData.secondaryScores
    )

    const mainPlayer = summary.getMainPlayer()
    assert.isNotNull(mainPlayer)
    assert.equal(mainPlayer!.userId, 100)
    assert.equal(mainPlayer!.pseudo, 'Player1')
  })

  test('should get opponent player correctly', ({ assert }) => {
    const summary = new GameDetailSummary(
      validData.gameId,
      validData.userId,
      validData.gameType,
      validData.pointsLimit,
      validData.status,
      validData.opponentId,
      validData.playerScore,
      validData.opponentScore,
      validData.mission,
      validData.deployment,
      validData.primaryScoringMethod,
      validData.notes,
      validData.createdAt,
      validData.startedAt,
      validData.completedAt,
      validData.players,
      validData.rounds,
      validData.secondaryScores
    )

    const opponent = summary.getOpponentPlayer()
    assert.isNotNull(opponent)
    assert.equal(opponent!.userId, 101)
    assert.equal(opponent!.pseudo, 'Player2')
  })

  test('should calculate total score for player correctly', ({ assert }) => {
    const summary = new GameDetailSummary(
      validData.gameId,
      validData.userId,
      validData.gameType,
      validData.pointsLimit,
      validData.status,
      validData.opponentId,
      validData.playerScore,
      validData.opponentScore,
      validData.mission,
      validData.deployment,
      validData.primaryScoringMethod,
      validData.notes,
      validData.createdAt,
      validData.startedAt,
      validData.completedAt,
      validData.players,
      validData.rounds,
      validData.secondaryScores
    )

    const mainPlayerScore = summary.getTotalScoreForPlayer(1)
    // Player scores: Round 1 (25) + Round 2 (30) = 55
    assert.equal(mainPlayerScore, 55)
  })

  test('should get secondary scores for player correctly', ({ assert }) => {
    const summary = new GameDetailSummary(
      validData.gameId,
      validData.userId,
      validData.gameType,
      validData.pointsLimit,
      validData.status,
      validData.opponentId,
      validData.playerScore,
      validData.opponentScore,
      validData.mission,
      validData.deployment,
      validData.primaryScoringMethod,
      validData.notes,
      validData.createdAt,
      validData.startedAt,
      validData.completedAt,
      validData.players,
      validData.rounds,
      validData.secondaryScores
    )

    const scores = summary.getSecondaryScoresForPlayer(1)
    assert.equal(scores.length, 1)
    assert.equal(scores[0].scoreName, 'Deploy Scramblers')
    assert.equal(scores[0].scoreValue, 10)
  })

  test('should determine winner correctly - PLAYER wins', ({ assert }) => {
    const summary = new GameDetailSummary(
      validData.gameId,
      validData.userId,
      validData.gameType,
      validData.pointsLimit,
      'COMPLETED', // Status must be completed
      validData.opponentId,
      85, // Player score higher
      72, // Opponent score lower
      validData.mission,
      validData.deployment,
      validData.primaryScoringMethod,
      validData.notes,
      validData.createdAt,
      validData.startedAt,
      validData.completedAt,
      validData.players,
      validData.rounds,
      validData.secondaryScores
    )

    assert.equal(summary.getWinner(), 'PLAYER')
  })

  test('should determine winner correctly - DRAW', ({ assert }) => {
    const summary = new GameDetailSummary(
      validData.gameId,
      validData.userId,
      validData.gameType,
      validData.pointsLimit,
      'COMPLETED',
      validData.opponentId,
      75, // Equal scores
      75, // Equal scores
      validData.mission,
      validData.deployment,
      validData.primaryScoringMethod,
      validData.notes,
      validData.createdAt,
      validData.startedAt,
      validData.completedAt,
      validData.players,
      validData.rounds,
      validData.secondaryScores
    )

    assert.equal(summary.getWinner(), 'DRAW')
  })

  test('should return null for winner when game not completed', ({ assert }) => {
    const summary = new GameDetailSummary(
      validData.gameId,
      validData.userId,
      validData.gameType,
      validData.pointsLimit,
      'IN_PROGRESS', // Not completed
      validData.opponentId,
      validData.playerScore,
      validData.opponentScore,
      validData.mission,
      validData.deployment,
      validData.primaryScoringMethod,
      validData.notes,
      validData.createdAt,
      validData.startedAt,
      null, // Not completed
      validData.players,
      validData.rounds,
      validData.secondaryScores
    )

    assert.isNull(summary.getWinner())
  })

  test('should determine if game is editable correctly', ({ assert }) => {
    // Test PLANNED status (editable)
    const plannedSummary = new GameDetailSummary(
      validData.gameId,
      validData.userId,
      validData.gameType,
      validData.pointsLimit,
      'PLANNED',
      validData.opponentId,
      null,
      null,
      validData.mission,
      validData.deployment,
      validData.primaryScoringMethod,
      validData.notes,
      validData.createdAt,
      null,
      null,
      validData.players,
      validData.rounds,
      validData.secondaryScores
    )
    assert.isTrue(plannedSummary.isEditable())

    // Test IN_PROGRESS status (editable)
    const inProgressSummary = new GameDetailSummary(
      validData.gameId,
      validData.userId,
      validData.gameType,
      validData.pointsLimit,
      'IN_PROGRESS',
      validData.opponentId,
      null,
      null,
      validData.mission,
      validData.deployment,
      validData.primaryScoringMethod,
      validData.notes,
      validData.createdAt,
      validData.startedAt,
      null,
      validData.players,
      validData.rounds,
      validData.secondaryScores
    )
    assert.isTrue(inProgressSummary.isEditable())

    // Test COMPLETED status (not editable)
    const completedSummary = new GameDetailSummary(
      validData.gameId,
      validData.userId,
      validData.gameType,
      validData.pointsLimit,
      'COMPLETED',
      validData.opponentId,
      validData.playerScore,
      validData.opponentScore,
      validData.mission,
      validData.deployment,
      validData.primaryScoringMethod,
      validData.notes,
      validData.createdAt,
      validData.startedAt,
      validData.completedAt,
      validData.players,
      validData.rounds,
      validData.secondaryScores
    )
    assert.isFalse(completedSummary.isEditable())
  })
})
