import { test } from '@japa/runner'
import ScoreValue from '#domain/value-objects/score_value'
import ScoreType from '#domain/value-objects/score_type'

test.group('ScoreValue Value Object', () => {
  test('should create a valid positive ScoreValue', ({ assert }) => {
    const scoreValue = new ScoreValue(15)

    assert.equal(scoreValue.value, 15)
    assert.equal(scoreValue.toString(), '15')
  })

  test('should create a valid negative ScoreValue', ({ assert }) => {
    const scoreValue = new ScoreValue(-5)

    assert.equal(scoreValue.value, -5)
    assert.equal(scoreValue.toString(), '-5')
  })

  test('should create a zero ScoreValue', ({ assert }) => {
    const scoreValue = new ScoreValue(0)

    assert.equal(scoreValue.value, 0)
    assert.equal(scoreValue.toString(), '0')
  })

  test('should throw error for non-integer values', ({ assert }) => {
    const invalidValues = [1.5, 3.14, -2.7, Number.NaN, Infinity, -Infinity]

    invalidValues.forEach((value) => {
      assert.throws(() => new ScoreValue(value), 'Score value must be an integer')
    })
  })

  test('should validate positive values with OBJECTIVE score type', ({ assert }) => {
    const objectiveType = new ScoreType('OBJECTIVE')

    const positiveValue = ScoreValue.forType(10, objectiveType)
    assert.equal(positiveValue.value, 10)

    const zeroValue = ScoreValue.forType(0, objectiveType)
    assert.equal(zeroValue.value, 0)
  })

  test('should throw error for negative values with OBJECTIVE score type', ({ assert }) => {
    const objectiveType = new ScoreType('OBJECTIVE')

    assert.throws(
      () => ScoreValue.forType(-5, objectiveType),
      'OBJECTIVE score type does not allow negative values, got: -5'
    )
  })

  test('should validate positive values with BONUS score type', ({ assert }) => {
    const bonusType = new ScoreType('BONUS')

    const positiveValue = ScoreValue.forType(3, bonusType)
    assert.equal(positiveValue.value, 3)

    const zeroValue = ScoreValue.forType(0, bonusType)
    assert.equal(zeroValue.value, 0)
  })

  test('should throw error for negative values with BONUS score type', ({ assert }) => {
    const bonusType = new ScoreType('BONUS')

    assert.throws(
      () => ScoreValue.forType(-2, bonusType),
      'BONUS score type does not allow negative values, got: -2'
    )
  })

  test('should validate negative values with PENALTY score type', ({ assert }) => {
    const penaltyType = new ScoreType('PENALTY')

    const negativeValue = ScoreValue.forType(-10, penaltyType)
    assert.equal(negativeValue.value, -10)

    const zeroValue = ScoreValue.forType(0, penaltyType)
    assert.equal(zeroValue.value, 0)
  })

  test('should throw error for positive values with PENALTY score type', ({ assert }) => {
    const penaltyType = new ScoreType('PENALTY')

    assert.throws(
      () => ScoreValue.forType(5, penaltyType),
      'PENALTY score type does not allow positive values, got: 5'
    )
  })

  test('should validate positive values with PRIMARY score type', ({ assert }) => {
    const primaryType = new ScoreType('PRIMARY')

    const positiveValue = ScoreValue.forType(45, primaryType)
    assert.equal(positiveValue.value, 45)

    const zeroValue = ScoreValue.forType(0, primaryType)
    assert.equal(zeroValue.value, 0)
  })

  test('should validate positive values with SECONDARY score type', ({ assert }) => {
    const secondaryType = new ScoreType('SECONDARY')

    const positiveValue = ScoreValue.forType(15, secondaryType)
    assert.equal(positiveValue.value, 15)

    const zeroValue = ScoreValue.forType(0, secondaryType)
    assert.equal(zeroValue.value, 0)
  })

  test('should compare equality correctly', ({ assert }) => {
    const scoreValue1 = new ScoreValue(10)
    const scoreValue2 = new ScoreValue(10)
    const scoreValue3 = new ScoreValue(15)

    assert.isTrue(scoreValue1.equals(scoreValue2))
    assert.isFalse(scoreValue1.equals(scoreValue3))
  })

  test('should check if value is positive', ({ assert }) => {
    const positiveValue = new ScoreValue(5)
    const zeroValue = new ScoreValue(0)
    const negativeValue = new ScoreValue(-3)

    assert.isTrue(positiveValue.isPositive())
    assert.isFalse(zeroValue.isPositive())
    assert.isFalse(negativeValue.isPositive())
  })

  test('should check if value is negative', ({ assert }) => {
    const positiveValue = new ScoreValue(5)
    const zeroValue = new ScoreValue(0)
    const negativeValue = new ScoreValue(-3)

    assert.isFalse(positiveValue.isNegative())
    assert.isFalse(zeroValue.isNegative())
    assert.isTrue(negativeValue.isNegative())
  })

  test('should check if value is zero', ({ assert }) => {
    const positiveValue = new ScoreValue(5)
    const zeroValue = new ScoreValue(0)
    const negativeValue = new ScoreValue(-3)

    assert.isFalse(positiveValue.isZero())
    assert.isTrue(zeroValue.isZero())
    assert.isFalse(negativeValue.isZero())
  })

  test('should get absolute value', ({ assert }) => {
    const positiveValue = new ScoreValue(5)
    const negativeValue = new ScoreValue(-8)
    const zeroValue = new ScoreValue(0)

    assert.equal(positiveValue.absolute(), 5)
    assert.equal(negativeValue.absolute(), 8)
    assert.equal(zeroValue.absolute(), 0)
  })

  test('should add two score values', ({ assert }) => {
    const value1 = new ScoreValue(10)
    const value2 = new ScoreValue(5)
    const value3 = new ScoreValue(-3)

    const sum1 = value1.add(value2)
    const sum2 = value1.add(value3)

    assert.equal(sum1.value, 15)
    assert.equal(sum2.value, 7)
  })

  test('should handle Warhammer 40K specific score ranges', ({ assert }) => {
    // Primary objectives typically 0-45 points
    const maxPrimary = new ScoreValue(45)
    assert.equal(maxPrimary.value, 45)

    // Secondary objectives typically 0-15 points
    const maxSecondary = new ScoreValue(15)
    assert.equal(maxSecondary.value, 15)

    // Penalties can be significant negative values
    const bigPenalty = new ScoreValue(-20)
    assert.equal(bigPenalty.value, -20)
  })
})
