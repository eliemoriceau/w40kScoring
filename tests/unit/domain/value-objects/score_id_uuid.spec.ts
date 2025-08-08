import { test } from '@japa/runner'
import ScoreId from '#domain/value-objects/score_id'

test.group('ScoreId with UUID Support', () => {
  test('should create a valid ScoreId from UUID v7 string', ({ assert }) => {
    const uuid = '01936240-c5d4-7001-b3e4-d6ac2e5b4f8e'
    const scoreId = new ScoreId(uuid)

    assert.equal(scoreId.value, uuid)
  })

  test('should create a valid ScoreId from legacy integer', ({ assert }) => {
    const numericId = 12345
    const scoreId = new ScoreId(numericId)

    assert.equal(scoreId.value, numericId.toString())
  })

  test('should validate UUID v7 format', ({ assert }) => {
    const validUuidV7 = '01936240-c5d4-7001-b3e4-d6ac2e5b4f8e'

    assert.doesNotThrow(() => {
      new ScoreId(validUuidV7)
    })
  })

  test('should throw error for invalid UUID format', ({ assert }) => {
    const invalidUuid = 'not-a-uuid'

    assert.throws(() => {
      new ScoreId(invalidUuid)
    }, 'Invalid ScoreId format. Must be a valid UUID or positive integer')
  })

  test('should throw error for negative integer', ({ assert }) => {
    assert.throws(() => {
      new ScoreId(-1)
    }, 'Score ID must be a positive integer')
  })

  test('should throw error for zero', ({ assert }) => {
    assert.throws(() => {
      new ScoreId(0)
    }, 'Score ID must be a positive integer')
  })

  test('should compare equality correctly for UUIDs', ({ assert }) => {
    const uuid = '01936240-c5d4-7001-b3e4-d6ac2e5b4f8e'
    const scoreId1 = new ScoreId(uuid)
    const scoreId2 = new ScoreId(uuid)
    const differentUuid = '01936240-c5d4-7001-b3e4-d6ac2e5b4f8f' // Valid different UUID

    assert.isTrue(scoreId1.equals(scoreId2))

    const scoreId3 = new ScoreId(differentUuid)
    assert.isFalse(scoreId1.equals(scoreId3))
  })

  test('should compare equality correctly for numbers', ({ assert }) => {
    const scoreId1 = new ScoreId(123)
    const scoreId2 = new ScoreId(123)
    const scoreId3 = new ScoreId(456)

    assert.isTrue(scoreId1.equals(scoreId2))
    assert.isFalse(scoreId1.equals(scoreId3))
  })

  test('should convert to string representation correctly', ({ assert }) => {
    const uuid = '01936240-c5d4-7001-b3e4-d6ac2e5b4f8e'
    const scoreId1 = new ScoreId(uuid)
    const scoreId2 = new ScoreId(123)

    assert.equal(scoreId1.toString(), uuid)
    assert.equal(scoreId2.toString(), '123')
  })

  test('should handle mixed UUID and integer comparison', ({ assert }) => {
    const scoreId1 = new ScoreId('01936240-c5d4-7001-b3e4-d6ac2e5b4f8e')
    const scoreId2 = new ScoreId(123)

    assert.isFalse(scoreId1.equals(scoreId2))
  })
})
