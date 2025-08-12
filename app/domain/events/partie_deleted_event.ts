import { DomainEvent } from './domain_event.js'
import GameId from '#domain/value-objects/game_id'

/**
 * PartieDeletedEvent
 * Raised when a partie (complete game) is deleted
 */
export default class PartieDeletedEvent implements DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType = 'PartieDeleted'
  readonly occurredOn: Date
  readonly eventVersion = 1
  readonly data: Record<string, any>

  constructor(
    gameId: GameId,
    userId: number,
    // Enhanced metadata for Partie service
    context: string = 'partie',
    source: string = 'partie_service',
    metadata?: Record<string, unknown>
  ) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = gameId.value.toString()
    this.occurredOn = new Date()
    this.data = {
      gameId: gameId.value,
      userId,
      deletedAt: this.occurredOn.toISOString(),
      // Enhanced metadata
      context,
      source,
      metadata: metadata || {},
      eventVersion: this.eventVersion,
    }
  }
}
