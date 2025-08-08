import { test } from '@japa/runner'
import Score from '#domain/entities/score'
import ScoreId from '#domain/value-objects/score_id'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import ScoreType from '#domain/value-objects/score_type'
import ScoreName from '#domain/value-objects/score_name'
import ScoreValue from '#domain/value-objects/score_value'
import { IdGenerator } from '#domain/services/id_generator'

// Mock IdGenerator for testing
class TestIdGenerator implements IdGenerator {
  private counter = 1

  generateScoreId(): ScoreId {
    return new ScoreId(this.counter++)
  }

  reset() {
    this.counter = 1
  }
}

const testIdGenerator = new TestIdGenerator()

test.group('Score Entity', () => {
  test('should create a new score for objective', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Hold Objective 1'),
      scoreValue: ScoreValue.forType(5, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    assert.instanceOf(score.id, ScoreId)
    assert.isTrue(score.roundId.equals(new RoundId(1)))
    assert.isTrue(score.playerId.equals(new PlayerId(1)))
    assert.isTrue(score.scoreType.equals(new ScoreType('OBJECTIVE')))
    assert.isTrue(score.scoreName.equals(new ScoreName('Hold Objective 1')))
    assert.equal(score.scoreValue.value, 5)
    assert.instanceOf(score.createdAt, Date)
  })

  test('should create a bonus score', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(2),
      playerId: new PlayerId(3),
      scoreType: new ScoreType('BONUS'),
      scoreName: new ScoreName('First Blood'),
      scoreValue: ScoreValue.forType(3, new ScoreType('BONUS')),
      idGenerator: testIdGenerator,
    })

    assert.isTrue(score.scoreType.equals(new ScoreType('BONUS')))
    assert.equal(score.scoreValue.value, 3)
  })

  test('should create a penalty score', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(3),
      playerId: new PlayerId(2),
      scoreType: new ScoreType('PENALTY'),
      scoreName: new ScoreName('Late Deployment'),
      scoreValue: ScoreValue.forType(-5, new ScoreType('PENALTY')),
      idGenerator: testIdGenerator,
    })

    assert.isTrue(score.scoreType.equals(new ScoreType('PENALTY')))
    assert.equal(score.scoreValue.value, -5)
  })

  test('should create primary score', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('PRIMARY'),
      scoreName: new ScoreName('Control Objectives'),
      scoreValue: ScoreValue.forType(15, new ScoreType('PRIMARY')),
      idGenerator: testIdGenerator,
    })

    assert.isTrue(score.scoreType.equals(new ScoreType('PRIMARY')))
    assert.equal(score.scoreValue.value, 15)
  })

  test('should create secondary score', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(2),
      playerId: new PlayerId(4),
      scoreType: new ScoreType('SECONDARY'),
      scoreName: new ScoreName('Assassinate'),
      scoreValue: ScoreValue.forType(12, new ScoreType('SECONDARY')),
      idGenerator: testIdGenerator,
    })

    assert.isTrue(score.scoreType.equals(new ScoreType('SECONDARY')))
    assert.equal(score.scoreValue.value, 12)
  })

  test('should raise ScoreCreatedEvent when creating score', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Capture Point'),
      scoreValue: ScoreValue.forType(3, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    const events = score.getDomainEvents()
    assert.lengthOf(events, 1)
    assert.equal(events[0].eventType, 'ScoreCreated')
  })

  test('should update score value and raise event', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('PRIMARY'),
      scoreName: new ScoreName('Primary Objective'),
      scoreValue: ScoreValue.forType(10, new ScoreType('PRIMARY')),
      idGenerator: testIdGenerator,
    })

    score.clearDomainEvents() // Clear creation event

    const newValue = ScoreValue.forType(15, score.scoreType)
    score.updateValue(newValue)

    assert.equal(score.scoreValue.value, 15)

    const events = score.getDomainEvents()
    assert.lengthOf(events, 1)
    assert.equal(events[0].eventType, 'ScoreUpdated')
  })

  test('should not update to same value', ({ assert }) => {
    testIdGenerator.reset()
    const originalValue = ScoreValue.forType(10, new ScoreType('OBJECTIVE'))
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Objective'),
      scoreValue: originalValue,
      idGenerator: testIdGenerator,
    })

    score.clearDomainEvents()

    const sameValue = ScoreValue.forType(10, new ScoreType('OBJECTIVE'))
    score.updateValue(sameValue)

    // Should not raise event for same value
    const events = score.getDomainEvents()
    assert.lengthOf(events, 0)
  })

  test('should throw error when updating with incompatible score type', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('BONUS'),
      scoreName: new ScoreName('Bonus Score'),
      scoreValue: ScoreValue.forType(5, new ScoreType('BONUS')),
      idGenerator: testIdGenerator,
    })

    const penaltyValue = new ScoreValue(-3) // Negative value for bonus type

    assert.throws(
      () => score.updateValue(penaltyValue),
      'Score value -3 is not compatible with score type BONUS'
    )
  })

  test('should update score name and raise event', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Old Objective'),
      scoreValue: ScoreValue.forType(3, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    score.clearDomainEvents()

    const newName = new ScoreName('New Objective Name')
    score.updateName(newName)

    assert.isTrue(score.scoreName.equals(newName))

    const events = score.getDomainEvents()
    assert.lengthOf(events, 1)
    assert.equal(events[0].eventType, 'ScoreUpdated')
  })

  test('should not update to same name', ({ assert }) => {
    testIdGenerator.reset()
    const originalName = new ScoreName('Objective Name')
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: originalName,
      scoreValue: ScoreValue.forType(3, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    score.clearDomainEvents()

    const sameName = new ScoreName('Objective Name')
    score.updateName(sameName)

    // Should not raise event for same name
    const events = score.getDomainEvents()
    assert.lengthOf(events, 0)
  })

  test('should check if score is positive', ({ assert }) => {
    testIdGenerator.reset()
    const positiveScore = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Positive Score'),
      scoreValue: ScoreValue.forType(5, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    const zeroScore = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Zero Score'),
      scoreValue: ScoreValue.forType(0, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    assert.isTrue(positiveScore.isPositive())
    assert.isFalse(zeroScore.isPositive())
  })

  test('should check if score is negative', ({ assert }) => {
    testIdGenerator.reset()
    const negativeScore = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('PENALTY'),
      scoreName: new ScoreName('Penalty Score'),
      scoreValue: ScoreValue.forType(-5, new ScoreType('PENALTY')),
      idGenerator: testIdGenerator,
    })

    const positiveScore = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Positive Score'),
      scoreValue: ScoreValue.forType(3, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    assert.isTrue(negativeScore.isNegative())
    assert.isFalse(positiveScore.isNegative())
  })

  test('should reconstruct score from persistence data', ({ assert }) => {
    const reconstructedScore = Score.reconstruct({
      id: new ScoreId(42),
      roundId: new RoundId(1),
      playerId: new PlayerId(2),
      scoreType: new ScoreType('PRIMARY'),
      scoreName: new ScoreName('Reconstructed Score'),
      scoreValue: new ScoreValue(20),
      createdAt: new Date('2024-01-15T10:00:00Z'),
    })

    assert.isTrue(reconstructedScore.id.equals(new ScoreId(42)))
    assert.isTrue(reconstructedScore.roundId.equals(new RoundId(1)))
    assert.isTrue(reconstructedScore.playerId.equals(new PlayerId(2)))
    assert.isTrue(reconstructedScore.scoreType.equals(new ScoreType('PRIMARY')))
    assert.equal(reconstructedScore.scoreValue.value, 20)
    assert.equal(reconstructedScore.createdAt.toISOString(), '2024-01-15T10:00:00.000Z')
  })

  test('should clear domain events after retrieval', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Test Score'),
      scoreValue: ScoreValue.forType(5, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    // Should have creation event
    assert.lengthOf(score.getDomainEvents(), 1)

    // Clear events
    score.clearDomainEvents()
    assert.lengthOf(score.getDomainEvents(), 0)
  })

  test('should check if score has domain events', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Test Score'),
      scoreValue: ScoreValue.forType(5, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    assert.isTrue(score.hasDomainEvents())

    score.clearDomainEvents()
    assert.isFalse(score.hasDomainEvents())
  })

  test('should get display information', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('SECONDARY'),
      scoreName: new ScoreName('Assassinate Enemy Warlord'),
      scoreValue: ScoreValue.forType(15, new ScoreType('SECONDARY')),
      idGenerator: testIdGenerator,
    })

    const displayInfo = score.getDisplayInfo()
    assert.equal(displayInfo.name, 'Assassinate Enemy Warlord')
    assert.equal(displayInfo.value, 15)
    assert.equal(displayInfo.type, 'Secondary')
    assert.equal(displayInfo.formattedValue, '+15')
  })

  test('should format negative value correctly', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('PENALTY'),
      scoreName: new ScoreName('Late Deployment'),
      scoreValue: ScoreValue.forType(-10, new ScoreType('PENALTY')),
      idGenerator: testIdGenerator,
    })

    const displayInfo = score.getDisplayInfo()
    assert.equal(displayInfo.formattedValue, '-10')
  })

  test('should format zero value correctly', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Missed Objective'),
      scoreValue: ScoreValue.forType(0, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    const displayInfo = score.getDisplayInfo()
    assert.equal(displayInfo.formattedValue, '0')
  })
})
