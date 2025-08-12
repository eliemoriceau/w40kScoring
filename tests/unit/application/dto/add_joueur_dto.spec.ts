import { test } from '@japa/runner'
import { AddJoueurDtoFactory } from '#application/dto/add_joueur_dto'

test.group('AddJoueurDtoFactory', () => {
  test('should create valid DTO with all required fields', ({ assert }) => {
    // Arrange
    const data = {
      partieId: '123',
      pseudo: 'TestPlayer',
      userId: 456,
      requestingUserId: 789,
    }

    // Act
    const result = AddJoueurDtoFactory.create(data)

    // Assert
    assert.equal(result.partieId, '123')
    assert.equal(result.pseudo, 'TestPlayer')
    assert.equal(result.userId, 456)
    assert.equal(result.requestingUserId, 789)
  })

  test('should create valid DTO without optional userId', ({ assert }) => {
    // Arrange
    const data = {
      partieId: '123',
      pseudo: 'GuestPlayer',
      requestingUserId: 789,
    }

    // Act
    const result = AddJoueurDtoFactory.create(data)

    // Assert
    assert.equal(result.partieId, '123')
    assert.equal(result.pseudo, 'GuestPlayer')
    assert.isUndefined(result.userId)
    assert.equal(result.requestingUserId, 789)
  })

  test('should trim whitespace from partieId and pseudo', ({ assert }) => {
    // Arrange
    const data = {
      partieId: '  123  ',
      pseudo: '  TestPlayer  ',
      requestingUserId: 789,
    }

    // Act
    const result = AddJoueurDtoFactory.create(data)

    // Assert
    assert.equal(result.partieId, '123')
    assert.equal(result.pseudo, 'TestPlayer')
  })

  test('should throw error for empty partieId', ({ assert }) => {
    // Arrange
    const data = {
      partieId: '',
      pseudo: 'TestPlayer',
      requestingUserId: 789,
    }

    // Act & Assert
    assert.throws(
      () => AddJoueurDtoFactory.create(data),
      'Partie ID is required and must be a non-empty string'
    )
  })

  test('should throw error for pseudo too short', ({ assert }) => {
    // Arrange
    const data = {
      partieId: '123',
      pseudo: 'X',
      requestingUserId: 789,
    }

    // Act & Assert
    assert.throws(
      () => AddJoueurDtoFactory.create(data),
      'Pseudo is required and must be at least 2 characters'
    )
  })

  test('should throw error for pseudo too long', ({ assert }) => {
    // Arrange
    const data = {
      partieId: '123',
      pseudo: 'ThisPseudoIsTooLongForTheValidation',
      requestingUserId: 789,
    }

    // Act & Assert
    assert.throws(
      () => AddJoueurDtoFactory.create(data),
      'Pseudo cannot exceed 20 characters'
    )
  })

  test('should throw error for invalid requesting user ID', ({ assert }) => {
    // Arrange
    const data = {
      partieId: '123',
      pseudo: 'TestPlayer',
      requestingUserId: -1,
    }

    // Act & Assert
    assert.throws(
      () => AddJoueurDtoFactory.create(data),
      'Requesting user ID must be a positive integer'
    )
  })

  test('should throw error for invalid optional userId', ({ assert }) => {
    // Arrange
    const data = {
      partieId: '123',
      pseudo: 'TestPlayer',
      userId: -1,
      requestingUserId: 789,
    }

    // Act & Assert
    assert.throws(
      () => AddJoueurDtoFactory.create(data),
      'User ID must be a positive integer when provided'
    )
  })
})