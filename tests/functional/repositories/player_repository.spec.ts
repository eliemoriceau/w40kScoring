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
    // Clean up before each test
    await PlayerModel.query().delete()
    await GameModel.query().delete()

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
    await PlayerModel.query().delete()
    await GameModel.query().delete()
  })

  test('Command Repository - should save and retrieve a registered player', async ({ assert }) => {
    // Arrange - Create initial player
    const initialPlayer = PlayerFactory.createRegisteredPlayer({
      id: new PlayerId(1),
      gameId: new GameId(1),
      userId: 123,
      pseudo: new Pseudo('InitialPlayer'),
    })

    // Save initial player
    await commandRepository.save(initialPlayer)

    // Verify player was saved
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
    // Arrange - Create initial guest player
    const initialPlayer = PlayerFactory.createGuestPlayer({
      id: new PlayerId(2),
      gameId: new GameId(1),
      pseudo: new Pseudo('InitialGuest'),
    })

    // Save initial guest player
    await commandRepository.save(initialPlayer)

    // Verify player was saved as guest
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
    // Arrange - Create test player
    const testPlayer = PlayerFactory.createRegisteredPlayer({
      id: new PlayerId(3),
      gameId: new GameId(1),
      userId: 456,
      pseudo: new Pseudo('FindablePlayer'),
    })

    // Save the test player
    await commandRepository.save(testPlayer)

    // Act
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
    // Arrange - Create multiple test players for game 1
    const testPlayers = [
      PlayerFactory.createRegisteredPlayer({
        id: new PlayerId(10),
        gameId: new GameId(1),
        userId: 100,
        pseudo: new Pseudo('Player1'),
      }),
      PlayerFactory.createRegisteredPlayer({
        id: new PlayerId(11),
        gameId: new GameId(1),
        userId: 101,
        pseudo: new Pseudo('Player2'),
      }),
      PlayerFactory.createGuestPlayer({
        id: new PlayerId(12),
        gameId: new GameId(1),
        pseudo: new Pseudo('GuestPlayer'),
      }),
    ]

    // Save all test players
    for (const player of testPlayers) {
      await commandRepository.save(player)
    }

    // Act
    const foundPlayers = await queryRepository.findByGameId(new GameId(1))

    // Assert
    assert.equal(foundPlayers.length, 3)
    foundPlayers.forEach((player) => {
      assert.isTrue(player.gameId.equals(new GameId(1)))
    })
  })

  test('Query Repository - should check if pseudo is taken in game', async ({ assert }) => {
    // Arrange - Create test player using the factory and repository
    const testPlayer = PlayerFactory.createRegisteredPlayer({
      id: new PlayerId(999), // This ID will be ignored, but that's okay
      gameId: new GameId(1),
      userId: 999,
      pseudo: new Pseudo('TakenPseudo'),
    })

    await commandRepository.save(testPlayer)

    // Act & Assert
    const isTaken = await queryRepository.isPseudoTakenInGame(new GameId(1), 'TakenPseudo')
    const isNotTaken = await queryRepository.isPseudoTakenInGame(new GameId(1), 'AvailablePseudo')

    assert.isTrue(isTaken)
    assert.isFalse(isNotTaken)
  })

  test('Query Repository - should find guest players', async ({ assert }) => {
    // Arrange - Create multiple guest players
    const guestPlayers = [
      PlayerFactory.createGuestPlayer({
        id: new PlayerId(20),
        gameId: new GameId(1),
        pseudo: new Pseudo('Guest1'),
      }),
      PlayerFactory.createGuestPlayer({
        id: new PlayerId(21),
        gameId: new GameId(1),
        pseudo: new Pseudo('Guest2'),
      }),
      PlayerFactory.createGuestPlayer({
        id: new PlayerId(22),
        gameId: new GameId(1),
        pseudo: new Pseudo('GuestPlayer'),
      }),
    ]

    // Also create a registered player to ensure it's not included
    const registeredPlayer = PlayerFactory.createRegisteredPlayer({
      id: new PlayerId(23),
      gameId: new GameId(1),
      userId: 300,
      pseudo: new Pseudo('RegisteredPlayer'),
    })

    // Save all players
    for (const player of [...guestPlayers, registeredPlayer]) {
      await commandRepository.save(player)
    }

    // Act
    const foundGuestPlayers = await queryRepository.findGuestPlayers(new GameId(1))

    // Assert - Should find only the guest players (3)
    assert.equal(foundGuestPlayers.length, 3)
    foundGuestPlayers.forEach((player) => {
      assert.isTrue(player.isGuest)
      assert.isNull(player.userId)
    })
  })

  test('Command Repository - should delete player by ID', async ({ assert }) => {
    // Arrange - Create player using repository
    const testPlayer = PlayerFactory.createRegisteredPlayer({
      id: new PlayerId(789), // This will be ignored, DB generates ID
      gameId: new GameId(1),
      userId: 789,
      pseudo: new Pseudo('PlayerToDelete'),
    })

    const savedPlayer = await commandRepository.save(testPlayer)
    const playerId = savedPlayer.id

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
        id: new PlayerId(index + 1000), // Use high IDs that don't exist (will be ignored)
        gameId: new GameId(data.gameId),
        userId: data.userId,
        pseudo: new Pseudo(data.pseudo),
      })
    )

    // Count existing players before batch save
    const countBefore = await PlayerModel.query().where('game_id', 1).count('* as total')
    const initialCount = Number((countBefore[0] as any)?.$extras?.total ?? 0)

    // Act
    const savedPlayers = await commandRepository.saveBatch(players)

    // Assert
    assert.equal(savedPlayers.length, 3)
    // Verify all players have correct data
    savedPlayers.forEach((player, index) => {
      assert.isTrue(player.gameId.equals(new GameId(1)))
      assert.equal(player.userId, playersData[index].userId)
      assert.isTrue(player.pseudo.equals(new Pseudo(playersData[index].pseudo)))
    })

    const countAfter = await PlayerModel.query().where('game_id', 1).count('* as total')
    const finalCount = Number((countAfter[0] as any)?.$extras?.total ?? 0)
    assert.equal(finalCount, initialCount + 3)
  })

  test('Combined Repository - should provide both query and command functionality', async ({
    assert,
  }) => {
    // Arrange - Create test player
    const testPlayer = PlayerFactory.createRegisteredPlayer({
      id: new PlayerId(30), // This will be ignored, DB generates ID
      gameId: new GameId(1),
      userId: 500,
      pseudo: new Pseudo('CombinedTest'),
    })

    // Save the test player using the combined repository
    const savedPlayer = await combinedRepository.save(testPlayer)
    const actualPlayerId = savedPlayer.id

    // Act - Query operation
    const foundPlayer = await combinedRepository.findById(actualPlayerId)

    // Assert
    assert.isNotNull(foundPlayer)
    assert.isTrue(foundPlayer!.pseudo.equals(new Pseudo('CombinedTest')))
    assert.equal(foundPlayer!.userId, 500)

    // Act - Delete operation
    await combinedRepository.delete(actualPlayerId)

    const exists = await combinedRepository.exists(actualPlayerId)
    assert.isFalse(exists)
  })
})
