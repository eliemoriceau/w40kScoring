import { DomainEvent } from '#domain/events/domain_event'
import RoundId from '#domain/value-objects/round_id'
import GameId from '#domain/value-objects/game_id'
import RoundNumber from '#domain/value-objects/round_number'

/**
 * Event émis lors de la création d'un nouveau round
 *
 * Déclenché quand un round vide est créé automatiquement
 * lors de la création d'une partie
 */
export default class RoundCreatedEvent implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly eventType: string
  public readonly occurredOn: Date
  public readonly eventVersion: number
  public readonly data: Record<string, any>

  constructor(
    public readonly roundId: RoundId,
    public readonly gameId: GameId,
    public readonly roundNumber: RoundNumber
  ) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = roundId.value.toString()
    this.eventType = 'round.created'
    this.occurredOn = new Date()
    this.eventVersion = 1
    this.data = {
      roundId: this.roundId.value,
      gameId: this.gameId.value,
      roundNumber: this.roundNumber.value,
      playerScore: 0, // Score par défaut
      opponentScore: 0, // Score par défaut
    }
  }
}
