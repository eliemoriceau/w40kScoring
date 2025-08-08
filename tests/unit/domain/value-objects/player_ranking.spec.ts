import { test } from '@japa/runner'
import PlayerRanking from '#domain/value-objects/player_ranking'
import PlayerId from '#domain/value-objects/player_id'
import ScoreValue from '#domain/value-objects/score_value'

test.group('PlayerRanking Value Object', () => {
  test('should create valid player ranking', ({ assert }) => {
    const playerId = new PlayerId(1)
    const totalScore = new ScoreValue(75)
    const scoreCount = 5

    const ranking = new PlayerRanking(playerId, totalScore, scoreCount)

    assert.isTrue(ranking.playerId.equals(playerId))
    assert.isTrue(ranking.totalScore.equals(totalScore))
    assert.equal(ranking.scoreCount, scoreCount)
    assert.equal(ranking.averageScore, 15) // 75 / 5
  })

  test('should handle zero score count', ({ assert }) => {
    const playerId = new PlayerId(2)
    const totalScore = new ScoreValue(0)
    const scoreCount = 0

    const ranking = new PlayerRanking(playerId, totalScore, scoreCount)

    assert.equal(ranking.scoreCount, 0)
    assert.equal(ranking.averageScore, 0)
  })

  test('should calculate average score correctly', ({ assert }) => {
    const playerId = new PlayerId(3)
    const totalScore = new ScoreValue(100)
    const scoreCount = 3

    const ranking = new PlayerRanking(playerId, totalScore, scoreCount)

    assert.equal(Math.round(ranking.averageScore * 100) / 100, 33.33) // 100 / 3
  })

  test('should throw error for negative score count', ({ assert }) => {
    const playerId = new PlayerId(1)
    const totalScore = new ScoreValue(50)

    assert.throws(
      () => new PlayerRanking(playerId, totalScore, -1),
      'Score count must be a non-negative integer'
    )
  })

  test('should throw error for non-integer score count', ({ assert }) => {
    const playerId = new PlayerId(1)
    const totalScore = new ScoreValue(50)

    assert.throws(
      () => new PlayerRanking(playerId, totalScore, 3.5),
      'Score count must be a non-negative integer'
    )
  })

  test('should check equality correctly', ({ assert }) => {
    const playerId = new PlayerId(1)
    const totalScore = new ScoreValue(60)
    const scoreCount = 4

    const ranking1 = new PlayerRanking(playerId, totalScore, scoreCount)
    const ranking2 = new PlayerRanking(playerId, totalScore, scoreCount)
    const ranking3 = new PlayerRanking(new PlayerId(2), totalScore, scoreCount)

    assert.isTrue(ranking1.equals(ranking2))
    assert.isFalse(ranking1.equals(ranking3))
  })

  test('should compare rankings by total score (descending)', ({ assert }) => {
    const player1 = new PlayerRanking(new PlayerId(1), new ScoreValue(100), 5)
    const player2 = new PlayerRanking(new PlayerId(2), new ScoreValue(80), 4)
    const player3 = new PlayerRanking(new PlayerId(3), new ScoreValue(100), 3) // Same total, different average

    // Higher total score should rank better (negative comparison result)
    assert.isTrue(player1.compareTo(player2) < 0)
    assert.isTrue(player2.compareTo(player1) > 0)

    // Same total score, higher average should rank better
    assert.isTrue(player3.compareTo(player1) < 0) // 100/3 = 33.33 vs 100/5 = 20
  })

  test('should use player ID for consistent sorting when scores are equal', ({ assert }) => {
    const player1 = new PlayerRanking(new PlayerId(1), new ScoreValue(50), 5) // avg 10
    const player2 = new PlayerRanking(new PlayerId(2), new ScoreValue(50), 5) // avg 10

    const comparison = player1.compareTo(player2)
    assert.isTrue(comparison < 0) // Player 1 ID should come before Player 2 ID
  })

  test('should check if ranking is better than another', ({ assert }) => {
    const higherRanking = new PlayerRanking(new PlayerId(1), new ScoreValue(100), 4)
    const lowerRanking = new PlayerRanking(new PlayerId(2), new ScoreValue(80), 4)

    assert.isTrue(higherRanking.isBetterThan(lowerRanking))
    assert.isFalse(lowerRanking.isBetterThan(higherRanking))
  })

  test('should provide display information', ({ assert }) => {
    const playerId = new PlayerId(42)
    const totalScore = new ScoreValue(87)
    const scoreCount = 6

    const ranking = new PlayerRanking(playerId, totalScore, scoreCount)
    const display = ranking.toDisplay()

    assert.equal(display.playerId, '42')
    assert.equal(display.totalScore, 87)
    assert.equal(display.scoreCount, 6)
    assert.equal(display.averageScore, 14.5) // 87 / 6 = 14.5
  })

  test('should round average score to 2 decimal places in display', ({ assert }) => {
    const playerId = new PlayerId(1)
    const totalScore = new ScoreValue(100)
    const scoreCount = 3

    const ranking = new PlayerRanking(playerId, totalScore, scoreCount)
    const display = ranking.toDisplay()

    // 100 / 3 = 33.333... should be rounded to 33.33
    assert.equal(display.averageScore, 33.33)
  })

  test('should handle complex ranking scenarios', ({ assert }) => {
    // Create a realistic Warhammer 40K tournament scenario
    const players = [
      new PlayerRanking(new PlayerId(1), new ScoreValue(95), 8), // High scorer, many games
      new PlayerRanking(new PlayerId(2), new ScoreValue(90), 6), // High average
      new PlayerRanking(new PlayerId(3), new ScoreValue(95), 10), // Same total as #1, more games
      new PlayerRanking(new PlayerId(4), new ScoreValue(75), 5), // Lower total
    ]

    // Sort by ranking (better players first)
    players.sort((a, b) => a.compareTo(b))

    // Expected order by ranking logic (total score first, then average):
    // Player 1: 95/8 = 11.875 avg, total 95
    // Player 3: 95/10 = 9.5 avg, total 95 (same total as #1, lower avg)
    // Player 2: 90/6 = 15 avg, total 90 (higher avg than #1,#3 but lower total)
    // Player 4: 75/5 = 15 avg, total 75 (same avg as #2 but lower total)

    assert.equal(players[0].playerId.value, 1) // Highest total score
    assert.equal(players[1].playerId.value, 3) // Same total as #1, lower average
    assert.equal(players[2].playerId.value, 2) // Lower total but good average
    assert.equal(players[3].playerId.value, 4) // Lowest total score
  })
})
