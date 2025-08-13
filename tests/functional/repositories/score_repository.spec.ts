import { test } from '@japa/runner'
import { ScoreFactory } from '#tests/helpers/score_factory'
import LucidScoreQueryRepository from '#infrastructure/repositories/lucid_score_query_repository'
import LucidScoreCommandRepository from '#infrastructure/repositories/lucid_score_command_repository'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import ScoreType from '#domain/value-objects/score_type'
import ScoreModel from '#models/score'
import GameModel from '#models/game'
import PlayerModel from '#models/player'
import RoundModel from '#models/round'

test.group('Score Repository Integration', (group) => {
  let queryRepository: LucidScoreQueryRepository
  let commandRepository: LucidScoreCommandRepository
  let testGameId: number
  let testRoundId: number
  let testPlayer1Id: number
  let testPlayer2Id: number

  group.setup(async () => {
    // Initialize repositories
    queryRepository = new LucidScoreQueryRepository()
    commandRepository = new LucidScoreCommandRepository()
  })

  group.each.setup(async () => {
    // Clean up first to avoid conflicts
    await ScoreModel.query().delete()
    await PlayerModel.query().delete()
    await RoundModel.query().delete()
    await GameModel.query().delete()

    // Create test game
    await GameModel.create({
      userId: 123,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      status: 'PLANNED',
      playerScore: null,
      opponentScore: null,
      mission: null,
      notes: '',
    })

    // Get the created game to use its auto-generated ID
    const game = await GameModel.query().orderBy('id', 'desc').first()
    testGameId = game!.id

    // Create test round
    const round = await RoundModel.create({
      gameId: testGameId,
      roundNumber: 1,
      playerScore: 0,
      opponentScore: 0,
      isCompleted: false,
    })
    testRoundId = round.id

    // Create test players
    const player1 = await PlayerModel.create({
      userId: 1,
      gameId: testGameId,
      pseudo: 'TestPlayer1',
      isGuest: false,
    })
    testPlayer1Id = player1.id

    const player2 = await PlayerModel.create({
      userId: 2,
      gameId: testGameId,
      pseudo: 'TestPlayer2',
      isGuest: false,
    })
    testPlayer2Id = player2.id
  })

  group.each.teardown(async () => {
    // Clean up test data
    await ScoreModel.query().delete()
    await PlayerModel.query().delete()
    await RoundModel.query().delete()
    await GameModel.query().delete()
  })

  test('Command Repository - should save and retrieve a score', async ({ assert }) => {
    // Arrange
    const score = ScoreFactory.createObjective({
      roundId: new RoundId(testRoundId),
      playerId: new PlayerId(testPlayer1Id),
      scoreName: 'Hold Objective 1',
      scoreValue: 5,
    })

    // Act
    const savedScore = await commandRepository.save(score)

    // Assert
    assert.isTrue(savedScore.roundId.equals(new RoundId(testRoundId)))
    assert.isTrue(savedScore.playerId.equals(new PlayerId(testPlayer1Id)))
    assert.isTrue(savedScore.scoreType.equals(new ScoreType('OBJECTIVE')))
    assert.equal(savedScore.scoreValue.value, 5)
    assert.equal(savedScore.scoreName.value, 'Hold Objective 1')

    // Verify in database
    const scoreModel = await ScoreModel.query().where('round_id', testRoundId).first()
    assert.isNotNull(scoreModel)
    assert.equal(scoreModel!.roundId, testRoundId)
    assert.equal(scoreModel!.joueurId, testPlayer1Id)
    assert.equal(scoreModel!.typeScore, 'OBJECTIVE')
    assert.equal(scoreModel!.valeurScore, 5)
  })

  test('Command Repository - should save primary score', async ({ assert }) => {
    // Arrange
    const score = ScoreFactory.createPrimary({
      roundId: new RoundId(testRoundId),
      playerId: new PlayerId(testPlayer1Id),
      scoreValue: 25,
    })

    // Act
    const savedScore = await commandRepository.save(score)

    // Assert
    assert.equal(savedScore.scoreValue.value, 25)
    assert.isTrue(savedScore.scoreType.equals(new ScoreType('PRIMARY')))
  })

  test('Command Repository - should save penalty score', async ({ assert }) => {
    // Arrange
    const score = ScoreFactory.createPenalty({
      roundId: new RoundId(testRoundId),
      playerId: new PlayerId(testPlayer2Id),
      scoreValue: -10,
    })

    // Act
    const savedScore = await commandRepository.save(score)

    // Assert
    assert.equal(savedScore.scoreValue.value, -10)
    assert.isTrue(savedScore.scoreType.equals(new ScoreType('PENALTY')))
  })

  test('Query Repository - should find score by ID', async ({ assert }) => {
    // Arrange
    const scoreModel = await ScoreModel.create({
      roundId: testRoundId,
      joueurId: testPlayer1Id,
      typeScore: 'SECONDARY',
      nomScore: 'Assassinate',
      valeurScore: 12,
    })

    // Act
    const foundScore = await queryRepository.findById(new ScoreId(scoreModel.id))

    // Assert
    assert.isNotNull(foundScore)
    assert.isTrue(foundScore!.id.equals(new ScoreId(scoreModel.id)))
    assert.isTrue(foundScore!.scoreType.equals(new ScoreType('SECONDARY')))
    assert.equal(foundScore!.scoreValue.value, 12)
    assert.equal(foundScore!.scoreName.value, 'Assassinate')
  })

  test('Query Repository - should return null for non-existent score', async ({ assert }) => {
    // Act
    const foundScore = await queryRepository.findById(new ScoreId(999))

    // Assert
    assert.isNull(foundScore)
  })

  test('Query Repository - should find scores by round ID', async ({ assert }) => {
    // Arrange
    const scoresData = [
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'OBJECTIVE',
        nomScore: 'Hold Objective 1',
        valeurScore: 5,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'BONUS',
        nomScore: 'First Blood',
        valeurScore: 3,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer2Id,
        typeScore: 'PRIMARY',
        nomScore: 'Control Objectives',
        valeurScore: 20,
      },
    ]

    for (const data of scoresData) {
      await ScoreModel.create(data)
    }

    // Act
    const foundScores = await queryRepository.findByRoundId(new RoundId(testRoundId))

    // Assert
    assert.equal(foundScores.length, 3)
    foundScores.forEach((score) => {
      assert.isTrue(score.roundId.equals(new RoundId(testRoundId)))
    })
  })

  test('Query Repository - should find scores by player ID', async ({ assert }) => {
    // Arrange
    const scoresData = [
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'OBJECTIVE',
        nomScore: 'Hold Objective 1',
        valeurScore: 5,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'BONUS',
        nomScore: 'First Blood',
        valeurScore: 3,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer2Id,
        typeScore: 'PRIMARY',
        nomScore: 'Control Objectives',
        valeurScore: 20,
      },
    ]

    for (const data of scoresData) {
      await ScoreModel.create(data)
    }

    // Act
    const foundScores = await queryRepository.findByPlayerId(new PlayerId(testPlayer1Id))

    // Assert
    assert.equal(foundScores.length, 2)
    foundScores.forEach((score) => {
      assert.isTrue(score.playerId.equals(new PlayerId(testPlayer1Id)))
    })
  })

  test('Query Repository - should find scores by round and player', async ({ assert }) => {
    // Arrange
    await ScoreModel.create({
      roundId: testRoundId,
      joueurId: testPlayer1Id,
      typeScore: 'OBJECTIVE',
      nomScore: 'Hold Objective 1',
      valeurScore: 5,
    })

    await ScoreModel.create({
      roundId: testRoundId,
      joueurId: testPlayer1Id,
      typeScore: 'BONUS',
      nomScore: 'First Blood',
      valeurScore: 3,
    })

    // Act
    const foundScores = await queryRepository.findByRoundAndPlayer(
      new RoundId(testRoundId),
      new PlayerId(testPlayer1Id)
    )

    // Assert
    assert.equal(foundScores.length, 2)
    foundScores.forEach((score) => {
      assert.isTrue(score.roundId.equals(new RoundId(testRoundId)))
      assert.isTrue(score.playerId.equals(new PlayerId(testPlayer1Id)))
    })
  })

  test('Query Repository - should calculate total score by player', async ({ assert }) => {
    // Arrange
    const scoresData = [
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'OBJECTIVE',
        nomScore: 'Hold Objective 1',
        valeurScore: 5,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'BONUS',
        nomScore: 'First Blood',
        valeurScore: 3,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'PENALTY',
        nomScore: 'Late Deployment',
        valeurScore: -2,
      },
    ]

    for (const data of scoresData) {
      await ScoreModel.create(data)
    }

    // Act
    const totalScore = await queryRepository.getTotalScoreByPlayer(new PlayerId(testPlayer1Id))

    // Assert
    assert.equal(totalScore, 6) // 5 + 3 - 2
  })

  test('Query Repository - should calculate total score by round', async ({ assert }) => {
    // Arrange
    const scoresData = [
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'OBJECTIVE',
        nomScore: 'Hold Objective 1',
        valeurScore: 5,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer2Id,
        typeScore: 'PRIMARY',
        nomScore: 'Control Objectives',
        valeurScore: 15,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'PENALTY',
        nomScore: 'Late Deployment',
        valeurScore: -3,
      },
    ]

    for (const data of scoresData) {
      await ScoreModel.create(data)
    }

    // Act
    const totalScore = await queryRepository.getTotalScoreByRound(new RoundId(testRoundId))

    // Assert
    assert.equal(totalScore, 17) // 5 + 15 - 3
  })

  test('Query Repository - should get score statistics by player', async ({ assert }) => {
    // Arrange
    const scoresData = [
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'OBJECTIVE',
        nomScore: 'Hold Objective 1',
        valeurScore: 5,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'BONUS',
        nomScore: 'First Blood',
        valeurScore: 3,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'PENALTY',
        nomScore: 'Late Deployment',
        valeurScore: -2,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'PRIMARY',
        nomScore: 'Control Objectives',
        valeurScore: 0,
      },
    ]

    for (const data of scoresData) {
      await ScoreModel.create(data)
    }

    // Act
    const stats = await queryRepository.getScoreStatsByPlayer(new PlayerId(testPlayer1Id))

    // Assert
    assert.equal(stats.totalScore, 6) // 5 + 3 - 2 + 0
    assert.equal(stats.positiveScores, 2) // 5, 3
    assert.equal(stats.negativeScores, 1) // -2
    assert.equal(stats.scoreCount, 4)
    assert.equal(stats.averageScore, 1.5) // 6 / 4
    assert.equal(stats.scoresByType.OBJECTIVE, 5)
    assert.equal(stats.scoresByType.BONUS, 3)
    assert.equal(stats.scoresByType.PENALTY, -2)
    assert.equal(stats.scoresByType.PRIMARY, 0)
  })

  test('Query Repository - should find scores by type', async ({ assert }) => {
    // Arrange
    const scoresData = [
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'OBJECTIVE',
        nomScore: 'Hold Objective 1',
        valeurScore: 5,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'OBJECTIVE',
        nomScore: 'Hold Objective 2',
        valeurScore: 3,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer2Id,
        typeScore: 'PRIMARY',
        nomScore: 'Control Objectives',
        valeurScore: 20,
      },
    ]

    for (const data of scoresData) {
      await ScoreModel.create(data)
    }

    // Act
    const objectiveScores = await queryRepository.findByType(new ScoreType('OBJECTIVE'))

    // Assert
    assert.equal(objectiveScores.length, 2)
    objectiveScores.forEach((score) => {
      assert.isTrue(score.scoreType.equals(new ScoreType('OBJECTIVE')))
    })
  })

  test('Command Repository - should delete score by ID', async ({ assert }) => {
    // Arrange
    const scoreModel = await ScoreModel.create({
      roundId: testRoundId,
      joueurId: testPlayer1Id,
      typeScore: 'OBJECTIVE',
      nomScore: 'Hold Objective 1',
      valeurScore: 5,
    })

    const scoreId = new ScoreId(scoreModel.id)

    // Verify score exists
    const existsBefore = await queryRepository.exists(scoreId)
    assert.isTrue(existsBefore)

    // Act
    await commandRepository.delete(scoreId)

    // Assert
    const existsAfter = await queryRepository.exists(scoreId)
    assert.isFalse(existsAfter)
  })

  test('Command Repository - should delete scores by round ID', async ({ assert }) => {
    // Arrange
    const scoresData = [
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'OBJECTIVE',
        nomScore: 'Hold Objective 1',
        valeurScore: 5,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer2Id,
        typeScore: 'PRIMARY',
        nomScore: 'Control Objectives',
        valeurScore: 15,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'BONUS',
        nomScore: 'First Blood',
        valeurScore: 3,
      },
    ]

    for (const data of scoresData) {
      await ScoreModel.create(data)
    }

    // Verify scores exist
    const countBefore = await queryRepository.countByRound(new RoundId(testRoundId))
    assert.equal(countBefore, 3)

    // Act
    await commandRepository.deleteByRoundId(new RoundId(testRoundId))

    // Assert
    const countAfter = await queryRepository.countByRound(new RoundId(testRoundId))
    assert.equal(countAfter, 0)
  })

  test('Command Repository - should save batch of scores', async ({ assert }) => {
    // Arrange
    const scores = ScoreFactory.createForRound(
      new RoundId(testRoundId),
      new PlayerId(testPlayer1Id)
    )

    // Act
    const savedScores = await commandRepository.saveBatch(scores)

    // Assert
    assert.equal(savedScores.length, 6)

    const countAfter = await queryRepository.countByRound(new RoundId(testRoundId))
    assert.equal(countAfter, 6)
  })


  test('Database constraints - should enforce unique score per round-player-type-name combination', async ({
    assert,
  }) => {
    // Arrange
    await ScoreModel.create({
      roundId: testRoundId,
      joueurId: testPlayer1Id,
      typeScore: 'OBJECTIVE',
      nomScore: 'Hold Objective 1',
      valeurScore: 5,
    })

    // Act & Assert - Try to create another score with same combination
    try {
      await ScoreModel.create({
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'OBJECTIVE',
        nomScore: 'Hold Objective 1',
        valeurScore: 10,
      })
      assert.fail('Should have thrown constraint violation error')
    } catch (error) {
      assert.include(error.message.toLowerCase(), 'unique')
    }
  })

  test('Query Repository - should find top scoring players', async ({ assert }) => {
    // Arrange
    const scoresData = [
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'OBJECTIVE',
        nomScore: 'Hold Objective 1',
        valeurScore: 15,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer1Id,
        typeScore: 'BONUS',
        nomScore: 'First Blood',
        valeurScore: 5,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer2Id,
        typeScore: 'PRIMARY',
        nomScore: 'Control Objectives',
        valeurScore: 10,
      },
      {
        roundId: testRoundId,
        joueurId: testPlayer2Id,
        typeScore: 'SECONDARY',
        nomScore: 'Assassinate',
        valeurScore: 8,
      },
    ]

    for (const data of scoresData) {
      await ScoreModel.create(data)
    }

    // Act
    const topPlayers = await queryRepository.findTopScoringPlayers(2)

    // Assert
    assert.equal(topPlayers.length, 2)
    assert.equal(topPlayers[0].playerId, testPlayer1Id)
    assert.equal(topPlayers[0].totalScore, 20) // 15 + 5
    assert.equal(topPlayers[0].scoreCount, 2)
    assert.equal(topPlayers[1].playerId, testPlayer2Id)
    assert.equal(topPlayers[1].totalScore, 18) // 10 + 8
    assert.equal(topPlayers[1].scoreCount, 2)
  })
})
