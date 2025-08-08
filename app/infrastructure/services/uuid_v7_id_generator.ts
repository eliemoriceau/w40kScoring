import { v7 as uuidv7 } from 'uuid'
import { IdGenerator } from '#domain/services/id_generator'
import ScoreId from '#domain/value-objects/score_id'

/**
 * UuidV7IdGenerator - Infrastructure Implementation
 * Implements IdGenerator using UUID v7 for time-ordered, unique identifiers
 * UUID v7 provides temporal ordering which is useful for Score entities
 */
export default class UuidV7IdGenerator implements IdGenerator {
  generateScoreId(): ScoreId {
    const uuid = uuidv7()
    return new ScoreId(uuid)
  }
}
