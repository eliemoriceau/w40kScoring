import { test } from '@japa/runner'
import ScoreId from '#domain/value-objects/score_id'

test.group('ScoreId Value Object', () => {
  test('should create a valid ScoreId from positive integer', ({ assert }) => {
    const scoreId = new ScoreId(1)

    assert.equal(scoreId.value, 1)
    assert.equal(scoreId.toString(), '1')
  })

  test('should create ScoreId from various positive integers', ({ assert }) => {
    const validIds = [1, 5, 100, 999, 123456]

    validIds.forEach((id) => {
      const scoreId = new ScoreId(id)
      assert.equal(scoreId.value, id)
    })
  })

  test('should throw error for zero or negative values', ({ assert }) => {
    const invalidIds = [0, -1, -5, -100]

    invalidIds.forEach((id) => {
      assert.throws(() => new ScoreId(id), `Score ID must be a positive integer, got: ${id}`)
    })
  })

  test('should throw error for non-integer values', ({ assert }) => {
    const invalidIds = [1.5, 3.14, Number.NaN, Infinity, -Infinity]

    invalidIds.forEach((id) => {
      assert.throws(() => new ScoreId(id), 'Score ID must be an integer')
    })
  })

  test('should compare equality correctly', ({ assert }) => {
    const scoreId1 = new ScoreId(42)
    const scoreId2 = new ScoreId(42)
    const scoreId3 = new ScoreId(43)

    assert.isTrue(scoreId1.equals(scoreId2))
    assert.isFalse(scoreId1.equals(scoreId3))
  })

  test('should convert to string representation', ({ assert }) => {
    const scoreId = new ScoreId(123)

    assert.equal(scoreId.toString(), '123')
  })

  test('should create unique instances with different values', ({ assert }) => {
    const scoreId1 = new ScoreId(1)
    const scoreId2 = new ScoreId(2)

    assert.notEqual(scoreId1, scoreId2)
    assert.isFalse(scoreId1.equals(scoreId2))
  })

  test('should handle large positive integers', ({ assert }) => {
    const largeId = 2147483647 // Max 32-bit signed integer
    const scoreId = new ScoreId(largeId)

    assert.equal(scoreId.value, largeId)
  })
})
