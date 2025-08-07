import { DomainEvent } from './domain_event.js'
import PlayerId from '#domain/value-objects/player_id'

/**
 * PlayerPseudoChangedEvent
 * Raised when a player changes their display name (pseudo)
 */
export default class PlayerPseudoChangedEvent implements DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType = 'PlayerPseudoChanged'
  readonly occurredOn: Date
  readonly eventVersion = 1
  readonly data: Record<string, any>

  constructor(playerId: PlayerId, oldPseudo: string, newPseudo: string) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = playerId.value.toString()
    this.occurredOn = new Date()
    this.data = {
      playerId: playerId.value,
      oldPseudo,
      newPseudo,
      changedAt: this.occurredOn.toISOString(),
    }
  }
}
