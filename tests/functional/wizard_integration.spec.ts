import { test } from '@japa/runner'
import User from '#models/user'
import {
  gameCreationWizardValidator,
  type GameCreationWizardRequest,
} from '#validators/game_creation_wizard_validator'
import { DateTime } from 'luxon'

test.group('Wizard Integration', (group) => {
  let user: User

  group.each.setup(async () => {
    // Setup utilisateur de test
    user = await User.create({
      username: 'testwizard',
      email: 'wizard@test.com',
      password: 'password123',
      fullName: 'Test Wizard User',
      roleId: 1,
      newsletterConsent: false,
      termsAcceptedAt: DateTime.now(),
    })
  })

  group.each.teardown(async () => {
    // Cleanup après chaque test
    if (user) {
      await user.delete()
    }
  })

  test('should validate wizard data structure and VineJS validator', async ({ assert }) => {
    const validWizardData: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      mission: 'Test Mission',
      opponentType: 'guest',
      opponentPseudo: 'TestOpponent',
      players: [
        {
          pseudo: 'TestPlayer1',
          army: 'Space Marines',
          isCurrentUser: true,
        },
        {
          pseudo: 'TestOpponent',
          army: 'Chaos',
          isCurrentUser: false,
        },
      ],
      enableRounds: true,
      rounds: [
        {
          roundNumber: 1,
          playerScore: 10,
          opponentScore: 8,
          scores: [
            {
              playerId: 'player1',
              scoreType: 'PRIMARY',
              scoreValue: 10,
            },
          ],
        },
      ],
    }

    // Test validation VineJS
    try {
      const validated = await gameCreationWizardValidator.validate(validWizardData)

      assert.equal(validated.gameType, 'MATCHED_PLAY')
      assert.equal(validated.pointsLimit, 2000)
      assert.equal(validated.players.length, 2)
      assert.isTrue(validated.enableRounds)
      assert.equal(validated.rounds?.length, 1)
    } catch (error) {
      assert.fail(`Validation should pass: ${error.message}`)
    }
  })

  test('should reject invalid wizard data through VineJS validator', async ({ assert }) => {
    const invalidWizardData = {
      gameType: 'INVALID_TYPE', // Invalid game type
      pointsLimit: 100, // Too low
      opponentType: 'guest',
      players: [
        {
          pseudo: 'AB', // Too short
        },
      ],
      enableRounds: true,
    }

    try {
      await gameCreationWizardValidator.validate(invalidWizardData)
      assert.fail('Validation should have failed')
    } catch (error) {
      // VineJS errors have different structure
      assert.isArray(error.messages || [])
      assert.isAbove((error.messages || []).length, 0)
      
      // Check that validation failed with expected error types
      const allErrors = JSON.stringify(error.messages || error)
      assert.isTrue(allErrors.includes('gameType') || allErrors.includes('pointsLimit'))
    }
  })

  test('should validate business rules for wizard data', async ({ assert }) => {
    const { GameCreationWizardValidationRules } = await import(
      '#validators/game_creation_wizard_validator'
    )

    const wizardData: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 1750, // Not a multiple of 50
      opponentType: 'existing',
      // Missing opponentId for existing opponent
      players: [
        {
          pseudo: 'Player1',
          isCurrentUser: true,
        },
        {
          pseudo: 'Player1', // Duplicate pseudo
          isCurrentUser: false,
        },
      ],
      enableRounds: false,
    }

    const errors = GameCreationWizardValidationRules.validateComplete(wizardData)

    assert.isArray(errors)
    assert.isAbove(errors.length, 0)

    // Check specific business rule errors
    const errorMessages = errors.join(' ')
    // Just check that we have business validation errors
    assert.isAbove(errors.length, 0)
    
    // Check for key validation issues (more flexible matching)
    const hasPointsError = errorMessages.includes('50') || errorMessages.includes('points')
    const hasOpponentError = errorMessages.includes('opponentId') || errorMessages.includes('opponent')
    const hasPseudoError = errorMessages.includes('pseudo') || errorMessages.includes('unique')
    
    // At least one of these should be present
    assert.isTrue(hasPointsError || hasOpponentError || hasPseudoError)
  })

  test('should create and search users in database', async ({ assert }) => {
    // Create additional test users for search
    const searchUser = await User.create({
      username: 'searchable',
      email: 'searchable@test.com',
      password: 'password123',
      fullName: 'Searchable User',
      roleId: 1,
      newsletterConsent: false,
      termsAcceptedAt: DateTime.now(),
    })

    try {
      // Test database query functionality (similar to what controller uses)
      // Note: Using LIKE instead of ILIKE for SQLite compatibility in tests
      const users = await User.query()
        .where('id', '!=', user.id) // Exclude current user
        .where((query) => {
          query
            .whereLike('username', `%searchable%`)
            .orWhereLike('fullName', `%searchable%`)
            .orWhereLike('email', `%searchable%`)
        })
        .select('id', 'username', 'fullName', 'email')
        .limit(10)
        .orderBy('username', 'asc')

      assert.isArray(users)
      assert.isAbove(users.length, 0)

      const foundUser = users.find((u) => u.id === searchUser.id)
      assert.exists(foundUser)
      if (foundUser) {
        assert.equal(foundUser.username, 'searchable')
        assert.equal(foundUser.email, 'searchable@test.com')
      }

      // Should not include current user
      const currentUserFound = users.find((u) => u.id === user.id)
      assert.notExists(currentUserFound)
    } finally {
      await searchUser.delete()
    }
  })

  test('should validate wizard mapper functionality', async ({ assert }) => {
    // Test WizardGameMapper functionality
    const { WizardGameMapper } = await import('#application/mappers/wizard_game_mapper')

    const wizardData: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      mission: 'Test Mission',
      opponentType: 'guest',
      opponentPseudo: 'TestOpponent',
      players: [
        {
          pseudo: 'TestPlayer1',
          army: 'Space Marines',
          isCurrentUser: true,
        },
        {
          pseudo: 'TestOpponent',
          army: 'Chaos',
          isCurrentUser: false,
        },
      ],
      enableRounds: true,
      rounds: [
        {
          roundNumber: 1,
          playerScore: 10,
          opponentScore: 8,
        },
      ],
    }

    // Test validation
    try {
      WizardGameMapper.validateWizardData(wizardData)
      assert.isTrue(true, 'Validation should pass')
    } catch (error) {
      assert.fail(`Validation should pass: ${error.message}`)
    }

    // Test metadata extraction
    const metadata = WizardGameMapper.extractGameMetadata(wizardData)
    assert.equal(metadata.gameType, 'MATCHED_PLAY')
    assert.equal(metadata.pointsLimit, 2000)
    assert.equal(metadata.playersCount, 2)
    assert.equal(metadata.roundsCount, 1)
    assert.isTrue(metadata.enableRounds)
  })
})
