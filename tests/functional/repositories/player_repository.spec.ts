import { test } from '@japa/runner'
import { PlayerFactory } from '#tests/helpers/player_factory'
import LucidPlayerQueryRepository from '#infrastructure/repositories/lucid_player_query_repository'
import LucidPlayerCommandRepository from '#infrastructure/repositories/lucid_player_command_repository'
import LucidPlayerRepository from '#infrastructure/repositories/lucid_player_repository'
import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'
import Pseudo from '#domain/value-objects/pseudo'
import PlayerModel from '#models/player'
import GameModel from '#models/game'
import db from '@adonisjs/lucid/services/db'

test.group('Player Repository Integration', (group) => {
  let queryRepository: LucidPlayerQueryRepository
  let commandRepository: LucidPlayerCommandRepository
  let combinedRepository: LucidPlayerRepository

  group.setup(async () => {
    // Initialize repositories
    queryRepository = new LucidPlayerQueryRepository()
    commandRepository = new LucidPlayerCommandRepository()
    combinedRepository = new LucidPlayerRepository()
  })

  group.each.setup(async () => {
    await db.beginGlobalTransaction()

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
    await db.rollbackGlobalTransaction()
  })

  test('Command Repository - should save and retrieve a registered player', async ({ assert }) => {
    // Arrange - Use seeded data (player ID 1 exists)
    const existingPlayer = await queryRepository.findById(new PlayerId(1))
    assert.isNotNull(existingPlayer)

    // Update player pseudo
    const updatedPlayer = PlayerFactory.createRegisteredPlayer({
      id: new PlayerId(1),
      gameId: new GameId(1),
      userId: 123,
      pseudo: new Pseudo('UpdatedPlayer'),
    })

    // Act
    const savedPlayer = await commandRepository.save(updatedPlayer)

    // Assert
    assert.isTrue(savedPlayer.id.equals(new PlayerId(1)))
    assert.isTrue(savedPlayer.gameId.equals(new GameId(1)))
    assert.equal(savedPlayer.userId, 123)
    assert.isTrue(savedPlayer.pseudo.equals(new Pseudo('UpdatedPlayer')))
    assert.isFalse(savedPlayer.isGuest)
  })

  test('Command Repository - should save and retrieve a guest player', async ({ assert }) => {
    // Arrange - Use seeded data (player ID 2 exists as guest)
    const existingPlayer = await queryRepository.findById(new PlayerId(2))
    assert.isNotNull(existingPlayer)
    assert.isTrue(existingPlayer!.isGuest)

    // Update guest player
    const updatedPlayer = PlayerFactory.createGuestPlayer({
      id: new PlayerId(2),
      gameId: new GameId(1),
      pseudo: new Pseudo('UpdatedGuest'),
    })

    // Act
    const savedPlayer = await commandRepository.save(updatedPlayer)

    // Assert
    assert.isTrue(savedPlayer.id.equals(new PlayerId(2)))
    assert.isTrue(savedPlayer.gameId.equals(new GameId(1)))
    assert.isNull(savedPlayer.userId)
    assert.isTrue(savedPlayer.pseudo.equals(new Pseudo('UpdatedGuest')))
    assert.isTrue(savedPlayer.isGuest)
  })

  test('Query Repository - should find player by ID', async ({ assert }) => {
    // Act - Use seeded data (player ID 3 exists)
    const foundPlayer = await queryRepository.findById(new PlayerId(3))

    // Assert
    assert.isNotNull(foundPlayer)
    assert.isTrue(foundPlayer!.id.equals(new PlayerId(3)))
    assert.equal(foundPlayer!.userId, 456)
    assert.isTrue(foundPlayer!.pseudo.equals(new Pseudo('FindablePlayer')))
  })

  test('Query Repository - should return null for non-existent player', async ({ assert }) => {
    // Act
    const foundPlayer = await queryRepository.findById(new PlayerId(999))

    // Assert
    assert.isNull(foundPlayer)
  })

  test('Query Repository - should find players by game ID', async ({ assert }) => {
    // Act - Use seeded data (multiple players exist in game 1)
    const foundPlayers = await queryRepository.findByGameId(new GameId(1))

    // Assert - Should find all seeded players in game 1
    assert.isTrue(foundPlayers.length > 0)
    foundPlayers.forEach((player) => {
      assert.isTrue(player.gameId.equals(new GameId(1)))
    })
  })

  test('Query Repository - should check if pseudo is taken in game', async ({ assert }) => {
    // Arrange - Create test player directly
    await PlayerModel.create({
      gameId: 1,
      userId: 999,
      pseudo: 'TakenPseudo',
    })

    // Act & Assert
    const isTaken = await queryRepository.isPseudoTakenInGame(new GameId(1), 'TakenPseudo')
    const isNotTaken = await queryRepository.isPseudoTakenInGame(new GameId(1), 'AvailablePseudo')

    assert.isTrue(isTaken)
    assert.isFalse(isNotTaken)
  })

  test('Query Repository - should find guest players', async ({ assert }) => {
    // Act - Use seeded data (Guest1, Guest2, and GuestPlayer exist)
    const guestPlayers = await queryRepository.findGuestPlayers(new GameId(1))

    // Assert - Should find seeded guest players (at least 3)
    assert.isTrue(guestPlayers.length >= 3)
    guestPlayers.forEach((player) => {
      assert.isTrue(player.isGuest)
      assert.isNull(player.userId)
    })
  })

  test('Command Repository - should delete player by ID', async ({ assert }) => {
    // Arrange - Create player directly
    const playerModel = await PlayerModel.create({
      gameId: 1,
      userId: 789,
      pseudo: 'PlayerToDelete',
    })
    
    const playerId = new PlayerId(playerModel.id)

    // Verify player exists
    const existsBefore = await queryRepository.exists(playerId)
    assert.isTrue(existsBefore)

    // Act
    await commandRepository.delete(playerId)

    // Assert
    const existsAfter = await queryRepository.exists(playerId)
    assert.isFalse(existsAfter)
  })

  test('Command Repository - should save batch of players', async ({ assert }) => {
    // Arrange - Create new players for batch save
    const playersData = [
      { gameId: 1, userId: 200, pseudo: 'NewBatchPlayer1' },
      { gameId: 1, userId: 201, pseudo: 'NewBatchPlayer2' },
      { gameId: 1, userId: 202, pseudo: 'NewBatchPlayer3' },
    ]

    const players = playersData.map((data, index) =>
      PlayerFactory.createRegisteredPlayer({
        id: new PlayerId(index + 1000), // Use high IDs that don't exist
        gameId: new GameId(data.gameId),
        userId: data.userId,
        pseudo: new Pseudo(data.pseudo),
      })
    )

    // Count existing players before batch save
    const countBefore = await PlayerModel.query().where('gameId', 1).count('* as total')
    const initialCount = Number((countBefore[0] as any)?.total ?? 0)

    // Act
    const savedPlayers = await commandRepository.saveBatch(players)

    // Assert
    assert.equal(savedPlayers.length, 3)

    const countAfter = await PlayerModel.query().where('gameId', 1).count('* as total')
    const finalCount = Number((countAfter[0] as any)?.total ?? 0)
    assert.equal(finalCount, initialCount + 3)
  })

  test('Combined Repository - should provide both query and command functionality', async ({
    assert,
  }) => {
    // Use seeded data - player ID 30 exists with pseudo 'CombinedTest'
    const playerId = new PlayerId(30)

    // Act - Query operation
    const foundPlayer = await combinedRepository.findById(playerId)

    // Assert
    assert.isNotNull(foundPlayer)
    assert.isTrue(foundPlayer!.pseudo.equals(new Pseudo('CombinedTest')))

    // Act - Delete operation
    await combinedRepository.delete(playerId)

    const exists = await combinedRepository.exists(playerId)
    assert.isFalse(exists)
  })
})
