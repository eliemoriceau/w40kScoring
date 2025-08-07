import { test } from '@japa/runner'
import Player from '#domain/entities/player'
import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'
import Pseudo from '#domain/value-objects/pseudo'
import PlayerCreatedEvent from '#domain/events/player_created_event'
import PlayerPseudoChangedEvent from '#domain/events/player_pseudo_changed_event'
import PlayerLinkedToUserEvent from '#domain/events/player_linked_to_user_event'

test.group('Player Entity', () => {
  test('should create player for registered user', ({ assert }) => {
    // Arrange
    const playerId = new PlayerId(1)
    const gameId = new GameId(10)
    const userId = 123
    const pseudo = new Pseudo('PlayerOne')

    // Act
    const player = Player.createForRegisteredUser(playerId, gameId, userId, pseudo)

    // Assert
    assert.isTrue(player.id.equals(playerId))
    assert.isTrue(player.gameId.equals(gameId))
    assert.equal(player.userId, userId)
    assert.isTrue(player.pseudo.equals(pseudo))
    assert.isFalse(player.isGuest)
    assert.instanceOf(player.createdAt, Date)
  })

  test('should create player for guest user', ({ assert }) => {
    // Arrange
    const playerId = new PlayerId(2)
    const gameId = new GameId(20)
    const pseudo = new Pseudo('GuestPlayer')

    // Act
    const player = Player.createForGuest(playerId, gameId, pseudo)

    // Assert
    assert.isTrue(player.id.equals(playerId))
    assert.isTrue(player.gameId.equals(gameId))
    assert.isNull(player.userId)
    assert.isTrue(player.pseudo.equals(pseudo))
    assert.isTrue(player.isGuest)
    assert.instanceOf(player.createdAt, Date)
  })

  test('should raise PlayerCreatedEvent when creating registered player', ({ assert }) => {
    // Arrange
    const playerId = new PlayerId(3)
    const gameId = new GameId(30)
    const userId = 456
    const pseudo = new Pseudo('TestPlayer')

    // Act
    const player = Player.createForRegisteredUser(playerId, gameId, userId, pseudo)

    // Assert
    const events = player.getDomainEvents()
    assert.equal(events.length, 1)

    const createdEvent = events[0] as PlayerCreatedEvent
    assert.equal(createdEvent.eventType, 'PlayerCreated')
    assert.equal(createdEvent.aggregateId, '3')
    assert.equal(createdEvent.data.playerId, 3)
    assert.equal(createdEvent.data.gameId, 30)
    assert.equal(createdEvent.data.userId, 456)
    assert.equal(createdEvent.data.pseudo, 'TestPlayer')
  })

  test('should raise PlayerCreatedEvent when creating guest player', ({ assert }) => {
    // Arrange
    const playerId = new PlayerId(4)
    const gameId = new GameId(40)
    const pseudo = new Pseudo('GuestUser')

    // Act
    const player = Player.createForGuest(playerId, gameId, pseudo)

    // Assert
    const events = player.getDomainEvents()
    assert.equal(events.length, 1)

    const createdEvent = events[0] as PlayerCreatedEvent
    assert.equal(createdEvent.eventType, 'PlayerCreated')
    assert.equal(createdEvent.data.userId, null)
    assert.equal(createdEvent.data.pseudo, 'GuestUser')
  })

  test('should change pseudo and raise event', ({ assert }) => {
    // Arrange
    const player = Player.createForRegisteredUser(
      new PlayerId(5),
      new GameId(50),
      789,
      new Pseudo('OldName')
    )
    const newPseudo = new Pseudo('NewName')

    // Act
    player.changePseudo(newPseudo)

    // Assert
    assert.isTrue(player.pseudo.equals(newPseudo))

    const events = player.getDomainEvents()
    assert.equal(events.length, 2) // PlayerCreated + PseudoChanged

    const pseudoChangedEvent = events[1] as PlayerPseudoChangedEvent
    assert.equal(pseudoChangedEvent.eventType, 'PlayerPseudoChanged')
    assert.equal(pseudoChangedEvent.data.oldPseudo, 'OldName')
    assert.equal(pseudoChangedEvent.data.newPseudo, 'NewName')
  })

  test('should not change pseudo to same value', ({ assert }) => {
    // Arrange
    const pseudo = new Pseudo('SameName')
    const player = Player.createForGuest(new PlayerId(6), new GameId(60), pseudo)

    // Act & Assert
    assert.throws(
      () => player.changePseudo(pseudo),
      'New pseudo must be different from current pseudo'
    )
  })

  test('should link guest player to user account', ({ assert }) => {
    // Arrange
    const player = Player.createForGuest(
      new PlayerId(7),
      new GameId(70),
      new Pseudo('GuestBecomingUser')
    )
    const userId = 999

    // Act
    player.linkToUser(userId)

    // Assert
    assert.equal(player.userId, userId)
    assert.isFalse(player.isGuest)

    const events = player.getDomainEvents()
    assert.equal(events.length, 2) // PlayerCreated + LinkedToUser

    const linkedEvent = events[1] as PlayerLinkedToUserEvent
    assert.equal(linkedEvent.eventType, 'PlayerLinkedToUser')
    assert.equal(linkedEvent.data.playerId, 7)
    assert.equal(linkedEvent.data.userId, 999)
  })

  test('should not link already registered player to user', ({ assert }) => {
    // Arrange
    const player = Player.createForRegisteredUser(
      new PlayerId(8),
      new GameId(80),
      111,
      new Pseudo('AlreadyRegistered')
    )

    // Act & Assert
    assert.throws(
      () => player.linkToUser(222),
      'Cannot link already registered player to a different user'
    )
  })

  test('should not link guest player to invalid user ID', ({ assert }) => {
    // Arrange
    const player = Player.createForGuest(new PlayerId(9), new GameId(90), new Pseudo('GuestPlayer'))

    // Act & Assert
    assert.throws(() => player.linkToUser(0), 'User ID must be a positive integer')
    assert.throws(() => player.linkToUser(-1), 'User ID must be a positive integer')
  })

  test('should reconstruct player from persistence data', ({ assert }) => {
    // Arrange
    const playerId = new PlayerId(10)
    const gameId = new GameId(100)
    const userId = 333
    const pseudo = new Pseudo('ReconstructedPlayer')
    const createdAt = new Date('2024-01-01T10:00:00Z')

    // Act
    const player = Player.reconstruct({
      id: playerId,
      gameId,
      userId,
      pseudo,
      createdAt,
    })

    // Assert
    assert.isTrue(player.id.equals(playerId))
    assert.isTrue(player.gameId.equals(gameId))
    assert.equal(player.userId, userId)
    assert.isTrue(player.pseudo.equals(pseudo))
    assert.equal(player.createdAt, createdAt)
    assert.isFalse(player.isGuest)
    assert.equal(player.getDomainEvents().length, 0) // No events for reconstructed
  })

  test('should reconstruct guest player from persistence data', ({ assert }) => {
    // Arrange
    const playerId = new PlayerId(11)
    const gameId = new GameId(110)
    const pseudo = new Pseudo('ReconstructedGuest')
    const createdAt = new Date('2024-01-01T11:00:00Z')

    // Act
    const player = Player.reconstruct({
      id: playerId,
      gameId,
      userId: null,
      pseudo,
      createdAt,
    })

    // Assert
    assert.isTrue(player.id.equals(playerId))
    assert.isNull(player.userId)
    assert.isTrue(player.isGuest)
    assert.equal(player.getDomainEvents().length, 0) // No events for reconstructed
  })
})
