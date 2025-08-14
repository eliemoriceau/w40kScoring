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
  private scoreCounter = 1
  private playerCounter = 1

  generateScoreId(): ScoreId {
    return new ScoreId(this.scoreCounter++)
  }

  generatePlayerId(): PlayerId {
    return new PlayerId(this.playerCounter++)
  }

  reset() {
    this.scoreCounter = 1
    this.playerCounter = 1
  }
}

const testIdGenerator = new TestIdGenerator()

test.group('Score Domain Events', () => {
  test('should raise ScoreCreatedEvent when score is created', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(2),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Hold Objective 1'),
      scoreValue: ScoreValue.forType(5, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    const events = score.getDomainEvents()
    assert.lengthOf(events, 1)

    const event = events[0]
    assert.equal(event.eventType, 'ScoreCreated')
    assert.equal(event.data.roundId, 1)
    assert.equal(event.data.playerId, 2)
    assert.equal(event.data.scoreType, 'OBJECTIVE')
    assert.equal(event.data.scoreName, 'Hold Objective 1')
    assert.equal(event.data.scoreValue, 5)
    assert.isString(event.eventId)
    assert.instanceOf(event.occurredOn, Date)
  })

  test('should raise ScoreUpdatedEvent when value is updated', ({ assert }) => {
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

    const events = score.getDomainEvents()
    assert.lengthOf(events, 1)

    const event = events[0]
    assert.equal(event.eventType, 'ScoreUpdated')
    assert.equal(event.data.fieldChanged, 'value')
    assert.equal(event.data.oldValue, '10')
    assert.equal(event.data.newValue, '15')
  })

  test('should raise ScoreUpdatedEvent when name is updated', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('SECONDARY'),
      scoreName: new ScoreName('Old Name'),
      scoreValue: ScoreValue.forType(8, new ScoreType('SECONDARY')),
      idGenerator: testIdGenerator,
    })

    score.clearDomainEvents() // Clear creation event

    const newName = new ScoreName('New Name Updated')
    score.updateName(newName)

    const events = score.getDomainEvents()
    assert.lengthOf(events, 1)

    const event = events[0]
    assert.equal(event.eventType, 'ScoreUpdated')
    assert.equal(event.data.fieldChanged, 'name')
    assert.equal(event.data.oldValue, 'Old Name')
    assert.equal(event.data.newValue, 'New Name Updated')
  })

  test('should not raise event when updating to same value', ({ assert }) => {
    testIdGenerator.reset()
    const originalValue = ScoreValue.forType(10, new ScoreType('OBJECTIVE'))
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Test Score'),
      scoreValue: originalValue,
      idGenerator: testIdGenerator,
    })

    score.clearDomainEvents()

    const sameValue = ScoreValue.forType(10, new ScoreType('OBJECTIVE'))
    score.updateValue(sameValue)

    const events = score.getDomainEvents()
    assert.lengthOf(events, 0)
  })

  test('should not raise event when updating to same name', ({ assert }) => {
    testIdGenerator.reset()
    const originalName = new ScoreName('Test Name')
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: originalName,
      scoreValue: ScoreValue.forType(5, new ScoreType('OBJECTIVE')),
      idGenerator: testIdGenerator,
    })

    score.clearDomainEvents()

    const sameName = new ScoreName('Test Name')
    score.updateName(sameName)

    const events = score.getDomainEvents()
    assert.lengthOf(events, 0)
  })

  test('should clear domain events', ({ assert }) => {
    testIdGenerator.reset()
    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('BONUS'),
      scoreName: new ScoreName('Bonus Score'),
      scoreValue: ScoreValue.forType(3, new ScoreType('BONUS')),
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
      scoreType: new ScoreType('PENALTY'),
      scoreName: new ScoreName('Penalty Score'),
      scoreValue: ScoreValue.forType(-5, new ScoreType('PENALTY')),
      idGenerator: testIdGenerator,
    })

    assert.isTrue(score.hasDomainEvents())

    score.clearDomainEvents()
    assert.isFalse(score.hasDomainEvents())
  })
})
