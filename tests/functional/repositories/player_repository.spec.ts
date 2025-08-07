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

    // Create a test game first (required for player foreign key)
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
    // Arrange
    const player = PlayerFactory.createRegisteredPlayer({
      id: new PlayerId(1),
      gameId: new GameId(1),
      userId: 123,
      pseudo: new Pseudo('TestPlayer123'),
    })

    // Act
    const savedPlayer = await commandRepository.save(player)

    // Assert
    assert.isTrue(savedPlayer.id.equals(player.id))
    assert.isTrue(savedPlayer.gameId.equals(player.gameId))
    assert.equal(savedPlayer.userId, player.userId)
    assert.isTrue(savedPlayer.pseudo.equals(player.pseudo))
    assert.isFalse(savedPlayer.isGuest)

    // Verify in database
    const playerModel = await PlayerModel.find(1)
    assert.isNotNull(playerModel)
    assert.equal(playerModel!.gameId, 1)
    assert.equal(playerModel!.userId, 123)
    assert.equal(playerModel!.pseudo, 'TestPlayer123')
  })

  test('Command Repository - should save and retrieve a guest player', async ({ assert }) => {
    // Arrange
    const player = PlayerFactory.createGuestPlayer({
      id: new PlayerId(2),
      gameId: new GameId(1),
      pseudo: new Pseudo('GuestPlayer'),
    })

    // Act
    const savedPlayer = await commandRepository.save(player)

    // Assert
    assert.isTrue(savedPlayer.id.equals(player.id))
    assert.isTrue(savedPlayer.gameId.equals(player.gameId))
    assert.isNull(savedPlayer.userId)
    assert.isTrue(savedPlayer.pseudo.equals(player.pseudo))
    assert.isTrue(savedPlayer.isGuest)

    // Verify in database
    const playerModel = await PlayerModel.find(2)
    assert.isNotNull(playerModel)
    assert.equal(playerModel!.gameId, 1)
    assert.isNull(playerModel!.userId)
    assert.equal(playerModel!.pseudo, 'GuestPlayer')
  })

  test('Query Repository - should find player by ID', async ({ assert }) => {
    // Arrange
    const player = PlayerFactory.createRegisteredPlayer({
      id: new PlayerId(3),
      gameId: new GameId(1),
      userId: 456,
      pseudo: new Pseudo('FindablePlayer'),
    })
    await commandRepository.save(player)

    // Act
    const foundPlayer = await queryRepository.findById(new PlayerId(3))

    // Assert
    assert.isNotNull(foundPlayer)
    assert.isTrue(foundPlayer!.id.equals(player.id))
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
    // Arrange
    const players = PlayerFactory.createBatch(3, {
      gameId: new GameId(1),
      pseudoPrefix: 'GamePlayer',
    })
    for (const player of players) {
      await commandRepository.save(player)
    }

    // Act
    const foundPlayers = await queryRepository.findByGameId(new GameId(1))

    // Assert
    assert.equal(foundPlayers.length, 3)
    foundPlayers.forEach((player, index) => {
      assert.isTrue(player.gameId.equals(new GameId(1)))
      assert.equal(player.pseudo.value, `GamePlayer${index + 1}`)
    })
  })

  test('Query Repository - should check if pseudo is taken in game', async ({ assert }) => {
    // Arrange
    const player = PlayerFactory.createRegisteredPlayer({
      gameId: new GameId(1),
      pseudo: new Pseudo('TakenPseudo'),
    })
    await commandRepository.save(player)

    // Act & Assert
    const isTaken = await queryRepository.isPseudoTakenInGame(new GameId(1), 'TakenPseudo')
    const isNotTaken = await queryRepository.isPseudoTakenInGame(new GameId(1), 'AvailablePseudo')

    assert.isTrue(isTaken)
    assert.isFalse(isNotTaken)
  })

  test('Query Repository - should find guest players', async ({ assert }) => {
    // Arrange
    const registeredPlayer = PlayerFactory.createRegisteredPlayer({ gameId: new GameId(1) })
    const guestPlayer1 = PlayerFactory.createGuestPlayer({
      id: new PlayerId(10),
      gameId: new GameId(1),
      pseudo: new Pseudo('Guest1'),
    })
    const guestPlayer2 = PlayerFactory.createGuestPlayer({
      id: new PlayerId(11),
      gameId: new GameId(1),
      pseudo: new Pseudo('Guest2'),
    })

    await commandRepository.save(registeredPlayer)
    await commandRepository.save(guestPlayer1)
    await commandRepository.save(guestPlayer2)

    // Act
    const guestPlayers = await queryRepository.findGuestPlayers(new GameId(1))

    // Assert
    assert.equal(guestPlayers.length, 2)
    guestPlayers.forEach((player) => {
      assert.isTrue(player.isGuest)
      assert.isNull(player.userId)
    })
  })

  test('Command Repository - should delete player by ID', async ({ assert }) => {
    // Arrange
    const player = PlayerFactory.createRegisteredPlayer({ id: new PlayerId(20) })
    await commandRepository.save(player)

    // Verify player exists
    const existsBefore = await queryRepository.exists(new PlayerId(20))
    assert.isTrue(existsBefore)

    // Act
    await commandRepository.delete(new PlayerId(20))

    // Assert
    const existsAfter = await queryRepository.exists(new PlayerId(20))
    assert.isFalse(existsAfter)
  })

  test('Command Repository - should save batch of players', async ({ assert }) => {
    // Arrange
    const players = PlayerFactory.createBatch(5, {
      gameId: new GameId(1),
      pseudoPrefix: 'BatchPlayer',
    })

    // Act
    const savedPlayers = await commandRepository.saveBatch(players)

    // Assert
    assert.equal(savedPlayers.length, 5)

    const countResult = await PlayerModel.query().where('gameId', 1).count('* as total')
    const totalCount = Number((countResult[0] as any)?.total ?? 0)
    assert.equal(totalCount, 5)
  })

  test('Combined Repository - should provide both query and command functionality', async ({
    assert,
  }) => {
    // Arrange
    const player = PlayerFactory.createRegisteredPlayer({
      id: new PlayerId(30),
      pseudo: new Pseudo('CombinedTest'),
    })

    // Act - Command operation
    await combinedRepository.save(player)

    // Act - Query operation
    const foundPlayer = await combinedRepository.findById(new PlayerId(30))

    // Assert
    assert.isNotNull(foundPlayer)
    assert.isTrue(foundPlayer!.pseudo.equals(new Pseudo('CombinedTest')))

    // Act - Delete operation
    await combinedRepository.delete(new PlayerId(30))

    const exists = await combinedRepository.exists(new PlayerId(30))
    assert.isFalse(exists)
  })
})
