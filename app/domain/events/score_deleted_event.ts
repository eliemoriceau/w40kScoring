import { DomainEvent } from './domain_event.js'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'

/**
 * ScoreDeletedEvent
 * Raised when a score is deleted
 */
export default class ScoreDeletedEvent implements DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType = 'ScoreDeleted'
  readonly occurredOn: Date
  readonly eventVersion = 1
  readonly data: Record<string, any>

  constructor(
    scoreId: ScoreId,
    roundId: RoundId,
    playerId: PlayerId,
    scoreType: string,
    scoreName: string,
    scoreValue: number
  ) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = scoreId.toString()
    this.occurredOn = new Date()
    this.data = {
      scoreId: scoreId.value,
      roundId: roundId.value,
      playerId: playerId.value,
      scoreType,
      scoreName,
      scoreValue,
      deletedAt: this.occurredOn.toISOString(),
    }
  }
}
