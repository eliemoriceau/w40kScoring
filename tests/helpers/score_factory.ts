import Score from '#domain/entities/score'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import ScoreType from '#domain/value-objects/score_type'
import ScoreName from '#domain/value-objects/score_name'
import ScoreValue from '#domain/value-objects/score_value'
import { IdGenerator } from '#domain/services/id_generator'

/**
 * Test IdGenerator for consistent test results
 */
class TestIdGenerator implements IdGenerator {
  private scoreCounter = 1
  private playerCounter = 1

  generateScoreId(): ScoreId {
    return new ScoreId(this.scoreCounter++)
  }

  generatePlayerId(): PlayerId {
    return new PlayerId(this.playerCounter++)
  }

  reset() {
    this.scoreCounter = 1
    this.playerCounter = 1
  }
}

/**
 * ScoreFactory - Test Helper
 * Provides convenient methods to create Score entities for testing purposes
 * Follows the same pattern as other factories in the system
 */
export class ScoreFactory {
  private static defaultRoundId = new RoundId(1)
  private static defaultPlayerId = new PlayerId(1)
  private static testIdGenerator = new TestIdGenerator()

  /**
   * Create a basic objective score
   */
  static createObjective(
    options: {
      roundId?: RoundId
      playerId?: PlayerId
      scoreName?: string
      scoreValue?: number
      idGenerator?: IdGenerator
    } = {}
  ): Score {
    const scoreType = new ScoreType('OBJECTIVE')
    const scoreName = new ScoreName(options.scoreName ?? 'Hold Objective 1')
    const scoreValue = ScoreValue.forType(options.scoreValue ?? 5, scoreType)

    return Score.create({
      roundId: options.roundId ?? this.defaultRoundId,
      playerId: options.playerId ?? this.defaultPlayerId,
      scoreType,
      scoreName,
      scoreValue,
      idGenerator: options.idGenerator ?? this.testIdGenerator,
    })
  }

  /**
   * Create a bonus score
   */
  static createBonus(
    options: {
      roundId?: RoundId
      playerId?: PlayerId
      scoreName?: string
      scoreValue?: number
      idGenerator?: IdGenerator
    } = {}
  ): Score {
    const scoreType = new ScoreType('BONUS')
    const scoreName = new ScoreName(options.scoreName ?? 'First Blood')
    const scoreValue = ScoreValue.forType(options.scoreValue ?? 3, scoreType)

    return Score.create({
      roundId: options.roundId ?? this.defaultRoundId,
      playerId: options.playerId ?? this.defaultPlayerId,
      scoreType,
      scoreName,
      scoreValue,
      idGenerator: options.idGenerator ?? this.testIdGenerator,
    })
  }

  /**
   * Create a penalty score
   */
  static createPenalty(
    options: {
      roundId?: RoundId
      playerId?: PlayerId
      scoreName?: string
      scoreValue?: number
      idGenerator?: IdGenerator
    } = {}
  ): Score {
    const scoreType = new ScoreType('PENALTY')
    const scoreName = new ScoreName(options.scoreName ?? 'Late Deployment')
    const scoreValue = ScoreValue.forType(options.scoreValue ?? -5, scoreType)

    return Score.create({
      roundId: options.roundId ?? this.defaultRoundId,
      playerId: options.playerId ?? this.defaultPlayerId,
      scoreType,
      scoreName,
      scoreValue,
      idGenerator: options.idGenerator ?? this.testIdGenerator,
    })
  }

  /**
   * Create a primary score
   */
  static createPrimary(
    options: {
      roundId?: RoundId
      playerId?: PlayerId
      scoreName?: string
      scoreValue?: number
      idGenerator?: IdGenerator
    } = {}
  ): Score {
    const scoreType = new ScoreType('PRIMARY')
    const scoreName = new ScoreName(options.scoreName ?? 'Control Objectives')
    const scoreValue = ScoreValue.forType(options.scoreValue ?? 15, scoreType)

    return Score.create({
      roundId: options.roundId ?? this.defaultRoundId,
      playerId: options.playerId ?? this.defaultPlayerId,
      scoreType,
      scoreName,
      scoreValue,
      idGenerator: options.idGenerator ?? this.testIdGenerator,
    })
  }

  /**
   * Create a secondary score
   */
  static createSecondary(
    options: {
      roundId?: RoundId
      playerId?: PlayerId
      scoreName?: string
      scoreValue?: number
      idGenerator?: IdGenerator
    } = {}
  ): Score {
    const scoreType = new ScoreType('SECONDARY')
    const scoreName = new ScoreName(options.scoreName ?? 'Assassinate')
    const scoreValue = ScoreValue.forType(options.scoreValue ?? 12, scoreType)

    return Score.create({
      roundId: options.roundId ?? this.defaultRoundId,
      playerId: options.playerId ?? this.defaultPlayerId,
      scoreType,
      scoreName,
      scoreValue,
      idGenerator: options.idGenerator ?? this.testIdGenerator,
    })
  }

