import { test } from '@japa/runner'
import Score from '#domain/entities/score'
import RoundId from '#domain/value-objects/round_id'
import PlayerId from '#domain/value-objects/player_id'
import ScoreType from '#domain/value-objects/score_type'
import ScoreName from '#domain/value-objects/score_name'
import ScoreValue from '#domain/value-objects/score_value'
import { IdGenerator } from '#domain/services/id_generator'
import UuidV7IdGenerator from '#infrastructure/services/uuid_v7_id_generator'
import ScoreId from '#domain/value-objects/score_id'

// Mock IdGenerator for testing
class MockIdGenerator implements IdGenerator {
  private counter = 1

  generateScoreId(): ScoreId {
    return new ScoreId(this.counter++)
  }

  reset() {
    this.counter = 1
  }
}

test.group('Score Entity with IdGenerator', () => {
  test('should create score with injected IdGenerator', ({ assert }) => {
    const mockIdGenerator = new MockIdGenerator()

    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Hold Objective 1'),
      scoreValue: ScoreValue.forType(5, new ScoreType('OBJECTIVE')),
      idGenerator: mockIdGenerator,
    })

    assert.equal(score.id.toString(), '1')
    assert.isTrue(score.roundId.equals(new RoundId(1)))
    assert.isTrue(score.playerId.equals(new PlayerId(1)))
  })

  test('should create score with UUID v7 generator', ({ assert }) => {
    const uuidGenerator = new UuidV7IdGenerator()

    const score = Score.create({
      roundId: new RoundId(2),
      playerId: new PlayerId(2),
      scoreType: new ScoreType('PRIMARY'),
      scoreName: new ScoreName('Control Objectives'),
      scoreValue: ScoreValue.forType(15, new ScoreType('PRIMARY')),
      idGenerator: uuidGenerator,
    })

    // Should be a valid UUID v7 format
    assert.match(
      score.id.toString(),
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  test('should generate unique IDs for multiple scores', ({ assert }) => {
    const mockIdGenerator = new MockIdGenerator()

    const score1 = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Hold Objective 1'),
      scoreValue: ScoreValue.forType(5, new ScoreType('OBJECTIVE')),
      idGenerator: mockIdGenerator,
    })

    const score2 = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('BONUS'),
      scoreName: new ScoreName('First Blood'),
      scoreValue: ScoreValue.forType(3, new ScoreType('BONUS')),
      idGenerator: mockIdGenerator,
    })

    assert.isFalse(score1.id.equals(score2.id))
    assert.equal(score1.id.toString(), '1')
    assert.equal(score2.id.toString(), '2')
  })

  test('should require IdGenerator parameter', ({ assert }) => {
    assert.throws(() => {
      Score.create({
        roundId: new RoundId(1),
        playerId: new PlayerId(1),
        scoreType: new ScoreType('OBJECTIVE'),
        scoreName: new ScoreName('Hold Objective 1'),
        scoreValue: ScoreValue.forType(5, new ScoreType('OBJECTIVE')),
        // Missing idGenerator parameter
      } as any)
    }, 'IdGenerator is required for creating new Scores')
  })

  test('should work with existing Score methods after IdGenerator integration', ({ assert }) => {
    const mockIdGenerator = new MockIdGenerator()

    const score = Score.create({
      roundId: new RoundId(1),
      playerId: new PlayerId(1),
      scoreType: new ScoreType('OBJECTIVE'),
      scoreName: new ScoreName('Hold Objective 1'),
      scoreValue: ScoreValue.forType(5, new ScoreType('OBJECTIVE')),
      idGenerator: mockIdGenerator,
    })

    // Test existing methods still work
    assert.isTrue(score.isPositive())
    assert.isFalse(score.isNegative())
    assert.isFalse(score.isZero())

    const displayInfo = score.getDisplayInfo()
    assert.equal(displayInfo.name, 'Hold Objective 1')
    assert.equal(displayInfo.value, 5)
    assert.equal(displayInfo.type, 'Objective')
    assert.equal(displayInfo.formattedValue, '+5')
  })
})
