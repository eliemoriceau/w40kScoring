import { test } from '@japa/runner'
import RoundId from '#domain/value-objects/round_id'

test.group('RoundId Value Object', () => {
  test('should create a valid RoundId from positive integer', ({ assert }) => {
    const roundId = new RoundId(1)
    assert.equal(roundId.value, 1)
  })

  test('should create RoundId from various positive integers', ({ assert }) => {
    const testValues = [1, 42, 999, 12345]

    testValues.forEach((value) => {
      const roundId = new RoundId(value)
      assert.equal(roundId.value, value)
    })
  })

  test('should throw error for zero or negative values', ({ assert }) => {
    const invalidValues = [0, -1, -42, -999]

    invalidValues.forEach((value) => {
      assert.throws(() => new RoundId(value), `Round ID must be a positive integer, got: ${value}`)
    })
  })

  test('should throw error for non-integer values', ({ assert }) => {
    const invalidValues = [1.5, 2.7, 3.14159, Number.NaN, Infinity]

    invalidValues.forEach((value) => {
      assert.throws(() => new RoundId(value), 'Round ID must be an integer')
    })
  })

  test('should compare equality correctly', ({ assert }) => {
    const roundId1 = new RoundId(42)
    const roundId2 = new RoundId(42)
    const roundId3 = new RoundId(43)

    assert.isTrue(roundId1.equals(roundId2))
    assert.isFalse(roundId1.equals(roundId3))
  })

  test('should convert to string representation', ({ assert }) => {
    const roundId = new RoundId(123)
    assert.equal(roundId.toString(), '123')
  })

  test('should create unique instances with different values', ({ assert }) => {
    const roundId1 = new RoundId(1)
    const roundId2 = new RoundId(2)
    const roundId3 = new RoundId(3)

    assert.isFalse(roundId1.equals(roundId2))
    assert.isFalse(roundId2.equals(roundId3))
    assert.isFalse(roundId1.equals(roundId3))
  })

  test('should handle large positive integers', ({ assert }) => {
    const largeValue = 2147483647 // Max 32-bit signed integer
    const roundId = new RoundId(largeValue)
    assert.equal(roundId.value, largeValue)
  })
})
