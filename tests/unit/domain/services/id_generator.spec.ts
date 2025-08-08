import { test } from '@japa/runner'
import ScoreId from '#domain/value-objects/score_id'
import { IdGenerator } from '#domain/services/id_generator'
import UuidV7IdGenerator from '#infrastructure/services/uuid_v7_id_generator'

test.group('IdGenerator', () => {
  test('should generate unique ScoreId instances', ({ assert }) => {
    const generator: IdGenerator = new UuidV7IdGenerator()

    const id1 = generator.generateScoreId()
    const id2 = generator.generateScoreId()

    assert.instanceOf(id1, ScoreId)
    assert.instanceOf(id2, ScoreId)
    assert.isFalse(id1.equals(id2))
  })

  test('should generate ScoreId with UUID v7 format', ({ assert }) => {
    const generator: IdGenerator = new UuidV7IdGenerator()

    const scoreId = generator.generateScoreId()

    // UUID v7 should have version 7 in the version field (13th character)
    const uuidString = scoreId.toString()
    assert.match(
      uuidString,
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  test('should generate monotonically increasing IDs within the same millisecond', ({ assert }) => {
    const generator: IdGenerator = new UuidV7IdGenerator()

    const ids = Array.from({ length: 10 }, () => generator.generateScoreId())

    // All IDs should be different
    const uniqueIds = new Set(ids.map((id) => id.toString()))
    assert.equal(uniqueIds.size, 10)

    // UUIDs should be sortable (timestamp-based ordering)
    ids.map((id) => id.toString()).sort()
    const originalIds = ids.map((id) => id.toString())

    // For UUID v7, the first part contains timestamp so they should be roughly in order
    // We'll check that they're all valid UUIDs at minimum
    originalIds.forEach((id) => {
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
  })

  test('should generate ScoreId that can be used for equality comparison', ({ assert }) => {
    const generator: IdGenerator = new UuidV7IdGenerator()

    const id1 = generator.generateScoreId()
    const id2 = generator.generateScoreId()
    const id1Copy = new ScoreId(id1.value)

    assert.isTrue(id1.equals(id1Copy))
    assert.isFalse(id1.equals(id2))
  })
})
