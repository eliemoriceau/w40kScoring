import { DomainEvent } from './domain_event.js'
import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'

/**
 * PlayerCreatedEvent
 * Raised when a new player is created and added to a game
 */
export default class PlayerCreatedEvent implements DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType = 'PlayerCreated'
  readonly occurredOn: Date
  readonly eventVersion = 1
  readonly data: Record<string, any>

  constructor(playerId: PlayerId, gameId: GameId, userId: number | null, pseudo: string) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = playerId.value.toString()
    this.occurredOn = new Date()
    this.data = {
      playerId: playerId.value,
      gameId: gameId.value,
      userId,
      pseudo,
      createdAt: this.occurredOn.toISOString(),
    }
  }
}
