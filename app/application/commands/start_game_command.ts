/**
 * StartGameCommand
 * Command for starting a planned game
 */
export default class StartGameCommand {
  constructor(
    public readonly gameId: number,
    public readonly userId: number,
    public readonly mission?: string
  ) {
    this.validate()
  }

  private validate(): void {
    if (!Number.isInteger(this.gameId) || this.gameId <= 0) {
      throw new Error('Game ID must be a positive integer')
    }

    if (!Number.isInteger(this.userId) || this.userId <= 0) {
      throw new Error('User ID must be a positive integer')
    }
  }
}
