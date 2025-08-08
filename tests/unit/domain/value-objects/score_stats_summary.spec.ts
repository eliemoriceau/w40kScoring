import { test } from '@japa/runner'
import ScoreStatsSummary from '#domain/value-objects/score_stats_summary'
import ScoreValue from '#domain/value-objects/score_value'

test.group('ScoreStatsSummary Value Object', () => {
  test('should create valid score stats summary', ({ assert }) => {
    const totalScore = new ScoreValue(75)
    const scoresByType = {
      PRIMARY: new ScoreValue(45),
      SECONDARY: new ScoreValue(25),
      PENALTY: new ScoreValue(-5),
    }

    const summary = new ScoreStatsSummary(totalScore, 3, 1, 4, scoresByType)

    assert.isTrue(summary.totalScore.equals(totalScore))
    assert.equal(summary.positiveScores, 3)
    assert.equal(summary.negativeScores, 1)
    assert.equal(summary.scoreCount, 4)
    assert.equal(summary.averageScore, 18.75) // 75 / 4
    assert.equal(summary.zeroScores, 0) // 4 - 3 - 1
  })

  test('should handle zero scores correctly', ({ assert }) => {
    const totalScore = new ScoreValue(20)
    const scoresByType = {
      PRIMARY: new ScoreValue(15),
      SECONDARY: new ScoreValue(5),
      OBJECTIVE: new ScoreValue(0),
    }

    const summary = new ScoreStatsSummary(totalScore, 2, 0, 3, scoresByType)

    assert.equal(summary.zeroScores, 1) // 3 - 2 - 0
  })

  test('should calculate average score correctly', ({ assert }) => {
    const totalScore = new ScoreValue(100)
    const scoresByType = { PRIMARY: new ScoreValue(100) }

    const summary = new ScoreStatsSummary(totalScore, 1, 0, 3, scoresByType)

    assert.equal(Math.round(summary.averageScore * 100) / 100, 33.33) // 100 / 3
  })

  test('should handle zero score count', ({ assert }) => {
    const totalScore = new ScoreValue(0)
    const scoresByType = {}

    const summary = new ScoreStatsSummary(totalScore, 0, 0, 0, scoresByType)

    assert.equal(summary.averageScore, 0)
    assert.equal(summary.zeroScores, 0)
  })

  test('should throw error for negative positive scores', ({ assert }) => {
    const totalScore = new ScoreValue(50)
    const scoresByType = {}

    assert.throws(
      () => new ScoreStatsSummary(totalScore, -1, 0, 1, scoresByType),
      'Positive scores count must be a non-negative integer'
    )
  })

  test('should throw error for negative negative scores', ({ assert }) => {
    const totalScore = new ScoreValue(50)
    const scoresByType = {}

    assert.throws(
      () => new ScoreStatsSummary(totalScore, 1, -1, 1, scoresByType),
      'Negative scores count must be a non-negative integer'
    )
  })

  test('should throw error for negative score count', ({ assert }) => {
    const totalScore = new ScoreValue(50)
    const scoresByType = {}

    assert.throws(
      () => new ScoreStatsSummary(totalScore, 0, 0, -1, scoresByType),
      'Score count must be a non-negative integer'
    )
  })

  test('should throw error when positive + negative > total', ({ assert }) => {
    const totalScore = new ScoreValue(50)
    const scoresByType = {}

    assert.throws(
      () => new ScoreStatsSummary(totalScore, 3, 2, 4, scoresByType), // 3 + 2 = 5 > 4
      'Sum of positive and negative scores cannot exceed total score count'
    )
  })

  test('should throw error for invalid scores by type', ({ assert }) => {
    const totalScore = new ScoreValue(50)

    assert.throws(
      () => new ScoreStatsSummary(totalScore, 1, 0, 1, null as any),
      'Scores by type must be a valid object'
    )
  })

  test('should check if above average', ({ assert }) => {
    const goodSummary = new ScoreStatsSummary(new ScoreValue(60), 3, 0, 4, {
      PRIMARY: new ScoreValue(60),
    }) // avg = 15

    const poorSummary = new ScoreStatsSummary(new ScoreValue(-10), 0, 2, 2, {
      PENALTY: new ScoreValue(-10),
    }) // avg = -5

    assert.isTrue(goodSummary.isAboveAverage(10))
    assert.isFalse(poorSummary.isAboveAverage(0))
  })

  test('should calculate performance ratio', ({ assert }) => {
    const balancedSummary = new ScoreStatsSummary(new ScoreValue(50), 2, 1, 3, {}) // ratio = 2/1 = 2

    const perfectSummary = new ScoreStatsSummary(new ScoreValue(100), 5, 0, 5, {}) // ratio = 5/0 = Infinity

    const poorSummary = new ScoreStatsSummary(new ScoreValue(-20), 0, 4, 4, {}) // ratio = 0/4 = 0

    assert.equal(balancedSummary.getPerformanceRatio(), 2)
    assert.equal(perfectSummary.getPerformanceRatio(), Infinity)
    assert.equal(poorSummary.getPerformanceRatio(), 0)
  })

  test('should get score by type', ({ assert }) => {
    const scoresByType = {
      PRIMARY: new ScoreValue(45),
      SECONDARY: new ScoreValue(25),
    }
    const summary = new ScoreStatsSummary(new ScoreValue(70), 2, 0, 2, scoresByType)

    const primaryScore = summary.getScoreByType('PRIMARY')
    const missingScore = summary.getScoreByType('BONUS')

    assert.isNotNull(primaryScore)
    assert.equal(primaryScore?.value, 45)
    assert.isNull(missingScore)
  })

  test('should get all score types', ({ assert }) => {
    const scoresByType = {
      SECONDARY: new ScoreValue(25),
      PRIMARY: new ScoreValue(45),
      BONUS: new ScoreValue(5),
    }
    const summary = new ScoreStatsSummary(new ScoreValue(75), 3, 0, 3, scoresByType)

    const types = summary.getScoreTypes()

    assert.deepEqual(types, ['BONUS', 'PRIMARY', 'SECONDARY']) // Should be sorted
  })

  test('should check if has score type', ({ assert }) => {
    const scoresByType = {
      PRIMARY: new ScoreValue(45),
      SECONDARY: new ScoreValue(25),
    }
    const summary = new ScoreStatsSummary(new ScoreValue(70), 2, 0, 2, scoresByType)

    assert.isTrue(summary.hasScoreType('PRIMARY'))
    assert.isTrue(summary.hasScoreType('SECONDARY'))
    assert.isFalse(summary.hasScoreType('BONUS'))
  })

  test('should check equality correctly', ({ assert }) => {
    const scoresByType = {
      PRIMARY: new ScoreValue(45),
      SECONDARY: new ScoreValue(25),
    }

    const summary1 = new ScoreStatsSummary(new ScoreValue(70), 2, 0, 2, scoresByType)
    const summary2 = new ScoreStatsSummary(new ScoreValue(70), 2, 0, 2, scoresByType)
    const summary3 = new ScoreStatsSummary(new ScoreValue(75), 2, 0, 2, scoresByType)

    assert.isTrue(summary1.equals(summary2))
    assert.isFalse(summary1.equals(summary3))
  })

  test('should provide display information', ({ assert }) => {
    const scoresByType = {
      PRIMARY: new ScoreValue(45),
      SECONDARY: new ScoreValue(30),
      PENALTY: new ScoreValue(-5),
    }
    const summary = new ScoreStatsSummary(new ScoreValue(70), 2, 1, 4, scoresByType)

    const display = summary.toDisplay()

    assert.equal(display.totalScore, 70)
    assert.equal(display.positiveScores, 2)
    assert.equal(display.negativeScores, 1)
    assert.equal(display.zeroScores, 1) // 4 - 2 - 1
    assert.equal(display.scoreCount, 4)
    assert.equal(display.averageScore, 17.5) // 70 / 4
    assert.equal(display.performanceRatio, 2) // 2 / 1
    assert.equal(display.scoresByType.PRIMARY, 45)
    assert.equal(display.scoresByType.SECONDARY, 30)
    assert.equal(display.scoresByType.PENALTY, -5)
  })

  test('should handle Warhammer 40K tournament scenario', ({ assert }) => {
    // Typical Warhammer 40K player performance
    const scoresByType = {
      PRIMARY: new ScoreValue(35), // Primary objectives (max 45)
      SECONDARY: new ScoreValue(25), // Secondary objectives (max 45 total)
      OBJECTIVE: new ScoreValue(8), // Hold objectives
      BONUS: new ScoreValue(3), // First blood
      PENALTY: new ScoreValue(-6), // Late deployment penalty
    }

    const summary = new ScoreStatsSummary(new ScoreValue(65), 4, 1, 8, scoresByType)

    const display = summary.toDisplay()

    assert.equal(display.totalScore, 65)
    assert.equal(display.positiveScores, 4)
    assert.equal(display.negativeScores, 1)
    assert.equal(display.zeroScores, 3) // Some objectives not scored
    assert.equal(display.averageScore, 8.13) // 65 / 8 rounded
    assert.equal(display.performanceRatio, 4) // 4 positive / 1 negative
    assert.isTrue(summary.isAboveAverage(5)) // Above average performance
  })
})
