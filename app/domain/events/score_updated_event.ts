import { DomainEvent } from './domain_event.js'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'

/**
 * ScoreUpdatedEvent
 * Raised when a score is updated (value or name change)
 */
export default class ScoreUpdatedEvent implements DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType = 'ScoreUpdated'
  readonly occurredOn: Date
  readonly eventVersion = 1
  readonly data: Record<string, any>

  constructor(
    scoreId: ScoreId,
    roundId: RoundId,
    playerId: PlayerId,
    fieldChanged: 'value' | 'name',
    oldValue: string,
    newValue: string
  ) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = scoreId.toString()
    this.occurredOn = new Date()
    this.data = {
      scoreId: scoreId.value,
      roundId: roundId.value,
      playerId: playerId.value,
      fieldChanged,
      oldValue,
      newValue,
      updatedAt: this.occurredOn.toISOString(),
    }
  }
}
