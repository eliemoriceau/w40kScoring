import { v7 as uuidv7 } from 'uuid'
import { IdGenerator } from '#domain/services/id_generator'
import ScoreId from '#domain/value-objects/score_id'
import PlayerId from '#domain/value-objects/player_id'

/**
 * UuidV7IdGenerator - Infrastructure Implementation
 * Implements IdGenerator using UUID v7 for time-ordered, unique identifiers
 * UUID v7 provides temporal ordering which is useful for Score entities
 *
 * Note: PlayerId generation uses negative numbers as temporary IDs
 * The database will assign final auto-increment IDs through repository.save()
 */
export default class UuidV7IdGenerator implements IdGenerator {
  private playerIdCounter = -1

  generateScoreId(): ScoreId {
    const uuid = uuidv7()
    return new ScoreId(uuid)
  }

  generatePlayerId(): PlayerId {
    // Use positive sequential numbers for temporary player IDs
    // The repository will replace these with proper auto-increment IDs from the database
    return new PlayerId(Math.abs(this.playerIdCounter--))
  }
}
