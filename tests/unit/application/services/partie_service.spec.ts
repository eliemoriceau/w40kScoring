import { test } from '@japa/runner'
import GameService from '#application/services/game_service'
import { CreatePartieDto } from '#application/dto/create_partie_dto'
import { PartieFilterDto } from '#application/dto/partie_filter_dto'
import GameId from '#domain/value-objects/game_id'
import Game from '#domain/entities/game'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'

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

  async findAllWithFilters(filters: PartieFilterDto): Promise<Game[]> {
    // Basic filtering for test purposes
    let filtered = [...this.games]

    if (filters.userId) {
      filtered = filtered.filter((g) => g.userId === filters.userId)
    }

    return filtered
  }

  async delete(id: GameId): Promise<void> {
    this.games = this.games.filter((g) => !g.id.equals(id))
  }

  clear(): void {
    this.games = []
  }
}

class MockPlayerRepository {
  async save(player: any): Promise<any> {
    return player
  }
  async findByGameId(): Promise<any[]> {
    return []
  }
  async delete(): Promise<void> {}
}

class MockRoundRepository {
  async save(round: any): Promise<any> {
    return round
  }
  async findByGameId(): Promise<any[]> {
    return []
  }
  async delete(): Promise<void> {}
}

class MockScoreRepository {
  async save(score: any): Promise<any> {
    return score
  }
  async findByRoundId(): Promise<any[]> {
    return []
  }
  async delete(): Promise<void> {}
}

class MockIdGenerator {
  generateScoreId() {
    return { value: Math.floor(Math.random() * 1000000) }
  }
}

