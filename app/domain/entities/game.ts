import GameId from '#domain/value-objects/game_id'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import GameStatus from '#domain/value-objects/game_status'
import { AggregateRoot } from '#domain/aggregate_root'
import GameStartedEvent from '#domain/events/game_started_event'
import GameCompletedEvent from '#domain/events/game_completed_event'
import GameCancelledEvent from '#domain/events/game_cancelled_event'

/**
 * Game Aggregate Root
 * Represents a Warhammer 40K game with its business rules
 */
export default class Game extends AggregateRoot {
  private constructor(
    private readonly _id: GameId,
    private readonly _userId: number,
    private readonly _gameType: GameType,
    private readonly _pointsLimit: PointsLimit,
    private _status: GameStatus,
    private _opponentId: number | null = null,
    private _playerScore: number | null = null,
    private _opponentScore: number | null = null,
    private _mission: string | null = null,
    private _notes: string = '',
    private readonly _createdAt: Date,
    private _startedAt: Date | null = null,
    private _completedAt: Date | null = null
  ) {
    super()
  }

  static createNew(id: GameId, userId: number, gameType: GameType, pointsLimit: PointsLimit): Game {
    return new Game(
      id,
      userId,
      gameType,
      pointsLimit,
      GameStatus.PLANNED,
      null,
      null,
      null,
      null,
      '',
      new Date()
    )
  }

  static reconstruct(data: {
    id: GameId
    userId: number
    gameType: GameType
    pointsLimit: PointsLimit
    status: GameStatus
    opponentId: number | null
    playerScore: number | null
    opponentScore: number | null
    mission: string | null
    notes: string
    createdAt: Date
    startedAt: Date | null
    completedAt: Date | null
  }): Game {
    return new Game(
      data.id,
      data.userId,
      data.gameType,
      data.pointsLimit,
      data.status,
      data.opponentId,
      data.playerScore,
      data.opponentScore,
      data.mission,
      data.notes,
      data.createdAt,
      data.startedAt,
      data.completedAt
    )
  }

  // Getters
  get id(): GameId {
    return this._id
  }

  get userId(): number {
    return this._userId
  }

  get gameType(): GameType {
    return this._gameType
  }

  get pointsLimit(): PointsLimit {
    return this._pointsLimit
  }

  get status(): GameStatus {
    return this._status
  }

  get opponentId(): number | null {
    return this._opponentId
  }

  get playerScore(): number | null {
    return this._playerScore
  }

  get opponentScore(): number | null {
    return this._opponentScore
  }

  get mission(): string | null {
    return this._mission
  }

  get notes(): string {
    return this._notes
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get startedAt(): Date | null {
    return this._startedAt
  }

  get completedAt(): Date | null {
    return this._completedAt
  }

  // Business methods
  start(mission?: string): void {
    if (!this._status.equals(GameStatus.PLANNED)) {
      throw new Error('Game must be in PLANNED status to be started')
    }

    this._status = GameStatus.IN_PROGRESS
    this._mission = mission || null
    this._startedAt = new Date()

    // Raise domain event
    this.addDomainEvent(new GameStartedEvent(this._id, this._userId, mission))
  }

  complete(playerScore: number, opponentScore: number): void {
    if (!this._status.equals(GameStatus.IN_PROGRESS)) {
      throw new Error('Game must be in IN_PROGRESS status to be completed')
    }

    this._status = GameStatus.COMPLETED
    this._playerScore = playerScore
    this._opponentScore = opponentScore
    this._completedAt = new Date()

    // Determine winner and raise domain event
    const winner = this.getWinner()!
    this.addDomainEvent(
      new GameCompletedEvent(this._id, this._userId, playerScore, opponentScore, winner)
    )
  }

  cancel(): void {
    if (this._status.equals(GameStatus.COMPLETED)) {
      throw new Error('Cannot cancel a completed game')
    }

    const previousStatus = this._status.value
    this._status = GameStatus.CANCELLED

    // Raise domain event
    this.addDomainEvent(new GameCancelledEvent(this._id, this._userId, previousStatus))
  }

  setOpponent(opponentId: number): void {
    this._opponentId = opponentId
  }

  updateNotes(notes: string): void {
    this._notes = notes
  }

  getWinner(): 'PLAYER' | 'OPPONENT' | 'DRAW' | null {
    if (
      !this._status.equals(GameStatus.COMPLETED) ||
      this._playerScore === null ||
      this._opponentScore === null
    ) {
      return null
    }

    if (this._playerScore > this._opponentScore) {
      return 'PLAYER'
    } else if (this._opponentScore > this._playerScore) {
      return 'OPPONENT'
    } else {
      return 'DRAW'
    }
  }
}
