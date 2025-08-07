import { DomainEvent } from './domain_event.js'
import GameId from '#domain/value-objects/game_id'

/**
 * GameCompletedEvent
 * Raised when a game transitions from IN_PROGRESS to COMPLETED status
 */
export default class GameCompletedEvent implements DomainEvent {
  readonly eventId: string
  readonly aggregateId: string
  readonly eventType = 'GameCompleted'
  readonly occurredOn: Date
  readonly eventVersion = 1
  readonly data: Record<string, any>

  constructor(
    gameId: GameId,
    userId: number,
    playerScore: number,
    opponentScore: number,
    winner: 'PLAYER' | 'OPPONENT' | 'DRAW'
  ) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = gameId.value.toString()
    this.occurredOn = new Date()
    this.data = {
      gameId: gameId.value,
      userId,
      playerScore,
      opponentScore,
      winner,
      completedAt: this.occurredOn.toISOString(),
    }
  }
}
