/**
 * GameStatus Value Object
 * Represents the different status states of a game
 */
export default class GameStatus {
  private static readonly _planned = new GameStatus('PLANNED', 'Planned')
  private static readonly _inProgress = new GameStatus('IN_PROGRESS', 'In Progress')
  private static readonly _completed = new GameStatus('COMPLETED', 'Completed')
  private static readonly _cancelled = new GameStatus('CANCELLED', 'Cancelled')

  private constructor(
    private readonly _value: string,
    private readonly _displayName: string
  ) {}

  static get PLANNED(): GameStatus {
    return this._planned
  }

  static get IN_PROGRESS(): GameStatus {
    return this._inProgress
  }

  static get COMPLETED(): GameStatus {
    return this._completed
  }

  static get CANCELLED(): GameStatus {
    return this._cancelled
  }

  get value(): string {
    return this._value
  }

  get displayName(): string {
    return this._displayName
  }

  equals(other: GameStatus): boolean {
    return this._value === other._value
  }

  static fromValue(value: string): GameStatus {
    switch (value) {
      case 'PLANNED':
        return this.PLANNED
      case 'IN_PROGRESS':
        return this.IN_PROGRESS
      case 'COMPLETED':
        return this.COMPLETED
      case 'CANCELLED':
        return this.CANCELLED
      default:
        throw new Error(`Invalid game status: ${value}`)
    }
  }

  canTransitionTo(newStatus: GameStatus): boolean {
    switch (this._value) {
      case 'PLANNED':
        return newStatus.equals(GameStatus.IN_PROGRESS) || newStatus.equals(GameStatus.CANCELLED)
      case 'IN_PROGRESS':
        return newStatus.equals(GameStatus.COMPLETED) || newStatus.equals(GameStatus.CANCELLED)
      case 'COMPLETED':
      case 'CANCELLED':
        return false
      default:
        return false
    }
  }

  toString(): string {
    return this._value
  }
}
