import { test } from '@japa/runner'
import ScoreType from '#domain/value-objects/score_type'

test.group('ScoreType Value Object', () => {
  test('should create valid ScoreType for OBJECTIVE', ({ assert }) => {
    const scoreType = new ScoreType('OBJECTIVE')

    assert.equal(scoreType.value, 'OBJECTIVE')
    assert.equal(scoreType.toString(), 'OBJECTIVE')
  })

  test('should create valid ScoreType for BONUS', ({ assert }) => {
    const scoreType = new ScoreType('BONUS')

    assert.equal(scoreType.value, 'BONUS')
    assert.equal(scoreType.toString(), 'BONUS')
  })

  test('should create valid ScoreType for PENALTY', ({ assert }) => {
    const scoreType = new ScoreType('PENALTY')

    assert.equal(scoreType.value, 'PENALTY')
    assert.equal(scoreType.toString(), 'PENALTY')
  })

  test('should create valid ScoreType for PRIMARY', ({ assert }) => {
    const scoreType = new ScoreType('PRIMARY')

    assert.equal(scoreType.value, 'PRIMARY')
    assert.equal(scoreType.toString(), 'PRIMARY')
  })

  test('should create valid ScoreType for SECONDARY', ({ assert }) => {
    const scoreType = new ScoreType('SECONDARY')

    assert.equal(scoreType.value, 'SECONDARY')
    assert.equal(scoreType.toString(), 'SECONDARY')
  })

  test('should compare equality correctly', ({ assert }) => {
    const scoreType1 = new ScoreType('OBJECTIVE')
    const scoreType2 = new ScoreType('OBJECTIVE')
    const scoreType3 = new ScoreType('BONUS')

    assert.isTrue(scoreType1.equals(scoreType2))
    assert.isFalse(scoreType1.equals(scoreType3))
  })

  test('should create from valid string value', ({ assert }) => {
    const scoreType = ScoreType.fromString('PENALTY')

    assert.equal(scoreType.value, 'PENALTY')
  })

  test('should throw error for invalid string value', ({ assert }) => {
    const invalidTypes = ['INVALID', 'unknown', 'objective', '']

    invalidTypes.forEach((type) => {
      assert.throws(
        () => new ScoreType(type as any),
        `Invalid score type: ${type}. Valid types are: OBJECTIVE, BONUS, PENALTY, PRIMARY, SECONDARY`
      )
    })
  })

  test('should throw error for invalid fromString value', ({ assert }) => {
    assert.throws(
      () => ScoreType.fromString('INVALID'),
      'Invalid score type: INVALID. Valid types are: OBJECTIVE, BONUS, PENALTY, PRIMARY, SECONDARY'
    )
  })

  test('should list all valid score types', ({ assert }) => {
    const validTypes = ScoreType.getAllValidTypes()

    assert.deepEqual(validTypes, ['OBJECTIVE', 'BONUS', 'PENALTY', 'PRIMARY', 'SECONDARY'])
  })

  test('should check if score type allows positive values', ({ assert }) => {
    const objective = new ScoreType('OBJECTIVE')
    const bonus = new ScoreType('BONUS')
    const penalty = new ScoreType('PENALTY')
    const primary = new ScoreType('PRIMARY')
    const secondary = new ScoreType('SECONDARY')

    assert.isTrue(objective.allowsPositiveValues())
    assert.isTrue(bonus.allowsPositiveValues())
    assert.isFalse(penalty.allowsPositiveValues()) // Penalties are negative
    assert.isTrue(primary.allowsPositiveValues())
    assert.isTrue(secondary.allowsPositiveValues())
  })

  test('should check if score type allows negative values', ({ assert }) => {
    const objective = new ScoreType('OBJECTIVE')
    const bonus = new ScoreType('BONUS')
    const penalty = new ScoreType('PENALTY')
    const primary = new ScoreType('PRIMARY')
    const secondary = new ScoreType('SECONDARY')

    assert.isFalse(objective.allowsNegativeValues())
    assert.isFalse(bonus.allowsNegativeValues())
    assert.isTrue(penalty.allowsNegativeValues()) // Penalties are negative
    assert.isFalse(primary.allowsNegativeValues())
    assert.isFalse(secondary.allowsNegativeValues())
  })

  test('should get display name', ({ assert }) => {
    const objective = new ScoreType('OBJECTIVE')
    const bonus = new ScoreType('BONUS')
    const penalty = new ScoreType('PENALTY')
    const primary = new ScoreType('PRIMARY')
    const secondary = new ScoreType('SECONDARY')

    assert.equal(objective.getDisplayName(), 'Objective')
    assert.equal(bonus.getDisplayName(), 'Bonus')
    assert.equal(penalty.getDisplayName(), 'Penalty')
    assert.equal(primary.getDisplayName(), 'Primary')
    assert.equal(secondary.getDisplayName(), 'Secondary')
  })
})
