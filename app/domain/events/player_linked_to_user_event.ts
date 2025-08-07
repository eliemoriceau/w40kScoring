import { DomainEvent } from './domain_event.js'
import PlayerId from '#domain/value-objects/player_id'

/**
 * PlayerLinkedToUserEvent
 * Raised when a guest player is linked to a registered user account
 */
export default class PlayerLinkedToUserEvent implements DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType = 'PlayerLinkedToUser'
  readonly occurredOn: Date
  readonly eventVersion = 1
  readonly data: Record<string, any>

  constructor(playerId: PlayerId, userId: number) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = playerId.value.toString()
    this.occurredOn = new Date()
    this.data = {
      playerId: playerId.value,
      userId,
      linkedAt: this.occurredOn.toISOString(),
    }
  }
}