test.group('PartieService (TDD)', (group) => {
  let gameService: GameService
  let mockGameRepository: MockGameRepository
  let mockPlayerRepository: MockPlayerRepository
  let mockRoundRepository: MockRoundRepository
  let mockScoreRepository: MockScoreRepository
  let mockIdGenerator: MockIdGenerator

  group.setup(() => {
    mockGameRepository = new MockGameRepository()
    mockPlayerRepository = new MockPlayerRepository()
    mockRoundRepository = new MockRoundRepository()
    mockScoreRepository = new MockScoreRepository()
    mockIdGenerator = new MockIdGenerator()

    gameService = new GameService(
      mockGameRepository as any,
      mockPlayerRepository as any,
      mockRoundRepository as any,
      mockScoreRepository as any,
      mockIdGenerator as any
    )
  })

  group.each.setup(() => {
    mockGameRepository.clear()
  })

  test('should create partie with valid data', async ({ assert }) => {
    // Arrange - TDD: This test will fail initially
    const createDto: CreatePartieDto = {
      userId: 1,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      mission: 'Secure and Control',
    }

    // Act - Call method that doesn't exist yet
    const result = await gameService.createPartie(createDto)

    // Assert - Define expected behavior
    assert.isNotNull(result)
    assert.equal(result.userId, 1)
    assert.equal(result.gameType, 'MATCHED_PLAY')
    assert.equal(result.pointsLimit, 2000)
    assert.equal(result.status, 'PLANNED')
    assert.equal(result.mission, 'Secure and Control')
    assert.isString(result.id)
    assert.instanceOf(result.createdAt, Date)
  })

  test('should get partie by id', async ({ assert }) => {
    // Arrange - Create a game first
    const gameId = new GameId(1)
    const game = Game.createNew(
      gameId,
      1,
      GameType.fromValue('MATCHED_PLAY'),
      new PointsLimit(2000)
    )
    await mockGameRepository.save(game)

    // Act - Call method that doesn't exist yet
    const result = await gameService.getPartie(gameId)

    // Assert
    assert.isNotNull(result)
    assert.equal(result!.id, '1')
    assert.equal(result!.userId, 1)
    assert.equal(result!.status, 'PLANNED')
  })

  test('should return null when partie not found', async ({ assert }) => {
    // Arrange
    const nonExistentId = new GameId(999)

    // Act
    const result = await gameService.getPartie(nonExistentId)

    // Assert
    assert.isNull(result)
  })

  test('should list parties with filters', async ({ assert }) => {
    // Arrange - Create test data
    const gameId1 = new GameId(1)
    const gameId2 = new GameId(2)
    const game1 = Game.createNew(
      gameId1,
      1,
      GameType.fromValue('MATCHED_PLAY'),
      new PointsLimit(2000)
    )
    const game2 = Game.createNew(gameId2, 2, GameType.fromValue('NARRATIVE'), new PointsLimit(1000))

    await mockGameRepository.save(game1)
    await mockGameRepository.save(game2)

    const filters: PartieFilterDto = {
      userId: 1,
      limit: 10,
    }

    // Act - Call method that doesn't exist yet
    const result = await gameService.listParties(filters)

    // Assert
    assert.isObject(result)
    assert.isArray(result.parties)
    assert.containsSubset(result.pagination, {
      hasMore: false,
    })
    assert.isObject(result.filters)
  })

  test('should delete partie and cascade related entities', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const game = Game.createNew(
      gameId,
      1,
      GameType.fromValue('MATCHED_PLAY'),
      new PointsLimit(2000)
    )
    await mockGameRepository.save(game)

    // Act - Call method that doesn't exist yet
    await gameService.deletePartie(gameId)

    // Assert - Game should be deleted
    const deletedGame = await mockGameRepository.findById(gameId)
    assert.isNull(deletedGame)
  })

  test('should update partie status', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const game = Game.createNew(
      gameId,
      1,
      GameType.fromValue('MATCHED_PLAY'),
      new PointsLimit(2000)
    )
    await mockGameRepository.save(game)

    // Act - Call method that doesn't exist yet
    const result = await gameService.updatePartieStatus(gameId, 'IN_PROGRESS')

    // Assert
    assert.isNotNull(result)
    assert.equal(result.status, 'IN_PROGRESS')
    assert.instanceOf(result.startedAt, Date)
  })

  test('should validate create partie dto', async ({ assert }) => {
    // Arrange - Invalid data
    const invalidDto = {
      userId: -1, // Invalid
      gameType: '', // Invalid
      pointsLimit: 0, // Invalid
    } as CreatePartieDto

    // Act & Assert - Should throw validation error
    await assert.rejects(
      () => gameService.createPartie(invalidDto),
      'User ID must be a positive integer'
    )
  })

  test('should handle cursor-based pagination', async ({ assert }) => {
    // Arrange - Create multiple games
    const games = Array.from({ length: 5 }, (_, i) => {
      const gameId = new GameId(i + 1)
      return Game.createNew(gameId, 1, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    })

    for (const game of games) {
      await mockGameRepository.save(game)
    }

    const filters: PartieFilterDto = {
      limit: 2,
    }

    // Act
    const firstPage = await gameService.listParties(filters)

    // Assert first page
    assert.equal(firstPage.parties.length, 2)
    assert.isTrue(firstPage.pagination.hasMore)
    assert.isString(firstPage.pagination.nextCursor)

    // Act - Get second page
    const secondPageFilters: PartieFilterDto = {
      limit: 2,
      cursor: firstPage.pagination.nextCursor,
    }
    const secondPage = await gameService.listParties(secondPageFilters)

    // Assert second page
    assert.equal(secondPage.parties.length, 2)
    assert.isTrue(secondPage.pagination.hasMore)
  })

  test('should filter parties by status', async ({ assert }) => {
    // Arrange - Create games with different statuses
    const plannedGame = Game.createNew(
      new GameId(1),
      1,
      GameType.fromValue('MATCHED_PLAY'),
      new PointsLimit(2000)
    )

    const inProgressGame = Game.createNew(
      new GameId(2),
      1,
      GameType.fromValue('MATCHED_PLAY'),
      new PointsLimit(2000)
    )
    inProgressGame.start('Test Mission')

    await mockGameRepository.save(plannedGame)
    await mockGameRepository.save(inProgressGame)

    const filters: PartieFilterDto = {
      status: ['PLANNED'],
    }

    // Act
    const result = await gameService.listParties(filters)

    // Assert - Should only return planned games
    assert.equal(result.parties.length, 1)
    assert.equal(result.parties[0].status, 'PLANNED')
  })
})
