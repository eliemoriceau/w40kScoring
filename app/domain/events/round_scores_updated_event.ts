import { DomainEvent } from '#domain/events/domain_event'
import RoundId from '#domain/value-objects/round_id'

/**
 * Event émis lors de la mise à jour des scores d'un round
 *
 * Déclenché lors de l'édition inline des scores
 */
export default class RoundScoresUpdatedEvent implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly eventType: string
  public readonly occurredOn: Date
  public readonly eventVersion: number
  public readonly data: Record<string, any>

  constructor(
    public readonly roundId: RoundId,
    public readonly playerScore: number = 0,
    public readonly opponentScore: number = 0
  ) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = roundId.value.toString()
    this.eventType = 'round.scores_updated'
    this.occurredOn = new Date()
    this.eventVersion = 1
    this.data = {
      roundId: this.roundId.value,
      playerScore: this.playerScore,
      opponentScore: this.opponentScore,
      previousPlayerScore: null, // Pourrait être ajouté plus tard pour l'historique
      previousOpponentScore: null,
    }
  }
}
