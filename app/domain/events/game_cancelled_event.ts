import { DomainEvent } from './domain_event.js'
import GameId from '#domain/value-objects/game_id'

/**
 * GameCancelledEvent
 * Raised when a game is cancelled from any status except COMPLETED
 */
export default class GameCancelledEvent implements DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType = 'GameCancelled'
  readonly occurredOn: Date
  readonly eventVersion = 1
  readonly data: Record<string, any>

  constructor(gameId: GameId, userId: number, previousStatus: string) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = gameId.value.toString()
    this.occurredOn = new Date()
    this.data = {
      gameId: gameId.value,
      userId,
      previousStatus,
      cancelledAt: this.occurredOn.toISOString(),
    }
  }
}
