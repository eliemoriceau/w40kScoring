/**
 * CreateGameCommand
 * Command for creating a new game
 */
export default class CreateGameCommand {
  constructor(
    public readonly userId: number,
    public readonly gameType: string,
    public readonly pointsLimit: number,
    public readonly opponentId?: number,
    public readonly mission?: string
  ) {
    this.validate()
  }

  private validate(): void {
    if (!Number.isInteger(this.userId) || this.userId <= 0) {
      throw new Error('User ID must be a positive integer')
    }

    if (!this.gameType || this.gameType.trim() === '') {
      throw new Error('Game type cannot be empty')
    }

    if (!Number.isInteger(this.pointsLimit) || this.pointsLimit <= 0) {
      throw new Error('Points limit must be greater than 0')
    }

    if (
      this.opponentId !== undefined &&
      (!Number.isInteger(this.opponentId) || this.opponentId <= 0)
    ) {
      throw new Error('Opponent ID must be a positive integer')
    }
  }
}
