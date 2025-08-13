import { test } from '@japa/runner'
import ScoreService from '#application/services/score_service'
import { AddScoreDto } from '#application/dto/add_score_dto'
import GameId from '#domain/value-objects/game_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import RoundNumber from '#domain/value-objects/round_number'
import ScoreId from '#domain/value-objects/score_id'
import ScoreName from '#domain/value-objects/score_name'
import ScoreType from '#domain/value-objects/score_type'
import ScoreValue from '#domain/value-objects/score_value'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import Pseudo from '#domain/value-objects/pseudo'
import Game from '#domain/entities/game'
import Round from '#domain/entities/round'
import Player from '#domain/entities/player'
import Score from '#domain/entities/score'
import { InvalidScoreTypeForServiceError } from '#domain/errors/invalid_score_type_for_service_error'
import { ScoreValueOutOfRangeError } from '#domain/errors/score_value_out_of_range_error'
import { SecondaryScoreNameRequiredError } from '#domain/errors/secondary_score_name_required_error'
import { ChallengerForbiddenInFirstRoundError } from '#domain/errors/challenger_forbidden_in_first_round_error'
import { UnauthorizedScoreAccessError } from '#domain/errors/unauthorized_score_access_error'
import { IdGenerator } from '#domain/services/id_generator'

// Mock repositories for TDD
class MockScoreRepository {
  private scores: Score[] = []

  async save(score: Score): Promise<Score> {
    this.scores.push(score)
    return score
  }

  async findById(id: ScoreId): Promise<Score | null> {
    return this.scores.find((s) => s.id.equals(id)) || null
  }

  async findByRoundId(roundId: RoundId): Promise<Score[]> {
    return this.scores.filter((s) => s.roundId.equals(roundId))
  }

  async findByRoundAndPlayer(roundId: RoundId, playerId: PlayerId): Promise<Score[]> {
    return this.scores.filter((s) => s.roundId.equals(roundId) && s.playerId.equals(playerId))
  }

  async existsChallengerInRound(roundId: RoundId): Promise<boolean> {
    return this.scores.some((s) => s.roundId.equals(roundId) && s.scoreType.value === 'CHALLENGER')
  }

  async findByPlayerInGame(playerId: PlayerId, _gameId: GameId): Promise<Score[]> {
    // Simulate joining with rounds to filter by gameId
    return this.scores.filter((s) => s.playerId.equals(playerId))
  }

  async findPlayersInGame(_gameId: GameId): Promise<PlayerId[]> {
    const playerIds = new Set<string>()
    this.scores.forEach((s) => playerIds.add(s.playerId.value.toString()))
    return Array.from(playerIds).map((id) => new PlayerId(Number(id)))
  }

  clear(): void {
    this.scores = []
  }

  addMockScore(score: Score): void {
    this.scores.push(score)
  }
}

class MockGameRepository {
  private games: Game[] = []

  async findById(id: GameId): Promise<Game | null> {
    return this.games.find((g) => g.id.equals(id)) || null
  }

  clear(): void {
    this.games = []
  }

  addMockGame(game: Game): void {
    this.games.push(game)
  }
}

class MockRoundRepository {
  private rounds: Round[] = []

  async findById(id: RoundId): Promise<Round | null> {
    return this.rounds.find((r) => r.id.equals(id)) || null
  }

  async findByGameIdAndNumber(gameId: GameId, roundNumber: RoundNumber): Promise<Round | null> {
    return (
      this.rounds.find((r) => r.gameId.equals(gameId) && r.roundNumber.equals(roundNumber)) || null
    )
  }

  async findPreviousRound(gameId: GameId, currentRoundNumber: RoundNumber): Promise<Round | null> {
    if (currentRoundNumber.value <= 1) return null

    const previousRoundNumber = new RoundNumber(currentRoundNumber.value - 1)
    return this.findByGameIdAndNumber(gameId, previousRoundNumber)
  }

  clear(): void {
    this.rounds = []
  }

  addMockRound(round: Round): void {
    this.rounds.push(round)
  }
}

class MockPlayerRepository {
  private players: Player[] = []

  async findByGameAndUser(gameId: GameId, userId: number): Promise<Player | null> {
    return this.players.find((p) => p.gameId.equals(gameId) && p.userId === userId) || null
  }

  clear(): void {
    this.players = []
  }

  addMockPlayer(player: Player): void {
    this.players.push(player)
  }
}

class MockIdGenerator implements IdGenerator {
  private scoreCounter = 1

