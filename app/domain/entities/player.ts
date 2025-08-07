import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'
import Pseudo from '#domain/value-objects/pseudo'
import { AggregateRoot } from '#domain/aggregate_root'
import PlayerCreatedEvent from '#domain/events/player_created_event'
import PlayerPseudoChangedEvent from '#domain/events/player_pseudo_changed_event'
import PlayerLinkedToUserEvent from '#domain/events/player_linked_to_user_event'

/**
 * Player Aggregate Root
 * Represents a player participating in a Warhammer 40K game
 */
export default class Player extends AggregateRoot {
  private constructor(
    private readonly _id: PlayerId,
    private readonly _gameId: GameId,
    private _userId: number | null,
    private _pseudo: Pseudo,
    private readonly _createdAt: Date
  ) {
    super()
  }

  static createForRegisteredUser(
    id: PlayerId,
    gameId: GameId,
    userId: number,
    pseudo: Pseudo
  ): Player {
    const player = new Player(id, gameId, userId, pseudo, new Date())

    // Raise domain event
    player.addDomainEvent(new PlayerCreatedEvent(id, gameId, userId, pseudo.value))

    return player
  }

  static createForGuest(id: PlayerId, gameId: GameId, pseudo: Pseudo): Player {
    const player = new Player(id, gameId, null, pseudo, new Date())

    // Raise domain event
    player.addDomainEvent(new PlayerCreatedEvent(id, gameId, null, pseudo.value))

    return player
  }

  static reconstruct(data: {
    id: PlayerId
    gameId: GameId
    userId: number | null
    pseudo: Pseudo
    createdAt: Date
  }): Player {
    return new Player(data.id, data.gameId, data.userId, data.pseudo, data.createdAt)
  }

  // Getters
  get id(): PlayerId {
    return this._id
  }

  get gameId(): GameId {
    return this._gameId
  }

  get userId(): number | null {
    return this._userId
  }

  get pseudo(): Pseudo {
    return this._pseudo
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get isGuest(): boolean {
    return this._userId === null
  }

  // Business methods
  changePseudo(newPseudo: Pseudo): void {
    if (this._pseudo.equals(newPseudo)) {
      throw new Error('New pseudo must be different from current pseudo')
    }

    const oldPseudo = this._pseudo.value
    this._pseudo = newPseudo

    // Raise domain event
    this.addDomainEvent(new PlayerPseudoChangedEvent(this._id, oldPseudo, newPseudo.value))
  }

  linkToUser(userId: number): void {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('User ID must be a positive integer')
    }

    if (!this.isGuest) {
      throw new Error('Cannot link already registered player to a different user')
    }

    this._userId = userId

    // Raise domain event
    this.addDomainEvent(new PlayerLinkedToUserEvent(this._id, userId))
  }
}
