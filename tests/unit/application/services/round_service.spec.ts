import { test } from '@japa/runner'
import RoundService from '#application/services/round_service'
import { UpdateRoundScoresDto } from '#application/dto/update_round_scores_dto'
import { CompleteRoundDto } from '#application/dto/complete_round_dto'
import GameId from '#domain/value-objects/game_id'
import RoundId from '#domain/value-objects/round_id'
import RoundNumber from '#domain/value-objects/round_number'
import GameStatus from '#domain/value-objects/game_status'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import Game from '#domain/entities/game'
import Round from '#domain/entities/round'
import Player from '#domain/entities/player'
import PlayerId from '#domain/value-objects/player_id'
import Pseudo from '#domain/value-objects/pseudo'
import { GameNotInProgressError } from '#domain/errors/game_not_in_progress_error'
import { RoundNotFoundError } from '#domain/errors/round_not_found_error'
import { RoundAlreadyCompletedError } from '#domain/errors/round_already_completed_error'
import { UnauthorizedRoundAccessError } from '#domain/errors/unauthorized_round_access_error'

// Mock repositories and dependencies
class MockGameRepository {
  private games: Game[] = []

  async save(game: Game): Promise<Game> {
    this.games.push(game)
    return game
  }

  async findById(id: GameId): Promise<Game | null> {
    return this.games.find((g) => g.id.equals(id)) || null
  }

  async findAll(): Promise<Game[]> {
    return [...this.games]
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

  async save(round: Round): Promise<Round> {
    this.rounds.push(round)
    return round
  }

  async findById(id: RoundId): Promise<Round | null> {
    return this.rounds.find((r) => r.id.equals(id)) || null
  }

  async findByGameId(gameId: GameId): Promise<Round[]> {
    return this.rounds.filter((r) => r.gameId.equals(gameId))
  }

  async findByGameIdAndNumber(gameId: GameId, roundNumber: RoundNumber): Promise<Round | null> {
    return this.rounds.find((r) => 
      r.gameId.equals(gameId) && r.roundNumber.equals(roundNumber)
    ) || null
  }

  async delete(id: RoundId): Promise<void> {
    this.rounds = this.rounds.filter((r) => !r.id.equals(id))
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

  async save(player: Player): Promise<Player> {
    this.players.push(player)
    return player
  }

  clear(): void {
    this.players = []
  }

  addMockPlayer(player: Player): void {
    this.players.push(player)
  }
}

class MockIdGenerator {
  private counter = 1

  generateRoundId(): RoundId {
    return new RoundId(this.counter++)
  }
}

test.group('RoundService (TDD)', (group) => {
  let roundService: RoundService
  let mockGameRepository: MockGameRepository
  let mockRoundRepository: MockRoundRepository
  let mockPlayerRepository: MockPlayerRepository
  let mockIdGenerator: MockIdGenerator

  group.setup(() => {
    mockGameRepository = new MockGameRepository()
    mockRoundRepository = new MockRoundRepository()
    mockPlayerRepository = new MockPlayerRepository()
    mockIdGenerator = new MockIdGenerator()

    roundService = new RoundService(
      mockRoundRepository as any,
      mockGameRepository as any,
      mockPlayerRepository as any,
      mockIdGenerator as any
    )
  })

  group.each.setup(() => {
    mockGameRepository.clear()
    mockRoundRepository.clear()
    mockPlayerRepository.clear()
  })

  test('should update round scores with owner authorization', async ({ assert }) => {
    // Arrange - TDD: This test will fail initially
    const gameId = new GameId(1)
    const ownerId = 123
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    game.start()
    mockGameRepository.addMockGame(game)

    // Create round 2
    const roundId = new RoundId(1)
    const round = Round.createNew(roundId, gameId, new RoundNumber(2))
    mockRoundRepository.addMockRound(round)

    const updateDto: UpdateRoundScoresDto = {
      gameId: '1',
      roundNumber: 2,
      playerScore: 15,
      opponentScore: 12,
      requestingUserId: ownerId,
    }

    // Act - Call method that doesn't exist yet
    const result = await roundService.updateRoundScores(updateDto)

    // Assert - Define expected behavior
    assert.isNotNull(result)
    assert.equal(result.gameId, '1')
    assert.equal(result.roundNumber, 2)
    assert.equal(result.playerScore, 15)
    assert.equal(result.opponentScore, 12)
    assert.equal(result.winner, 'PLAYER')
    assert.isFalse(result.isCompleted)
    assert.isTrue(result.canModify)
  })

  test('should update round scores with participant authorization', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const participantId = 456
    
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    game.start()
    mockGameRepository.addMockGame(game)

    // Add participant as player
    const player = Player.createForRegisteredUser(
      new PlayerId(1),
      gameId,
      participantId,
      new Pseudo('Participant')
    )
    mockPlayerRepository.addMockPlayer(player)

    const round = Round.createNew(new RoundId(1), gameId, new RoundNumber(1))
    mockRoundRepository.addMockRound(round)

    const updateDto: UpdateRoundScoresDto = {
      gameId: '1',
      roundNumber: 1,
      playerScore: 8,
      opponentScore: 10,
      requestingUserId: participantId,
    }

    // Act
    const result = await roundService.updateRoundScores(updateDto)

    // Assert
    assert.equal(result.playerScore, 8)
    assert.equal(result.opponentScore, 10)
    assert.equal(result.winner, 'OPPONENT')
  })

  test('should throw GameNotInProgressError for completed game', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    // Game is not started - should be in PLANNED state
    mockGameRepository.addMockGame(game)

    const round = Round.createNew(new RoundId(1), gameId, new RoundNumber(1))
    mockRoundRepository.addMockRound(round)

    const updateDto: UpdateRoundScoresDto = {
      gameId: '1',
      roundNumber: 1,
      playerScore: 5,
      opponentScore: 3,
      requestingUserId: ownerId,
    }

    // Act & Assert
    try {
      await roundService.updateRoundScores(updateDto)
      assert.fail('Should have thrown GameNotInProgressError')
    } catch (error) {
      assert.instanceOf(error, GameNotInProgressError)
    }
  })

  test('should throw RoundAlreadyCompletedError for completed round', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    game.start()
    mockGameRepository.addMockGame(game)

    const round = Round.createNew(new RoundId(1), gameId, new RoundNumber(1))
    round.completeRound(10, 8) // Already completed
    mockRoundRepository.addMockRound(round)

    const updateDto: UpdateRoundScoresDto = {
      gameId: '1',
      roundNumber: 1,
      playerScore: 15,
      opponentScore: 12,
      requestingUserId: ownerId,
    }

    // Act & Assert
    try {
      await roundService.updateRoundScores(updateDto)
      assert.fail('Should have thrown RoundAlreadyCompletedError')
    } catch (error) {
      assert.instanceOf(error, RoundAlreadyCompletedError)
    }
  })

