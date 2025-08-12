import { test } from '@japa/runner'
import JoueurService from '#application/services/joueur_service'
import { AddJoueurDto } from '#application/dto/add_joueur_dto'
import GameId from '#domain/value-objects/game_id'
import PlayerId from '#domain/value-objects/player_id'
import Game from '#domain/entities/game'
import Player from '#domain/entities/player'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import Pseudo from '#domain/value-objects/pseudo'
import { PseudoAlreadyTakenError } from '#domain/errors/pseudo_already_taken_error'
import { PartieNotFoundError } from '#domain/errors/partie_not_found_error'
import { UnauthorizedPartieAccessError } from '#domain/errors/unauthorized_partie_access_error'

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

class MockPlayerRepository {
  private players: Player[] = []

  async save(player: Player): Promise<Player> {
    this.players.push(player)
    return player
  }

  async findById(id: PlayerId): Promise<Player | null> {
    return this.players.find((p) => p.id.equals(id)) || null
  }

  async findByGameId(gameId: GameId): Promise<Player[]> {
    return this.players.filter((p) => p.gameId.equals(gameId))
  }

  async findByGameAndUser(gameId: GameId, userId: number): Promise<Player | null> {
    return this.players.find((p) => p.gameId.equals(gameId) && p.userId === userId) || null
  }

  async isPseudoTakenInGame(gameId: GameId, pseudo: string): Promise<boolean> {
    return this.players.some(
      (p) => p.gameId.equals(gameId) && p.pseudo.value.toLowerCase() === pseudo.toLowerCase()
    )
  }

  async delete(id: PlayerId): Promise<void> {
    this.players = this.players.filter((p) => !p.id.equals(id))
  }

  clear(): void {
    this.players = []
  }
}

class MockIdGenerator {
  private counter = 1

  generatePlayerId(): PlayerId {
    return new PlayerId(this.counter++)
  }
}

