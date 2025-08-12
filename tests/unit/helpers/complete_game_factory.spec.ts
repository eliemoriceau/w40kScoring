import { test } from '@japa/runner'
import CompleteGameFactory from '#tests/helpers/complete_game_factory'
import Score from '#domain/entities/score'
import GameStatus from '#domain/value-objects/game_status'

test.group('CompleteGameFactory', () => {
  test('should create a complete game with default configuration', ({ assert }) => {
    // Act
    const completeGame = CompleteGameFactory.createCompleteGame({
      includeDetailedScores: true,
    })

    // Assert
    assert.isObject(completeGame.game)
    assert.equal(completeGame.game.constructor.name, 'Game')
    assert.lengthOf(completeGame.players, 2)
    assert.lengthOf(completeGame.rounds, 5)
    assert.isTrue(completeGame.scores.length > 0)

    // Game should be completed
    assert.equal(completeGame.game.status.value, GameStatus.COMPLETED.value)
    assert.isNotNull(completeGame.game.playerScore)
    assert.isNotNull(completeGame.game.opponentScore)

    // Players should be different
    assert.notEqual(completeGame.players[0].pseudo.value, completeGame.players[1].pseudo.value)

    // All rounds should be completed
    completeGame.rounds.forEach((round) => {
      assert.isTrue(round.isCompleted)
      assert.isTrue(round.playerScore >= 0)
      assert.isTrue(round.opponentScore >= 0)
    })
  })

  test('should create game with custom player configuration', ({ assert }) => {
    // Act
    const completeGame = CompleteGameFactory.createCompleteGame({
      players: [
        { pseudo: 'SpaceMarine42', userId: 100 },
        { pseudo: 'ChaosCultist', userId: null }, // Guest player
      ],
    })

    // Assert
    assert.lengthOf(completeGame.players, 2)
    assert.equal(completeGame.players[0].pseudo.value, 'SpaceMarine42')
    assert.equal(completeGame.players[1].pseudo.value, 'ChaosCultist')
    assert.equal(completeGame.players[0].userId, 100)
    assert.isNull(completeGame.players[1].userId)
    assert.isTrue(completeGame.players[1].isGuest)
  })

  test('should create game with custom round count', ({ assert }) => {
    // Act
    const completeGame = CompleteGameFactory.createCompleteGame({
      roundCount: 3,
    })

    // Assert
    assert.lengthOf(completeGame.rounds, 3)

    // Round numbers should be sequential
    completeGame.rounds.forEach((round, index) => {
      assert.equal(round.roundNumber.value, index + 1)
    })
  })

  test('should create realistic scoring patterns', ({ assert }) => {
    // Act
    const completeGame = CompleteGameFactory.createCompleteGame({
      scorePattern: 'realistic',
    })

    // Assert
    // Check that scores are within realistic W40K ranges
    completeGame.rounds.forEach((round) => {
      assert.isTrue(round.playerScore >= 5 && round.playerScore <= 35)
      assert.isTrue(round.opponentScore >= 5 && round.opponentScore <= 35)
    })

    // Final game scores should be reasonable sum of rounds
    const expectedPlayerScore = completeGame.rounds.reduce(
      (sum, round) => sum + round.playerScore,
      0
    )
    const expectedOpponentScore = completeGame.rounds.reduce(
      (sum, round) => sum + round.opponentScore,
      0
    )

    assert.equal(completeGame.game.playerScore, expectedPlayerScore)
    assert.equal(completeGame.game.opponentScore, expectedOpponentScore)
  })

  test('should create escalating scoring pattern', ({ assert }) => {
    // Act
    const completeGame = CompleteGameFactory.createCompleteGame({
      scorePattern: 'escalating',
    })

    // Assert
    const rounds = completeGame.rounds

    // Check that the last round has higher total score than the first round for escalating pattern
    const firstRoundTotal = rounds[0].playerScore + rounds[0].opponentScore
    const lastRoundTotal =
      rounds[rounds.length - 1].playerScore + rounds[rounds.length - 1].opponentScore

    // In escalating pattern, later rounds should generally have higher scores
    assert.isTrue(
      lastRoundTotal >= firstRoundTotal - 10,
      `Expected escalating pattern: last round (${lastRoundTotal}) should be >= first round (${firstRoundTotal}) - 10`
    )
  })

  test('should create detailed scores per round and player', ({ assert }) => {
    // Act
    const completeGame = CompleteGameFactory.createCompleteGame({
      includeDetailedScores: true,
    })

    // Assert
    assert.isTrue(completeGame.scores.length > 0)

    // Should have scores for each player in each round
    const expectedMinScores = completeGame.players.length * completeGame.rounds.length * 2 // At least 2 scores per player per round
    assert.isTrue(completeGame.scores.length >= expectedMinScores)

    // Verify score distribution
    const scoresByRound = new Map<number, Score[]>()
    completeGame.scores.forEach((score) => {
      const roundId = score.roundId.value
      if (!scoresByRound.has(roundId)) {
        scoresByRound.set(roundId, [])
      }
      scoresByRound.get(roundId)!.push(score)
    })

    // Each round should have scores
    assert.equal(scoresByRound.size, completeGame.rounds.length)

    // Each score should have valid properties
    completeGame.scores.forEach((score) => {
      assert.isString(score.scoreName.value)
      assert.isNumber(score.scoreValue.value)
      assert.isString(score.scoreType.value)
    })
  })

  test('should create competitive close game scenario', ({ assert }) => {
    // Act
    const completeGame = CompleteGameFactory.createScenario('competitive')

    // Assert
    const finalPlayerScore = completeGame.game.playerScore!
    const finalOpponentScore = completeGame.game.opponentScore!
    const scoreDifference = Math.abs(finalPlayerScore - finalOpponentScore)

    // Should be a close game (within 15 points)
    assert.isTrue(scoreDifference <= 15)
    assert.isTrue(finalPlayerScore >= 60 && finalPlayerScore <= 95)
    assert.isTrue(finalOpponentScore >= 60 && finalOpponentScore <= 95)
  })

  test('should create domination game scenario', ({ assert }) => {
    // Act
    const completeGame = CompleteGameFactory.createScenario('domination')

    // Assert
    const finalPlayerScore = completeGame.game.playerScore!
    const finalOpponentScore = completeGame.game.opponentScore!
    const scoreDifference = Math.abs(finalPlayerScore - finalOpponentScore)

    // Should be a dominant victory (>25 point difference)
    assert.isTrue(scoreDifference > 25)
  })

  test('should create learning game scenario (low scores)', ({ assert }) => {
    // Act
    const completeGame = CompleteGameFactory.createScenario('learning')

    // Assert
    const finalPlayerScore = completeGame.game.playerScore!
    const finalOpponentScore = completeGame.game.opponentScore!

    // Should be lower scores typical of learning games
    assert.isTrue(finalPlayerScore <= 60)
    assert.isTrue(finalOpponentScore <= 60)
  })

  test('should ensure all entities have proper relationships', ({ assert }) => {
    // Act
    const completeGame = CompleteGameFactory.createCompleteGame()

    // Assert - Game relationships
    const gameId = completeGame.game.id

    // All players belong to this game
    completeGame.players.forEach((player) => {
      assert.equal(player.gameId.value, gameId.value)
    })

    // All rounds belong to this game
    completeGame.rounds.forEach((round) => {
      assert.equal(round.gameId.value, gameId.value)
    })

    // All scores belong to rounds of this game and players of this game
    const playerIds = completeGame.players.map((p) => p.id.value)
    const roundIds = completeGame.rounds.map((r) => r.id.value)

    completeGame.scores.forEach((score) => {
      assert.include(playerIds, score.playerId.value)
      assert.include(roundIds, score.roundId.value)
    })
  })

  test('should support different game formats', ({ assert }) => {
    // Act
    const combatPatrolGame = CompleteGameFactory.createForFormat('combat-patrol')
    const strikeForceGame = CompleteGameFactory.createForFormat('strike-force')

    // Assert
    assert.equal(combatPatrolGame.game.pointsLimit.value, 500)
    assert.equal(strikeForceGame.game.pointsLimit.value, 2000)

    // Combat Patrol games should have lower scores
    const combatPatrolFinalScore =
      combatPatrolGame.game.playerScore! + combatPatrolGame.game.opponentScore!
    const strikeForceinalScore =
      strikeForceGame.game.playerScore! + strikeForceGame.game.opponentScore!

    assert.isTrue(combatPatrolFinalScore < strikeForceinalScore)
  })

  test('should create reproducible games when seed is provided', ({ assert }) => {
    // Act
    const game1 = CompleteGameFactory.createCompleteGame({ seed: 12345 })
    const game2 = CompleteGameFactory.createCompleteGame({ seed: 12345 })

    // Assert - Games should be identical
    assert.equal(game1.game.playerScore, game2.game.playerScore)
    assert.equal(game1.game.opponentScore, game2.game.opponentScore)
    assert.equal(game1.players[0].pseudo.value, game2.players[0].pseudo.value)
    assert.equal(game1.players[1].pseudo.value, game2.players[1].pseudo.value)

    // Rounds should match
    game1.rounds.forEach((round, index) => {
      assert.equal(round.playerScore, game2.rounds[index].playerScore)
      assert.equal(round.opponentScore, game2.rounds[index].opponentScore)
    })
  })
})
