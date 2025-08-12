import { DomainEvent } from './domain_event.js'
import GameId from '#domain/value-objects/game_id'

/**
 * GameStartedEvent
 * Raised when a game transitions from PLANNED to IN_PROGRESS status
 */
export default class GameStartedEvent implements DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType = 'GameStarted'
  readonly occurredOn: Date
  readonly eventVersion = 1
  readonly data: Record<string, any>

  constructor(
    gameId: GameId,
    userId: number,
    mission?: string,
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
      mission: mission || null,
      startedAt: this.occurredOn.toISOString(),
      // Enhanced metadata
      context,
      source,
      metadata: metadata || {},
      eventVersion: this.eventVersion,
    }
  }
}