test.group('JoueurService (TDD)', (group) => {
  let joueurService: JoueurService
  let mockGameRepository: MockGameRepository
  let mockPlayerRepository: MockPlayerRepository
  let mockIdGenerator: MockIdGenerator

  group.setup(() => {
    mockGameRepository = new MockGameRepository()
    mockPlayerRepository = new MockPlayerRepository()
    mockIdGenerator = new MockIdGenerator()

    joueurService = new JoueurService(
      mockPlayerRepository as any,
      mockGameRepository as any,
      mockIdGenerator as any
    )
  })

  group.each.setup(() => {
    mockGameRepository.clear()
    mockPlayerRepository.clear()
  })

  test('should add joueur with valid data and owner authorization', async ({ assert }) => {
    // Arrange - TDD: This test will fail initially
    const gameId = new GameId(1)
    const ownerId = 123
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    mockGameRepository.addMockGame(game)

    const addJoueurDto: AddJoueurDto = {
      partieId: '1',
      pseudo: 'TestPlayer',
      userId: 456,
      requestingUserId: ownerId,
    }

    // Act - Call method that doesn't exist yet
    const result = await joueurService.addJoueur(addJoueurDto)

    // Assert - Define expected behavior
    assert.isNotNull(result)
    assert.equal(result.partieId, '1')
    assert.equal(result.pseudo, 'TestPlayer')
    assert.equal(result.userId, 456)
    assert.isFalse(result.isGuest)
    assert.isFalse(result.isOwner) // Not the game owner
    assert.instanceOf(result.createdAt, Date)
  })

  test('should add guest joueur without userId', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    mockGameRepository.addMockGame(game)

    const addJoueurDto: AddJoueurDto = {
      partieId: '1',
      pseudo: 'GuestPlayer',
      requestingUserId: ownerId,
    }

    // Act
    const result = await joueurService.addJoueur(addJoueurDto)

    // Assert
    assert.isNotNull(result)
    assert.equal(result.pseudo, 'GuestPlayer')
    assert.isNull(result.userId)
    assert.isTrue(result.isGuest)
  })

  test('should throw PseudoAlreadyTakenError for duplicate pseudo', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    mockGameRepository.addMockGame(game)

    // Add first player with pseudo
    const existingPlayer = Player.createForGuest(
      new PlayerId(1),
      gameId,
      new Pseudo('ExistingPlayer')
    )
    await mockPlayerRepository.save(existingPlayer)

    const addJoueurDto: AddJoueurDto = {
      partieId: '1',
      pseudo: 'ExistingPlayer', // Same pseudo
      requestingUserId: ownerId,
    }

    // Act & Assert
    await assert.rejects(
      () => joueurService.addJoueur(addJoueurDto),
      PseudoAlreadyTakenError
    )
  })

  test('should throw UnauthorizedPartieAccessError for non-owner', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const unauthorizedUserId = 999
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    mockGameRepository.addMockGame(game)

    const addJoueurDto: AddJoueurDto = {
      partieId: '1',
      pseudo: 'TestPlayer',
      requestingUserId: unauthorizedUserId, // Not the owner
    }

    // Act & Assert
    await assert.rejects(
      () => joueurService.addJoueur(addJoueurDto),
      UnauthorizedPartieAccessError
    )
  })

  test('should throw PartieNotFoundError for invalid partieId', async ({ assert }) => {
    // Arrange
    const addJoueurDto: AddJoueurDto = {
      partieId: '999', // Non-existent partie
      pseudo: 'TestPlayer',
      requestingUserId: 123,
    }

    // Act & Assert
    await assert.rejects(
      () => joueurService.addJoueur(addJoueurDto),
      PartieNotFoundError
    )
  })

  test('should list joueurs for authorized owner', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    mockGameRepository.addMockGame(game)

    // Add some players
    const player1 = Player.createForRegisteredUser(new PlayerId(1), gameId, ownerId, new Pseudo('Owner'))
    const player2 = Player.createForGuest(new PlayerId(2), gameId, new Pseudo('Guest'))
    await mockPlayerRepository.save(player1)
    await mockPlayerRepository.save(player2)

    // Act - Call method that doesn't exist yet
    const result = await joueurService.listJoueurs('1', ownerId)

    // Assert
    assert.isObject(result)
    assert.isArray(result.joueurs)
    assert.equal(result.joueurs.length, 2)
    assert.isObject(result.pagination)
    assert.equal(result.pagination.total, 2)
    assert.isFalse(result.pagination.hasMore)
  })

  test('should allow participant to list joueurs', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const participantId = 456
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    mockGameRepository.addMockGame(game)

    // Add participant as player
    const participant = Player.createForRegisteredUser(
      new PlayerId(1),
      gameId,
      participantId,
      new Pseudo('Participant')
    )
    await mockPlayerRepository.save(participant)

    // Act
    const result = await joueurService.listJoueurs('1', participantId)

    // Assert
    assert.isArray(result.joueurs)
    assert.equal(result.joueurs.length, 1)
  })

  test('should throw UnauthorizedPartieAccessError for unauthorized listing', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const unauthorizedUserId = 999
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    mockGameRepository.addMockGame(game)

    // Act & Assert
    await assert.rejects(
      () => joueurService.listJoueurs('1', unauthorizedUserId),
      UnauthorizedPartieAccessError
    )
  })

  test('should identify owner correctly in response', async ({ assert }) => {
    // Arrange
    const gameId = new GameId(1)
    const ownerId = 123
    const game = Game.createNew(gameId, ownerId, GameType.fromValue('MATCHED_PLAY'), new PointsLimit(2000))
    mockGameRepository.addMockGame(game)

    const addJoueurDto: AddJoueurDto = {
      partieId: '1',
      pseudo: 'Owner',
      userId: ownerId, // Same as owner
      requestingUserId: ownerId,
    }

    // Act
    const result = await joueurService.addJoueur(addJoueurDto)

    // Assert
    assert.isTrue(result.isOwner) // Should be marked as owner
    assert.isFalse(result.isGuest)
  })
})