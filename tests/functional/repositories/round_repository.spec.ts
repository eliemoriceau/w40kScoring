import { test } from '@japa/runner'
import { RoundFactory } from '#tests/helpers/round_factory'
import LucidRoundQueryRepository from '#infrastructure/repositories/lucid_round_query_repository'
import LucidRoundCommandRepository from '#infrastructure/repositories/lucid_round_command_repository'
import LucidRoundRepository from '#infrastructure/repositories/lucid_round_repository'
import RoundId from '#domain/value-objects/round_id'
import GameId from '#domain/value-objects/game_id'
import RoundNumber from '#domain/value-objects/round_number'
import RoundModel from '#models/round'
import GameModel from '#models/game'

test.group('Round Repository Integration', (group) => {
  let queryRepository: LucidRoundQueryRepository
  let commandRepository: LucidRoundCommandRepository
  let combinedRepository: LucidRoundRepository

  group.setup(async () => {
    // Initialize repositories
    queryRepository = new LucidRoundQueryRepository()
    commandRepository = new LucidRoundCommandRepository()
    combinedRepository = new LucidRoundRepository()
  })

  group.each.setup(async () => {
    // Create test game in each test
    await GameModel.create({
      id: 1,
      userId: 123,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      status: 'PLANNED',
      playerScore: null,
      opponentScore: null,
      mission: null,
      notes: '',
    })
  })

  group.each.teardown(async () => {
    // Clean up test data
    await RoundModel.query().delete()
    await GameModel.query().delete()
  })

  test('Command Repository - should save and retrieve a round', async ({ assert }) => {
    // Arrange
    const round = RoundFactory.createNew({
      gameId: new GameId(1),
      roundNumber: new RoundNumber(1),
    })

    // Act
    const savedRound = await commandRepository.save(round)

    // Assert
    assert.isTrue(savedRound.gameId.equals(new GameId(1)))
    assert.isTrue(savedRound.roundNumber.equals(new RoundNumber(1)))
    assert.equal(savedRound.playerScore, 0)
    assert.equal(savedRound.opponentScore, 0)
    assert.isFalse(savedRound.isCompleted)

    // Verify in database
    const roundModel = await RoundModel.query().where('gameId', 1).first()
    assert.isNotNull(roundModel)
    assert.equal(roundModel!.gameId, 1)
    assert.equal(roundModel!.roundNumber, 1)
  })

  test('Command Repository - should save completed round', async ({ assert }) => {
    // Arrange
    const round = RoundFactory.createCompleted(15, 12, {
      gameId: new GameId(1),
      roundNumber: new RoundNumber(2),
    })

    // Act
    const savedRound = await commandRepository.save(round)

    // Assert
    assert.equal(savedRound.playerScore, 15)
    assert.equal(savedRound.opponentScore, 12)
    assert.isTrue(savedRound.isCompleted)
  })

  test('Query Repository - should find round by ID', async ({ assert }) => {
    // Arrange
    await RoundModel.create({
      id: 1,
      gameId: 1,
      roundNumber: 3,
      playerScore: 10,
      opponentScore: 8,
      isCompleted: true,
    })

    // Act
    const foundRound = await queryRepository.findById(new RoundId(1))

    // Assert
    assert.isNotNull(foundRound)
    assert.isTrue(foundRound!.id.equals(new RoundId(1)))
    assert.isTrue(foundRound!.roundNumber.equals(new RoundNumber(3)))
    assert.equal(foundRound!.playerScore, 10)
    assert.equal(foundRound!.opponentScore, 8)
  })

  test('Query Repository - should return null for non-existent round', async ({ assert }) => {
    // Act
    const foundRound = await queryRepository.findById(new RoundId(999))

    // Assert
    assert.isNull(foundRound)
  })

  test('Query Repository - should find rounds by game ID', async ({ assert }) => {
    // Arrange
    const roundsData = [
      { gameId: 1, roundNumber: 1, playerScore: 5, opponentScore: 3 },
      { gameId: 1, roundNumber: 2, playerScore: 8, opponentScore: 12 },
      { gameId: 1, roundNumber: 3, playerScore: 15, opponentScore: 10 },
    ]

    for (const data of roundsData) {
      await RoundModel.create(data)
    }

    // Act
    const foundRounds = await queryRepository.findByGameId(new GameId(1))

    // Assert
    assert.equal(foundRounds.length, 3)
    foundRounds.forEach((round, index) => {
      assert.isTrue(round.gameId.equals(new GameId(1)))
      assert.equal(round.roundNumber.value, index + 1)
    })
  })

  test('Query Repository - should find round by game and number', async ({ assert }) => {
    // Arrange
    await RoundModel.create({
      gameId: 1,
      roundNumber: 2,
      playerScore: 12,
      opponentScore: 10,
      isCompleted: true,
    })

    // Act
    const foundRound = await queryRepository.findByGameIdAndNumber(
      new GameId(1),
      new RoundNumber(2)
    )

    // Assert
    assert.isNotNull(foundRound)
    assert.isTrue(foundRound!.roundNumber.equals(new RoundNumber(2)))
    assert.equal(foundRound!.playerScore, 12)
    assert.isTrue(foundRound!.isCompleted)
  })

  test('Query Repository - should count completed rounds', async ({ assert }) => {
    // Arrange
    const roundsData = [
      { id: 1, gameId: 1, roundNumber: 1, isCompleted: true },
      { id: 2, gameId: 1, roundNumber: 2, isCompleted: false },
      { id: 3, gameId: 1, roundNumber: 3, isCompleted: true },
    ]

    for (const data of roundsData) {
      await RoundModel.create(data)
    }

    // Act
    const completedCount = await queryRepository.countCompletedRoundsByGame(new GameId(1))
    const totalCount = await queryRepository.countRoundsByGame(new GameId(1))

    // Assert
    assert.equal(completedCount, 2)
    assert.equal(totalCount, 3)
  })

  test('Query Repository - should find latest round', async ({ assert }) => {
    // Arrange
    const roundsData = [
      { id: 1, gameId: 1, roundNumber: 1 },
      { id: 2, gameId: 1, roundNumber: 3 },
      { id: 3, gameId: 1, roundNumber: 2 },
    ]

    for (const data of roundsData) {
      await RoundModel.create(data)
    }

    // Act
    const latestRound = await queryRepository.findLatestRoundForGame(new GameId(1))

    // Assert
    assert.isNotNull(latestRound)
    assert.equal(latestRound!.roundNumber.value, 3)
  })

  test('Query Repository - should get round stats', async ({ assert }) => {
    // Arrange
    const roundsData = [
      { gameId: 1, roundNumber: 1, playerScore: 15, opponentScore: 10, isCompleted: true },
      { gameId: 1, roundNumber: 2, playerScore: 8, opponentScore: 12, isCompleted: true },
      { gameId: 1, roundNumber: 3, playerScore: 10, opponentScore: 10, isCompleted: true },
      { gameId: 1, roundNumber: 4, playerScore: 5, opponentScore: 3, isCompleted: false },
    ]

    for (const data of roundsData) {
      await RoundModel.create(data)
    }

    // Act
    const stats = await queryRepository.getRoundStatsByGame(new GameId(1))

    // Assert
    assert.equal(stats.totalRounds, 4)
    assert.equal(stats.completedRounds, 3)
    assert.equal(stats.totalPlayerScore, 33) // 15 + 8 + 10
    assert.equal(stats.totalOpponentScore, 32) // 10 + 12 + 10
    assert.equal(stats.playerWins, 1) // Round 1
    assert.equal(stats.opponentWins, 1) // Round 2
    assert.equal(stats.draws, 1) // Round 3
  })

  test('Command Repository - should delete round by ID', async ({ assert }) => {
    // Arrange
    const roundModel = await RoundModel.create({
      id: 1,
      gameId: 1,
      roundNumber: 1,
      playerScore: 10,
      opponentScore: 8,
      isCompleted: true,
    })

    const roundId = new RoundId(roundModel.id)

    // Verify round exists
    const existsBefore = await queryRepository.exists(roundId)
    assert.isTrue(existsBefore)

    // Act
    await commandRepository.delete(roundId)

    // Assert
    const existsAfter = await queryRepository.exists(roundId)
    assert.isFalse(existsAfter)
  })

  test('Command Repository - should delete rounds by game ID', async ({ assert }) => {
    // Arrange
    const roundsData = [
      { id: 1, gameId: 1, roundNumber: 1 },
      { id: 2, gameId: 1, roundNumber: 2 },
      { id: 3, gameId: 1, roundNumber: 3 },
    ]

    for (const data of roundsData) {
      await RoundModel.create(data)
    }

    // Verify rounds exist
    const countBefore = await queryRepository.countRoundsByGame(new GameId(1))
    assert.equal(countBefore, 3)

    // Act
    await commandRepository.deleteByGameId(new GameId(1))

    // Assert
    const countAfter = await queryRepository.countRoundsByGame(new GameId(1))
    assert.equal(countAfter, 0)
  })

  test('Command Repository - should save batch of rounds', async ({ assert }) => {
    // Arrange
    const rounds = RoundFactory.createForGame(new GameId(1), 3)

    // Act
    const savedRounds = await commandRepository.saveBatch(rounds)

    // Assert
    assert.equal(savedRounds.length, 3)

    const countAfter = await queryRepository.countRoundsByGame(new GameId(1))
    assert.equal(countAfter, 3)
  })

  test('Combined Repository - should provide both query and command functionality', async ({
    assert,
  }) => {
    // Arrange
    const round = RoundFactory.createNew({
      gameId: new GameId(1),
      roundNumber: new RoundNumber(1),
    })

    // Act - Command operation
    await combinedRepository.save(round)

    // Act - Query operation
    const foundRound = await combinedRepository.findByGameIdAndNumber(
      new GameId(1),
      new RoundNumber(1)
    )

    // Assert
    assert.isNotNull(foundRound)
    assert.isTrue(foundRound!.roundNumber.equals(new RoundNumber(1)))

    // Act - Delete operation
    await combinedRepository.delete(foundRound!.id)

    const exists = await combinedRepository.exists(foundRound!.id)
    assert.isFalse(exists)
  })

  test('Database constraints - should enforce unique game-round combination', async ({
    assert,
  }) => {
    // Arrange
    await RoundModel.create({
      gameId: 1,
      roundNumber: 1,
      playerScore: 10,
      opponentScore: 8,
    })

    // Act & Assert - Try to create another round with same game and round number
    try {
      await RoundModel.create({
        gameId: 1,
        roundNumber: 1,
        playerScore: 15,
        opponentScore: 12,
      })
      assert.fail('Should have thrown constraint violation error')
    } catch (error) {
      assert.include(error.message.toLowerCase(), 'unique')
    }
  })
})
