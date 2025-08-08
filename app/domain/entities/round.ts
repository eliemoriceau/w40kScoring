import { AggregateRoot } from '#domain/aggregate_root'
import RoundId from '#domain/value-objects/round_id'
import GameId from '#domain/value-objects/game_id'
import RoundNumber from '#domain/value-objects/round_number'
import RoundCompletedEvent from '#domain/events/round_completed_event'

/**
 * Round Entity
 * Represents a round within a Warhammer 40K game
 * Manages round-specific scoring and state
 */
export default class Round extends AggregateRoot {
  private constructor(
    private readonly _id: RoundId,
    private readonly _gameId: GameId,
    private readonly _roundNumber: RoundNumber,
    private _playerScore: number,
    private _opponentScore: number,
    private _isCompleted: boolean,
    private readonly _createdAt: Date
  ) {
    super()
  }

  static createNew(id: RoundId, gameId: GameId, roundNumber: RoundNumber): Round {
    return new Round(
      id,
      gameId,
      roundNumber,
      0, // Initial player score
      0, // Initial opponent score
      false, // Not completed initially
      new Date()
    )
  }

  static reconstruct(data: {
    id: RoundId
    gameId: GameId
    roundNumber: RoundNumber
    playerScore: number
    opponentScore: number
    isCompleted: boolean
    createdAt: Date
  }): Round {
    return new Round(
      data.id,
      data.gameId,
      data.roundNumber,
      data.playerScore,
      data.opponentScore,
      data.isCompleted,
      data.createdAt
    )
  }

  // Getters
  get id(): RoundId {
    return this._id
  }

  get gameId(): GameId {
    return this._gameId
  }

  get roundNumber(): RoundNumber {
    return this._roundNumber
  }

  get playerScore(): number {
    return this._playerScore
  }

  get opponentScore(): number {
    return this._opponentScore
  }

  get isCompleted(): boolean {
    return this._isCompleted
  }

  get createdAt(): Date {
    return this._createdAt
  }

  // Business methods
  completeRound(playerScore: number, opponentScore: number): void {
    if (this._isCompleted) {
      throw new Error('Round is already completed')
    }

    this.validateScores(playerScore, opponentScore)

    this._playerScore = playerScore
    this._opponentScore = opponentScore
    this._isCompleted = true

    // Raise domain event
    const winner = this.determineWinner(playerScore, opponentScore)
    this.addDomainEvent(
      new RoundCompletedEvent(
        this._id,
        this._gameId,
        this._roundNumber,
        playerScore,
        opponentScore,
        winner
      )
    )
  }

  updateScores(playerScore: number, opponentScore: number): void {
    if (this._isCompleted) {
      throw new Error('Cannot update scores of completed round')
    }

    this.validateScores(playerScore, opponentScore)

    this._playerScore = playerScore
    this._opponentScore = opponentScore
  }

  getWinner(): 'PLAYER' | 'OPPONENT' | 'DRAW' | null {
    if (!this._isCompleted) {
      return null
    }

    return this.determineWinner(this._playerScore, this._opponentScore)
  }

  private validateScores(playerScore: number, opponentScore: number): void {
    if (
      !Number.isInteger(playerScore) ||
      !Number.isInteger(opponentScore) ||
      playerScore < 0 ||
      opponentScore < 0
    ) {
      throw new Error('Scores must be non-negative integers')
    }
  }

  private determineWinner(
    playerScore: number,
    opponentScore: number
  ): 'PLAYER' | 'OPPONENT' | 'DRAW' {
    if (playerScore > opponentScore) {
      return 'PLAYER'
    } else if (opponentScore > playerScore) {
      return 'OPPONENT'
    } else {
      return 'DRAW'
    }
  }
}
