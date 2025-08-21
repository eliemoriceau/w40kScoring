import GameId from '#domain/value-objects/game_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'

/**
 * Command pour mettre à jour le score d'un round spécifique
 * Utilisé dans le contexte de l'édition inline des scores
 */
export default class UpdateRoundScoreCommand {
  constructor(
    public readonly gameId: GameId,
    public readonly roundId: RoundId,
    public readonly playerId: PlayerId,
    public readonly score: number
  ) {
    // Validation des contraintes métier
    if (score < 0 || score > 50) {
      throw new Error('Score must be between 0 and 50')
    }

    if (!Number.isInteger(score)) {
      throw new Error('Score must be an integer')
    }
  }

  /**
   * Factory method pour créer la command à partir de données primitives
   */
  static fromPrimitives(
    gameId: number,
    roundId: number,
    playerId: number,
    score: number
  ): UpdateRoundScoreCommand {
    return new UpdateRoundScoreCommand(
      new GameId(gameId),
      new RoundId(roundId),
      new PlayerId(playerId),
      score
    )
  }
}