  /**
   * Create a complete set of scores for a round
   */
  static createForRound(roundId: RoundId, playerId?: PlayerId): Score[] {
    const targetPlayerId = playerId ?? this.defaultPlayerId

    return [
      this.createPrimary({ roundId, playerId: targetPlayerId, scoreValue: 15 }),
      this.createSecondary({
        roundId,
        playerId: targetPlayerId,
        scoreName: 'Assassinate',
        scoreValue: 10,
      }),
      this.createSecondary({
        roundId,
        playerId: targetPlayerId,
        scoreName: 'Linebreaker',
        scoreValue: 8,
      }),
      this.createObjective({
        roundId,
        playerId: targetPlayerId,
        scoreName: 'Hold Objective 1',
        scoreValue: 5,
      }),
      this.createObjective({
        roundId,
        playerId: targetPlayerId,
        scoreName: 'Hold Objective 2',
        scoreValue: 3,
      }),
      this.createBonus({
        roundId,
        playerId: targetPlayerId,
        scoreName: 'First Blood',
        scoreValue: 3,
      }),
    ]
  }

  /**
   * Create scores for multiple players in a round
   */
  static createForRoundWithPlayers(roundId: RoundId, playerIds: PlayerId[]): Score[] {
    const scores: Score[] = []

    playerIds.forEach((playerId, index) => {
      const baseScore = 10 + index * 2 // Varying scores
      scores.push(
        this.createPrimary({ roundId, playerId, scoreValue: baseScore }),
        this.createSecondary({
          roundId,
          playerId,
          scoreName: 'Assassinate',
          scoreValue: Math.max(0, baseScore - 5),
        }),
        this.createObjective({
          roundId,
          playerId,
          scoreName: `Hold Objective ${index + 1}`,
          scoreValue: Math.max(0, baseScore / 3),
        })
      )
    })

    return scores
  }

  /**
   * Create a mixed set of scores (positive, negative, zero)
   */
  static createMixedScores(
    options: {
      roundId?: RoundId
      playerId?: PlayerId
    } = {}
  ): Score[] {
    return [
      this.createPrimary({ ...options, scoreValue: 20 }), // Positive
      this.createSecondary({ ...options, scoreName: 'Assassinate', scoreValue: 0 }), // Zero
      this.createPenalty({ ...options, scoreName: 'Late Deployment', scoreValue: -3 }), // Negative
      this.createBonus({ ...options, scoreName: 'Slay the Warlord', scoreValue: 5 }), // Positive
      this.createObjective({ ...options, scoreName: 'Hold Center', scoreValue: 0 }), // Zero
    ]
  }

  /**
   * Create a high-scoring scenario
   */
  static createHighScoreScenario(
    options: {
      roundId?: RoundId
      playerId?: PlayerId
    } = {}
  ): Score[] {
    return [
      this.createPrimary({ ...options, scoreValue: 45 }), // Max primary
      this.createSecondary({ ...options, scoreName: 'Assassinate', scoreValue: 15 }), // Max secondary
      this.createSecondary({ ...options, scoreName: 'Linebreaker', scoreValue: 15 }), // Max secondary
      this.createSecondary({ ...options, scoreName: 'Engage on All Fronts', scoreValue: 15 }), // Max secondary
      this.createBonus({ ...options, scoreName: 'First Blood', scoreValue: 5 }),
      this.createBonus({ ...options, scoreName: 'Slay the Warlord', scoreValue: 5 }),
    ]
  }

  /**
   * Create a low-scoring scenario with penalties
   */
  static createLowScoreScenario(
    options: {
      roundId?: RoundId
      playerId?: PlayerId
    } = {}
  ): Score[] {
    return [
      this.createPrimary({ ...options, scoreValue: 3 }), // Low primary
      this.createSecondary({ ...options, scoreName: 'Failed Objective', scoreValue: 0 }),
      this.createPenalty({ ...options, scoreName: 'Late Deployment', scoreValue: -10 }),
      this.createPenalty({ ...options, scoreName: 'Army List Error', scoreValue: -5 }),
      this.createObjective({ ...options, scoreName: 'Lost Objective', scoreValue: 0 }),
    ]
  }

  /**
   * Create a score with specific properties for reconstruction testing
   */
  static createForReconstruction(options: {
    id?: ScoreId
    roundId?: RoundId
    playerId?: PlayerId
    scoreType?: ScoreType
    scoreName?: ScoreName
    scoreValue?: ScoreValue
    createdAt?: Date
  }): Score {
    return Score.reconstruct({
      id: options.id ?? new ScoreId(42),
      roundId: options.roundId ?? this.defaultRoundId,
      playerId: options.playerId ?? this.defaultPlayerId,
      scoreType: options.scoreType ?? new ScoreType('OBJECTIVE'),
      scoreName: options.scoreName ?? new ScoreName('Test Score'),
      scoreValue: options.scoreValue ?? new ScoreValue(10),
      createdAt: options.createdAt ?? new Date('2024-01-15T10:00:00Z'),
    })
  }

  /**
   * Create scores by type for testing type-specific queries
   */
  static createByType(
    scoreType: ScoreType,
    count: number,
    options: {
      roundId?: RoundId
      playerId?: PlayerId
      idGenerator?: IdGenerator
    } = {}
  ): Score[] {
    const scores: Score[] = []

    for (let i = 0; i < count; i++) {
      const scoreValue = scoreType.allowsNegativeValues()
        ? ScoreValue.forType(-3 - i, scoreType)
        : ScoreValue.forType(5 + i, scoreType)

      const scoreName = new ScoreName(`${scoreType.getDisplayName()} Score ${i + 1}`)

      scores.push(
        Score.create({
          roundId: options.roundId ?? this.defaultRoundId,
          playerId: options.playerId ?? this.defaultPlayerId,
          scoreType,
          scoreName,
          scoreValue,
          idGenerator: options.idGenerator ?? this.testIdGenerator,
        })
      )
    }

    return scores
  }
}
