/**
 * GameType Value Object
 * Represents the different types of Warhammer 40K games
 */
export default class GameType {
  private static readonly _matchedPlay = new GameType('MATCHED_PLAY', 'Matched Play')
  private static readonly _narrative = new GameType('NARRATIVE', 'Narrative')
  private static readonly _openPlay = new GameType('OPEN_PLAY', 'Open Play')

  private constructor(
    private readonly _value: string,
    private readonly _displayName: string
  ) {}

  static get MATCHED_PLAY(): GameType {
    return this._matchedPlay
  }

  static get NARRATIVE(): GameType {
    return this._narrative
  }

  static get OPEN_PLAY(): GameType {
    return this._openPlay
  }

  get value(): string {
    return this._value
  }

  get displayName(): string {
    return this._displayName
  }

  equals(other: GameType): boolean {
    return this._value === other._value
  }

  static fromValue(value: string): GameType {
    switch (value) {
      case 'MATCHED_PLAY':
        return this.MATCHED_PLAY
      case 'NARRATIVE':
        return this.NARRATIVE
      case 'OPEN_PLAY':
        return this.OPEN_PLAY
      default:
        throw new Error(`Invalid game type: ${value}`)
    }
  }

  static getAllTypes(): GameType[] {
    return [this.MATCHED_PLAY, this.NARRATIVE, this.OPEN_PLAY]
  }

  toString(): string {
    return this._value
  }
}