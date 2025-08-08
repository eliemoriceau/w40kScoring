import { DomainEvent } from './domain_event.js'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import ScoreType from '#domain/value-objects/score_type'
import ScoreName from '#domain/value-objects/score_name'
import ScoreValue from '#domain/value-objects/score_value'

/**
 * ScoreCreatedEvent
 * Raised when a new score is created
 */
export default class ScoreCreatedEvent implements DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType = 'ScoreCreated'
  readonly occurredOn: Date
  readonly eventVersion = 1
  readonly data: Record<string, any>

  constructor(
    scoreId: ScoreId,
    roundId: RoundId,
    playerId: PlayerId,
    scoreType: ScoreType,
    scoreName: ScoreName,
    scoreValue: ScoreValue
  ) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = scoreId.toString()
    this.occurredOn = new Date()
    this.data = {
      scoreId: scoreId.value,
      roundId: roundId.value,
      playerId: playerId.value,
      scoreType: scoreType.value,
      scoreName: scoreName.value,
      scoreValue: scoreValue.value,
      createdAt: this.occurredOn.toISOString(),
    }
  }
}