  generateScoreId(): ScoreId {
    return new ScoreId(this.scoreCounter++)
  }
}

test.group('ScoreService (TDD)', (group) => {
  let scoreService: ScoreService
  let mockScoreRepository: MockScoreRepository
  let mockGameRepository: MockGameRepository
  let mockRoundRepository: MockRoundRepository
  let mockPlayerRepository: MockPlayerRepository
  let mockIdGenerator: MockIdGenerator

  group.setup(() => {
    mockScoreRepository = new MockScoreRepository()
    mockGameRepository = new MockGameRepository()
    mockRoundRepository = new MockRoundRepository()
    mockPlayerRepository = new MockPlayerRepository()
    mockIdGenerator = new MockIdGenerator()

    scoreService = new ScoreService(
      mockScoreRepository as any,
      mockGameRepository as any,
      mockRoundRepository as any,
      mockPlayerRepository as any,
      mockIdGenerator as any
    )
  })

  group.each.setup(() => {
    mockScoreRepository.clear()
    mockGameRepository.clear()
    mockRoundRepository.clear()
    mockPlayerRepository.clear()
  })

  test('should add PRIMARY score with owner authorization', async ({ assert }) => {
    // Arrange - TDD: This test will fail initially
    const gameId = new GameId(1)
    const ownerId = 123
    const game = Game.createNew(
      gameId,
      ownerId,
      GameType.fromValue('MATCHED_PLAY'),
      new PointsLimit(2000)
    )
    game.start()
    mockGameRepository.addMockGame(game)

    const roundId = new RoundId(1)
    const round = Round.createNew(roundId, gameId, new RoundNumber(2))
    mockRoundRepository.addMockRound(round)

    const playerId = new PlayerId(1)
    const player = Player.createForRegisteredUser(
      playerId,
      gameId,
      ownerId,
      new Pseudo('TestPlayer')
    )
    mockPlayerRepository.addMockPlayer(player)

    const addScoreDto: AddScoreDto = {
      roundId: '1',
      playerId: '1',
      scoreType: 'PRIMARY',
      scoreName: 'Victory Points',
      scoreValue: 12,
      requestingUserId: ownerId,
    }

    // Act - Call method that doesn't exist yet
    const result = await scoreService.addScore(addScoreDto)

    // Assert
    assert.equal(result.scoreType, 'PRIMARY')
    assert.equal(result.scoreValue, 12)
    assert.isTrue(result.canModify)
  })

  test('should add SECONDARY score with name validation', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const game = Game.createNew(
      gameId,
      ownerId,
      GameType.fromValue('MATCHED_PLAY'),
      new PointsLimit(2000)
    )
    game.start()
    mockGameRepository.addMockGame(game)

    const roundId = new RoundId(1)
    const round = Round.createNew(roundId, gameId, new RoundNumber(2))
    mockRoundRepository.addMockRound(round)

    const addScoreDto: AddScoreDto = {
      roundId: '1',
      playerId: '1',
      scoreType: 'SECONDARY',
      scoreName: 'Engage on All Fronts',
      scoreValue: 8,
      requestingUserId: ownerId,
    }

    // Act
    const result = await scoreService.addScore(addScoreDto)

    // Assert
    assert.equal(result.scoreType, 'SECONDARY')
    assert.equal(result.scoreName, 'Engage on All Fronts')
    assert.equal(result.scoreValue, 8)
  })

  test('should reject invalid score type', async ({ assert }) => {
    // Arrange
    const addScoreDto = {
      roundId: '1',
      playerId: '1',
      scoreType: 'OBJECTIVE', // Not allowed in ScoreService
      scoreName: 'Test',
      scoreValue: 5,
      requestingUserId: 123,
    }

    // Act & Assert
    try {
      await scoreService.addScore(addScoreDto as any)
      assert.fail('Should have thrown InvalidScoreTypeForServiceError')
    } catch (error) {
      assert.instanceOf(error, InvalidScoreTypeForServiceError)
    }
  })

  test('should reject score value out of range', async ({ assert }) => {
    // Arrange
    const addScoreDto: AddScoreDto = {
      roundId: '1',
      playerId: '1',
      scoreType: 'PRIMARY',
      scoreName: 'Test',
      scoreValue: 16, // Over limit
      requestingUserId: 123,
    }

    // Act & Assert
    try {
      await scoreService.addScore(addScoreDto)
      assert.fail('Should have thrown ScoreValueOutOfRangeError')
    } catch (error) {
      assert.instanceOf(error, ScoreValueOutOfRangeError)
    }
  })

  test('should reject SECONDARY without name', async ({ assert }) => {
    // Arrange
    const addScoreDto: AddScoreDto = {
      roundId: '1',
      playerId: '1',
      scoreType: 'SECONDARY',
      scoreName: '', // Empty name
      scoreValue: 5,
      requestingUserId: 123,
    }

    // Act & Assert
    try {
      await scoreService.addScore(addScoreDto)
      assert.fail('Should have thrown SecondaryScoreNameRequiredError')
    } catch (error) {
      assert.instanceOf(error, SecondaryScoreNameRequiredError)
    }
  })

  test('should reject CHALLENGER in first round', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const game = Game.createNew(
      gameId,
      ownerId,
      GameType.fromValue('MATCHED_PLAY'),
      new PointsLimit(2000)
    )
    game.start()
    mockGameRepository.addMockGame(game)

    const roundId = new RoundId(1)
    const round = Round.createNew(roundId, gameId, new RoundNumber(1)) // Round 1
    mockRoundRepository.addMockRound(round)

    const addScoreDto: AddScoreDto = {
      roundId: '1',
      playerId: '1',
      scoreType: 'CHALLENGER',
      scoreName: 'Deficit Recovery',
      scoreValue: 5,
      requestingUserId: ownerId,
    }

    // Act & Assert
    try {
      await scoreService.addScore(addScoreDto)
      assert.fail('Should have thrown ChallengerForbiddenInFirstRoundError')
    } catch (error) {
      assert.instanceOf(error, ChallengerForbiddenInFirstRoundError)
    }
  })

  test('should reject unauthorized user', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const unauthorizedUserId = 999

    const game = Game.createNew(
      gameId,
      ownerId,
      GameType.fromValue('MATCHED_PLAY'),
      new PointsLimit(2000)
    )
    game.start()
    mockGameRepository.addMockGame(game)

    const roundId = new RoundId(1)
    const round = Round.createNew(roundId, gameId, new RoundNumber(2))
    mockRoundRepository.addMockRound(round)

    const addScoreDto: AddScoreDto = {
      roundId: '1',
      playerId: '1',
      scoreType: 'PRIMARY',
      scoreName: 'Test',
      scoreValue: 5,
      requestingUserId: unauthorizedUserId,
    }

    // Act & Assert
    try {
      await scoreService.addScore(addScoreDto)
      assert.fail('Should have thrown UnauthorizedScoreAccessError')
    } catch (error) {
      assert.instanceOf(error, UnauthorizedScoreAccessError)
    }
  })

  test('should list scores for a round', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const game = Game.createNew(
      gameId,
      ownerId,
      GameType.fromValue('MATCHED_PLAY'),
      new PointsLimit(2000)
    )
    game.start()
    mockGameRepository.addMockGame(game)

    const roundId = new RoundId(1)
    const round = Round.createNew(roundId, gameId, new RoundNumber(2))
    mockRoundRepository.addMockRound(round)

    // Act - Call method that doesn't exist yet
    const result = await scoreService.listScores('1')

    // Assert
    assert.isArray(result.scores)
    assert.equal(result.pagination.total, 0) // No scores initially
    assert.isFalse(result.pagination.hasMore)
  })

  test('should calculate player total across game', async ({ assert }) => {
    // Arrange
    const playerId = new PlayerId(1)

    // Mock some scores for calculation
    const primaryScore = Score.create({
      roundId: new RoundId(1),
      playerId,
      scoreType: new ScoreType('PRIMARY'),
      scoreName: new ScoreName('Victory Points'),
      scoreValue: new ScoreValue(10),
      idGenerator: mockIdGenerator,
    })

    const secondaryScore = Score.create({
      roundId: new RoundId(2),
      playerId,
      scoreType: new ScoreType('SECONDARY'),
      scoreName: new ScoreName('Engage'),
      scoreValue: new ScoreValue(5),
      idGenerator: mockIdGenerator,
    })

    mockScoreRepository.addMockScore(primaryScore)
    mockScoreRepository.addMockScore(secondaryScore)

    // Act - Call method that doesn't exist yet
    const result = await scoreService.getTotal('1', '1')

    // Assert
    assert.equal(result.totalScore, 15)
    assert.equal(result.breakdown.primary, 10)
    assert.equal(result.breakdown.secondary, 5)
    assert.equal(result.breakdown.challenger, 0)
    assert.equal(result.scoreCount, 2)
  })
})
