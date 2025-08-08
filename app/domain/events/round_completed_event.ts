import { DomainEvent } from './domain_event.js'
import RoundId from '#domain/value-objects/round_id'
import GameId from '#domain/value-objects/game_id'
import RoundNumber from '#domain/value-objects/round_number'

/**
 * RoundCompletedEvent
 * Raised when a round is completed with final scores
 */
export default class RoundCompletedEvent implements DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType = 'RoundCompleted'
  readonly occurredOn: Date
  readonly eventVersion = 1
  readonly data: Record<string, any>

  constructor(
    roundId: RoundId,
    gameId: GameId,
    roundNumber: RoundNumber,
    playerScore: number,
    opponentScore: number,
    winner: 'PLAYER' | 'OPPONENT' | 'DRAW'
  ) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = roundId.toString()
    this.occurredOn = new Date()
    this.data = {
      roundId: roundId.value,
      gameId: gameId.value,
      roundNumber: roundNumber.value,
      playerScore,
      opponentScore,
      winner,
      completedAt: this.occurredOn.toISOString(),
    }
  }
}
