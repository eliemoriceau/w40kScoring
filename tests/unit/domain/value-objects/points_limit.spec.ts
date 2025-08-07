import { test } from '@japa/runner'
import PointsLimit from '#domain/value-objects/points_limit'

test.group('PointsLimit Value Object', () => {
  test('should create valid PointsLimit for standard values', ({ assert }) => {
    // Arrange & Act
    const points500 = new PointsLimit(500)
    const points1000 = new PointsLimit(1000)
    const points2000 = new PointsLimit(2000)

    // Assert
    assert.equal(points500.value, 500)
    assert.equal(points1000.value, 1000)
    assert.equal(points2000.value, 2000)
  })

  test('should throw error for invalid points values', ({ assert }) => {
    // Act & Assert
    assert.throws(() => new PointsLimit(0), 'Points limit must be between 500 and 5000')
    assert.throws(() => new PointsLimit(499), 'Points limit must be between 500 and 5000')
    assert.throws(() => new PointsLimit(5001), 'Points limit must be between 500 and 5000')
  })

  test('should throw error for non-multiple of 50', ({ assert }) => {
    // Act & Assert
    assert.throws(() => new PointsLimit(525), 'Points limit must be a multiple of 50')
    assert.throws(() => new PointsLimit(1023), 'Points limit must be a multiple of 50')
  })

  test('should compare equality correctly', ({ assert }) => {
    // Arrange
    const pointsLimit1000First = new PointsLimit(1000)
    const pointsLimit1000Second = new PointsLimit(1000)
    const points1500 = new PointsLimit(1500)

    // Assert
    assert.isTrue(pointsLimit1000First.equals(pointsLimit1000Second))
    assert.isFalse(pointsLimit1000First.equals(points1500))
  })

  test('should determine if it is a standard tournament size', ({ assert }) => {
    // Arrange & Act
    const points1000 = new PointsLimit(1000)
    const points1500 = new PointsLimit(1500)
    const points2000 = new PointsLimit(2000)
    const points750 = new PointsLimit(750)

    // Assert
    assert.isTrue(points1000.isStandardTournamentSize())
    assert.isTrue(points1500.isStandardTournamentSize())
    assert.isTrue(points2000.isStandardTournamentSize())
    assert.isFalse(points750.isStandardTournamentSize())
  })

  test('should get appropriate game duration estimate', ({ assert }) => {
    // Arrange & Act
    const points500 = new PointsLimit(500)
    const points1000 = new PointsLimit(1000)
    const points2000 = new PointsLimit(2000)

    // Assert
    assert.equal(points500.getEstimatedDurationMinutes(), 60)
    assert.equal(points1000.getEstimatedDurationMinutes(), 90)
    assert.equal(points2000.getEstimatedDurationMinutes(), 120)
  })
})
