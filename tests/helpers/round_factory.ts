import Round from '#domain/entities/round'
import RoundId from '#domain/value-objects/round_id'
import GameId from '#domain/value-objects/game_id'
import RoundNumber from '#domain/value-objects/round_number'

/**
 * RoundFactory - Test Helper for creating Round domain entities
 * Provides convenient methods for creating rounds in tests with sensible defaults
 */
export class RoundFactory {
  /**
   * Create a new round with default values
   */
  static createNew(overrides?: {
    id?: RoundId
    gameId?: GameId
    roundNumber?: RoundNumber
  }): Round {
    const defaults = {
      id: new RoundId(1),
      gameId: new GameId(1),
      roundNumber: new RoundNumber(1),
    }

    const data = { ...defaults, ...overrides }
    return Round.createNew(data.id, data.gameId, data.roundNumber)
  }

  /**
   * Create a completed round with scores
   */
  static createCompleted(
    playerScore: number,
    opponentScore: number,
    overrides?: {
      id?: RoundId
      gameId?: GameId
      roundNumber?: RoundNumber
    }
  ): Round {
    const round = this.createNew(overrides)
    round.completeRound(playerScore, opponentScore)
    return round
  }

  /**
   * Create a round using the reconstruct method (for testing persistence scenarios)
   */
  static reconstruct(overrides?: {
    id?: RoundId
    gameId?: GameId
    roundNumber?: RoundNumber
    playerScore?: number
    opponentScore?: number
    isCompleted?: boolean
    createdAt?: Date
  }): Round {
    const defaults = {
      id: new RoundId(1),
      gameId: new GameId(1),
      roundNumber: new RoundNumber(1),
      playerScore: 0,
      opponentScore: 0,
      isCompleted: false,
      createdAt: new Date(),
    }

    const data = { ...defaults, ...overrides }
    return Round.reconstruct(data)
  }

  /**
   * Create multiple rounds for a specific game
   */
  static createForGame(
    gameId: GameId,
    count: number,
    options?: {
      startingId?: number
      completed?: boolean
      playerScoreRange?: { min: number; max: number }
      opponentScoreRange?: { min: number; max: number }
    }
  ): Round[] {
    const rounds: Round[] = []
    const defaults = {
      startingId: 1,
      completed: false,
      playerScoreRange: { min: 0, max: 20 },
      opponentScoreRange: { min: 0, max: 20 },
    }

    const config = { ...defaults, ...options }

    for (let i = 0; i < count; i++) {
      const roundId = new RoundId(config.startingId + i)
      const roundNumber = new RoundNumber(i + 1)
      const round = Round.createNew(roundId, gameId, roundNumber)

      if (config.completed) {
        const playerScore = this.randomScore(config.playerScoreRange)
        const opponentScore = this.randomScore(config.opponentScoreRange)
        round.completeRound(playerScore, opponentScore)
      }

      rounds.push(round)
    }

    return rounds
  }

  /**
   * Create a batch of rounds with different scenarios
   */
  static createMixedBatch(
    gameId: GameId,
    scenarios: Array<{
      roundNumber: number
      playerScore?: number
      opponentScore?: number
      completed?: boolean
    }>
  ): Round[] {
    return scenarios.map((scenario, index) => {
      const roundId = new RoundId(index + 1)
      const roundNumber = new RoundNumber(scenario.roundNumber)
      const round = Round.createNew(roundId, gameId, roundNumber)

      if (
        scenario.completed &&
        scenario.playerScore !== undefined &&
        scenario.opponentScore !== undefined
      ) {
        round.completeRound(scenario.playerScore, scenario.opponentScore)
      } else if (scenario.playerScore !== undefined || scenario.opponentScore !== undefined) {
        round.updateScores(scenario.playerScore ?? 0, scenario.opponentScore ?? 0)
      }

      return round
    })
  }

  /**
   * Create rounds representing a full game (5 rounds)
   */
  static createFullGame(
    gameId: GameId,
    gameData: {
      roundScores: Array<{ player: number; opponent: number }>
      startingId?: number
    }
  ): Round[] {
    const rounds: Round[] = []
    const startingId = gameData.startingId ?? 1

    gameData.roundScores.forEach((scores, index) => {
      if (index >= 5) return // W40K max 5 rounds

      const roundId = new RoundId(startingId + index)
      const roundNumber = new RoundNumber(index + 1)
      const round = Round.createNew(roundId, gameId, roundNumber)
      round.completeRound(scores.player, scores.opponent)
      rounds.push(round)
    })

    return rounds
  }

  /**
   * Create a progressive game where rounds are partially completed
   */
  static createProgressiveGame(
    gameId: GameId,
    completedRounds: number,
    totalRounds: number = 5
  ): Round[] {
    const rounds: Round[] = []

    for (let i = 1; i <= totalRounds; i++) {
      const roundId = new RoundId(i)
      const roundNumber = new RoundNumber(i)
      const round = Round.createNew(roundId, gameId, roundNumber)

      if (i <= completedRounds) {
        // Complete this round with random scores
        const playerScore = this.randomScore({ min: 5, max: 20 })
        const opponentScore = this.randomScore({ min: 5, max: 20 })
        round.completeRound(playerScore, opponentScore)
      }

      rounds.push(round)
    }

    return rounds
  }

  /**
   * Helper method to generate random scores within a range
   */
  private static randomScore(range: { min: number; max: number }): number {
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
  }
}
