import { AggregateRoot } from '#domain/aggregate_root'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import ScoreType from '#domain/value-objects/score_type'
import ScoreName from '#domain/value-objects/score_name'
import ScoreValue from '#domain/value-objects/score_value'
import ScoreCreatedEvent from '#domain/events/score_created_event'
import ScoreUpdatedEvent from '#domain/events/score_updated_event'

/**
 * Score Entity - Aggregate Root
 * Represents a score entry in Warhammer 40K games
 * Manages score data with business rules and domain events
 */
export default class Score extends AggregateRoot {
  private constructor(
    private readonly _id: ScoreId,
    private readonly _roundId: RoundId,
    private readonly _playerId: PlayerId,
    private readonly _scoreType: ScoreType,
    private _scoreName: ScoreName,
    private _scoreValue: ScoreValue,
    private readonly _createdAt: Date
  ) {
    super()
  }

  get id(): ScoreId {
    return this._id
  }

  get roundId(): RoundId {
    return this._roundId
  }

  get playerId(): PlayerId {
    return this._playerId
  }

  get scoreType(): ScoreType {
    return this._scoreType
  }

  get scoreName(): ScoreName {
    return this._scoreName
  }

  get scoreValue(): ScoreValue {
    return this._scoreValue
  }

  get createdAt(): Date {
    return new Date(this._createdAt)
  }

  /**
   * Factory method to create a new Score
   */
  static create(params: {
    roundId: RoundId
    playerId: PlayerId
    scoreType: ScoreType
    scoreName: ScoreName
    scoreValue: ScoreValue
  }): Score {
    const scoreId = new ScoreId(Math.floor(Math.random() * 1000000) + 1) // Temporary ID generation
    const createdAt = new Date()

    // Validate value compatibility with score type
    if (!params.scoreValue.isCompatibleWith(params.scoreType)) {
      throw new Error(
        `Score value ${params.scoreValue.value} is not compatible with score type ${params.scoreType.value}`
      )
    }

    const score = new Score(
      scoreId,
      params.roundId,
      params.playerId,
      params.scoreType,
      params.scoreName,
      params.scoreValue,
      createdAt
    )

    // Raise domain event
    score.addDomainEvent(
      new ScoreCreatedEvent(
        scoreId,
        params.roundId,
        params.playerId,
        params.scoreType,
        params.scoreName,
        params.scoreValue
      )
    )

    return score
  }

  /**
   * Factory method to reconstruct Score from persistence
   */
  static reconstruct(params: {
    id: ScoreId
    roundId: RoundId
    playerId: PlayerId
    scoreType: ScoreType
    scoreName: ScoreName
    scoreValue: ScoreValue
    createdAt: Date
  }): Score {
    return new Score(
      params.id,
      params.roundId,
      params.playerId,
      params.scoreType,
      params.scoreName,
      params.scoreValue,
      params.createdAt
    )
  }

  /**
   * Update the score value
   */
  updateValue(newValue: ScoreValue): void {
    // Check if value is actually different
    if (this._scoreValue.equals(newValue)) {
      return
    }

    // Validate value compatibility with score type
    if (!newValue.isCompatibleWith(this._scoreType)) {
      throw new Error(
        `Score value ${newValue.value} is not compatible with score type ${this._scoreType.value}`
      )
    }

    const oldValue = this._scoreValue
    this._scoreValue = newValue

    // Raise domain event
    this.addDomainEvent(
      new ScoreUpdatedEvent(
        this._id,
        this._roundId,
        this._playerId,
        'value',
        oldValue.toString(),
        newValue.toString()
      )
    )
  }

  /**
   * Update the score name
   */
  updateName(newName: ScoreName): void {
    // Check if name is actually different
    if (this._scoreName.equals(newName)) {
      return
    }

    const oldName = this._scoreName
    this._scoreName = newName

    // Raise domain event
    this.addDomainEvent(
      new ScoreUpdatedEvent(
        this._id,
        this._roundId,
        this._playerId,
        'name',
        oldName.toString(),
        newName.toString()
      )
    )
  }

  /**
   * Check if the score value is positive
   */
  isPositive(): boolean {
    return this._scoreValue.isPositive()
  }

  /**
   * Check if the score value is negative
   */
  isNegative(): boolean {
    return this._scoreValue.isNegative()
  }

  /**
   * Check if the score value is zero
   */
  isZero(): boolean {
    return this._scoreValue.isZero()
  }

  /**
   * Get display information for UI
   */
  getDisplayInfo(): {
    name: string
    value: number
    type: string
    formattedValue: string
  } {
    return {
      name: this._scoreName.value,
      value: this._scoreValue.value,
      type: this._scoreType.getDisplayName(),
      formattedValue: this.formatValueForDisplay(),
    }
  }

  /**
   * Format the score value for display
   */
  private formatValueForDisplay(): string {
    const value = this._scoreValue.value

    if (value === 0) {
      return '0'
    }

    return value > 0 ? `+${value}` : `${value}`
  }
}
