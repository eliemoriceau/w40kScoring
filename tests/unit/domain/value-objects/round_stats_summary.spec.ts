import { test } from '@japa/runner'
import RoundStatsSummary from '#domain/value-objects/round_stats_summary'
import ScoreValue from '#domain/value-objects/score_value'

test.group('RoundStatsSummary Value Object', () => {
  test('should create valid round stats summary', ({ assert }) => {
    const totalScore = new ScoreValue(150)
    const scoresByType = {
      PRIMARY: new ScoreValue(90),
      SECONDARY: new ScoreValue(60),
    }

    const summary = new RoundStatsSummary(totalScore, 2, 8, scoresByType)

    assert.isTrue(summary.totalScore.equals(totalScore))
    assert.equal(summary.playerCount, 2)
    assert.equal(summary.scoreCount, 8)
    assert.equal(summary.averageScore, 75) // 150 / 2 players
    assert.equal(summary.getAverageScoresPerPlayer(), 4) // 8 scores / 2 players
  })

  test('should handle zero players', ({ assert }) => {
    const totalScore = new ScoreValue(0)
    const scoresByType = {}

    const summary = new RoundStatsSummary(totalScore, 0, 0, scoresByType)

    assert.equal(summary.averageScore, 0)
    assert.equal(summary.getAverageScoresPerPlayer(), 0)
  })

  test('should calculate averages correctly', ({ assert }) => {
    const totalScore = new ScoreValue(200)
    const scoresByType = { PRIMARY: new ScoreValue(200) }

    const summary = new RoundStatsSummary(totalScore, 3, 9, scoresByType)

    assert.equal(Math.round(summary.averageScore * 100) / 100, 66.67) // 200 / 3
    assert.equal(summary.getAverageScoresPerPlayer(), 3) // 9 / 3
  })

  test('should throw error for negative player count', ({ assert }) => {
    const totalScore = new ScoreValue(50)
    const scoresByType = {}

    assert.throws(
      () => new RoundStatsSummary(totalScore, -1, 5, scoresByType),
      'Player count must be a non-negative integer'
    )
  })

  test('should throw error for negative score count', ({ assert }) => {
    const totalScore = new ScoreValue(50)
    const scoresByType = {}

    assert.throws(
      () => new RoundStatsSummary(totalScore, 2, -1, scoresByType),
      'Score count must be a non-negative integer'
    )
  })

  test('should throw error for invalid scores by type', ({ assert }) => {
    const totalScore = new ScoreValue(50)

    assert.throws(
      () => new RoundStatsSummary(totalScore, 2, 5, null as any),
      'Scores by type must be a valid object'
    )
  })

  test('should get score by type', ({ assert }) => {
    const scoresByType = {
      PRIMARY: new ScoreValue(90),
      SECONDARY: new ScoreValue(60),
    }
    const summary = new RoundStatsSummary(new ScoreValue(150), 2, 8, scoresByType)

    const primaryScore = summary.getScoreByType('PRIMARY')
    const missingScore = summary.getScoreByType('BONUS')

    assert.isNotNull(primaryScore)
    assert.equal(primaryScore?.value, 90)
    assert.isNull(missingScore)
  })

  test('should get all score types', ({ assert }) => {
    const scoresByType = {
      SECONDARY: new ScoreValue(60),
      PRIMARY: new ScoreValue(90),
      BONUS: new ScoreValue(15),
    }
    const summary = new RoundStatsSummary(new ScoreValue(165), 2, 10, scoresByType)

    const types = summary.getScoreTypes()

    assert.deepEqual(types, ['BONUS', 'PRIMARY', 'SECONDARY']) // Should be sorted
  })

  test('should check if has score type', ({ assert }) => {
    const scoresByType = {
      PRIMARY: new ScoreValue(90),
      SECONDARY: new ScoreValue(60),
    }
    const summary = new RoundStatsSummary(new ScoreValue(150), 2, 8, scoresByType)

    assert.isTrue(summary.hasScoreType('PRIMARY'))
    assert.isTrue(summary.hasScoreType('SECONDARY'))
    assert.isFalse(summary.hasScoreType('BONUS'))
  })

  test('should get highest scoring type', ({ assert }) => {
    const scoresByType = {
      PRIMARY: new ScoreValue(90),
      SECONDARY: new ScoreValue(60),
      BONUS: new ScoreValue(15),
    }
    const summary = new RoundStatsSummary(new ScoreValue(165), 2, 10, scoresByType)

    const highest = summary.getHighestScoringType()

    assert.isNotNull(highest)
    assert.equal(highest?.type, 'PRIMARY')
    assert.equal(highest?.score.value, 90)
  })

  test('should return null for highest scoring type when empty', ({ assert }) => {
    const summary = new RoundStatsSummary(new ScoreValue(0), 0, 0, {})

    const highest = summary.getHighestScoringType()

    assert.isNull(highest)
  })

  test('should identify high scoring rounds', ({ assert }) => {
    const highScoring = new RoundStatsSummary(new ScoreValue(200), 2, 8, {
      PRIMARY: new ScoreValue(200),
    }) // avg = 100 per player

    const lowScoring = new RoundStatsSummary(new ScoreValue(60), 3, 9, {
      PRIMARY: new ScoreValue(60),
    }) // avg = 20 per player

    assert.isTrue(highScoring.isHighScoringRound(50))
    assert.isFalse(lowScoring.isHighScoringRound(50))
    assert.isTrue(lowScoring.isHighScoringRound(15)) // Lower threshold
  })

  test('should assess competitive balance', ({ assert }) => {
    const balanced = new RoundStatsSummary(new ScoreValue(120), 4, 16, {
      PRIMARY: new ScoreValue(120),
    }) // 4 scores per player - reasonable

    const unbalanced = new RoundStatsSummary(new ScoreValue(200), 1, 25, {
      PRIMARY: new ScoreValue(200),
    }) // 25 scores for 1 player - too many

    assert.isTrue(balanced.hasCompetitiveBalance())
    assert.isFalse(unbalanced.hasCompetitiveBalance())
  })

  test('should check equality correctly', ({ assert }) => {
    const scoresByType = {
      PRIMARY: new ScoreValue(90),
      SECONDARY: new ScoreValue(60),
    }

    const summary1 = new RoundStatsSummary(new ScoreValue(150), 2, 8, scoresByType)
    const summary2 = new RoundStatsSummary(new ScoreValue(150), 2, 8, scoresByType)
    const summary3 = new RoundStatsSummary(new ScoreValue(150), 3, 8, scoresByType)

    assert.isTrue(summary1.equals(summary2))
    assert.isFalse(summary1.equals(summary3))
  })

  test('should provide display information', ({ assert }) => {
    const scoresByType = {
      PRIMARY: new ScoreValue(120),
      SECONDARY: new ScoreValue(80),
      BONUS: new ScoreValue(20),
    }
    const summary = new RoundStatsSummary(new ScoreValue(220), 4, 16, scoresByType)

    const display = summary.toDisplay()

    assert.equal(display.totalScore, 220)
    assert.equal(display.playerCount, 4)
    assert.equal(display.scoreCount, 16)
    assert.equal(display.averageScore, 55) // 220 / 4 players
    assert.equal(display.averageScoresPerPlayer, 4) // 16 / 4 players
    assert.isTrue(display.isHighScoring) // 55 >= 50 (default threshold)
    assert.isTrue(display.hasCompetitiveBalance) // 4 scores per player is reasonable
    assert.equal(display.scoresByType.PRIMARY, 120)
    assert.equal(display.scoresByType.SECONDARY, 80)
    assert.equal(display.scoresByType.BONUS, 20)
    assert.isNotNull(display.highestScoringType)
    assert.equal(display.highestScoringType?.type, 'PRIMARY')
    assert.equal(display.highestScoringType?.score, 120)
  })

  test('should handle Warhammer 40K tournament round scenario', ({ assert }) => {
    // Typical tournament round with 8 players
    const scoresByType = {
      PRIMARY: new ScoreValue(280), // Primary objectives across all players
      SECONDARY: new ScoreValue(220), // Secondary objectives
      OBJECTIVE: new ScoreValue(64), // Hold objectives
      BONUS: new ScoreValue(24), // Various bonuses
      PENALTY: new ScoreValue(-18), // Various penalties
    }

    const summary = new RoundStatsSummary(new ScoreValue(570), 8, 64, scoresByType)

    const display = summary.toDisplay()

    assert.equal(display.totalScore, 570)
    assert.equal(display.playerCount, 8)
    assert.equal(display.scoreCount, 64)
    assert.equal(display.averageScore, 71.25) // 570 / 8 players
    assert.equal(display.averageScoresPerPlayer, 8) // 64 / 8 players
    assert.isTrue(display.isHighScoring) // Above 50 point threshold
    assert.isTrue(display.hasCompetitiveBalance) // 8 scores per player is good
    assert.equal(display.highestScoringType?.type, 'PRIMARY')
    assert.equal(display.highestScoringType?.score, 280)
  })

  test('should handle edge cases correctly', ({ assert }) => {
    // Round with negative total score (penalties > positives)
    const negativeRound = new RoundStatsSummary(new ScoreValue(-30), 2, 6, {
      PENALTY: new ScoreValue(-30),
    })

    assert.equal(negativeRound.averageScore, -15) // -30 / 2
    assert.isFalse(negativeRound.isHighScoringRound())
    assert.isTrue(negativeRound.hasCompetitiveBalance()) // 3 scores per player is fine
  })
})