  test('should throw UnauthorizedRoundAccessError for unauthorized user', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const unauthorizedUserId = 999
    
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    game.start()
    mockGameRepository.addMockGame(game)

    const round = Round.createNew(new RoundId(1), gameId, new RoundNumber(1))
    mockRoundRepository.addMockRound(round)

    const updateDto: UpdateRoundScoresDto = {
      gameId: '1',
      roundNumber: 1,
      playerScore: 5,
      opponentScore: 3,
      requestingUserId: unauthorizedUserId,
    }

    // Act & Assert
    try {
      await roundService.updateRoundScores(updateDto)
      assert.fail('Should have thrown UnauthorizedRoundAccessError')
    } catch (error) {
      assert.instanceOf(error, UnauthorizedRoundAccessError)
    }
  })

  test('should throw RoundNotFoundError for non-existent round', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    game.start()
    mockGameRepository.addMockGame(game)

    // No round added to repository

    const updateDto: UpdateRoundScoresDto = {
      gameId: '1',
      roundNumber: 1,
      playerScore: 5,
      opponentScore: 3,
      requestingUserId: ownerId,
    }

    // Act & Assert
    try {
      await roundService.updateRoundScores(updateDto)
      assert.fail('Should have thrown RoundNotFoundError')
    } catch (error) {
      assert.instanceOf(error, RoundNotFoundError)
    }
  })

  test('should complete round successfully', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    game.start()
    mockGameRepository.addMockGame(game)

    const round = Round.createNew(new RoundId(1), gameId, new RoundNumber(3))
    round.updateScores(20, 15) // Set scores first
    mockRoundRepository.addMockRound(round)

    const completeDto: CompleteRoundDto = {
      gameId: '1',
      roundNumber: 3,
      requestingUserId: ownerId,
    }

    // Act - Call method that doesn't exist yet
    const result = await roundService.completeRound(completeDto)

    // Assert
    assert.isTrue(result.isCompleted)
    assert.equal(result.playerScore, 20)
    assert.equal(result.opponentScore, 15)
    assert.equal(result.winner, 'PLAYER')
    assert.isFalse(result.canModify)
  })

  test('should list rounds for authorized user', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    game.start()
    mockGameRepository.addMockGame(game)

    // Add multiple rounds
    const round1 = Round.createNew(new RoundId(1), gameId, new RoundNumber(1))
    const round2 = Round.createNew(new RoundId(2), gameId, new RoundNumber(2))
    round2.completeRound(10, 8) // One completed
    
    mockRoundRepository.addMockRound(round1)
    mockRoundRepository.addMockRound(round2)

    // Act - Call method that doesn't exist yet
    const result = await roundService.listRounds('1', ownerId)

    // Assert
    assert.isArray(result.rounds)
    assert.equal(result.rounds.length, 2)
    assert.equal(result.pagination.total, 2)
    assert.isFalse(result.pagination.hasMore)
    
    // Check ordering
    assert.equal(result.rounds[0].roundNumber, 1)
    assert.equal(result.rounds[1].roundNumber, 2)
    
    // Check completion status
    assert.isFalse(result.rounds[0].isCompleted)
    assert.isTrue(result.rounds[1].isCompleted)
  })

  test('should be idempotent for completing already completed round', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    game.start()
    mockGameRepository.addMockGame(game)

    const round = Round.createNew(new RoundId(1), gameId, new RoundNumber(1))
    round.completeRound(12, 9) // Already completed
    mockRoundRepository.addMockRound(round)

    const completeDto: CompleteRoundDto = {
      gameId: '1',
      roundNumber: 1,
      requestingUserId: ownerId,
    }

    // Act - Should not throw error, should be idempotent
    const result = await roundService.completeRound(completeDto)

    // Assert
    assert.isTrue(result.isCompleted)
    assert.equal(result.playerScore, 12)
    assert.equal(result.opponentScore, 9)
  })
})