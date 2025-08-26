import { test } from '@japa/runner'
import { WizardGameMapper } from '#application/mappers/wizard_game_mapper'
import type { GameCreationWizardRequest } from '#validators/game_creation_wizard_validator'

test.group('WizardGameMapper', () => {
  test('should validate complete wizard data successfully', ({ assert }) => {
    const validWizardData: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      mission: 'Test Mission',
      opponentType: 'guest',
      opponentPseudo: 'TestOpponent',
      players: [
        {
          pseudo: 'Player1',
          army: 'Space Marines',
          isCurrentUser: true,
        },
        {
          pseudo: 'TestOpponent',
          army: 'Chaos',
          isCurrentUser: false,
        },
      ],
      enableRounds: false,
      rounds: [],
    }

    // Should not throw any error
    try {
      WizardGameMapper.validateWizardData(validWizardData)
      assert.isTrue(true, 'Validation should pass')
    } catch (error) {
      assert.fail(`Validation should pass: ${error.message}`)
    }
  })

  test('should reject wizard data with invalid game type', ({ assert }) => {
    const invalidWizardData = {
      gameType: 'INVALID_TYPE',
      pointsLimit: 2000,
      opponentType: 'guest',
      players: [
        { pseudo: 'Player1', isCurrentUser: true },
        { pseudo: 'Player2', isCurrentUser: false },
      ],
      enableRounds: false,
      rounds: [],
    } as any

    try {
      WizardGameMapper.validateWizardData(invalidWizardData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.isTrue(error.message.includes('gameType') || error.message.includes('game type'))
    }
  })

  test('should reject wizard data with invalid points limit', ({ assert }) => {
    const invalidWizardData: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 300, // Below minimum
      opponentType: 'guest',
      opponentPseudo: 'TestOpponent',
      players: [
        { pseudo: 'Player1', isCurrentUser: true },
        { pseudo: 'TestOpponent', isCurrentUser: false },
      ],
      enableRounds: false,
      rounds: [],
    }

    try {
      WizardGameMapper.validateWizardData(invalidWizardData)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.isTrue(error.message.includes('points') || error.message.includes('500'))
    }
  })

  test('should extract correct game metadata', ({ assert }) => {
    const wizardData: GameCreationWizardRequest = {
      gameType: 'NARRATIVE',
      pointsLimit: 1500,
      mission: 'Epic Battle',
      opponentType: 'existing',
      opponentId: 456,
      players: [
        { pseudo: 'Commander1', army: 'Imperial Guard', isCurrentUser: true },
        { pseudo: 'Commander2', army: 'Orks', isCurrentUser: false },
      ],
      enableRounds: false,
      rounds: [],
    }

    const metadata = WizardGameMapper.extractGameMetadata(wizardData)

    assert.equal(metadata.gameType, 'NARRATIVE')
    assert.equal(metadata.pointsLimit, 1500)
    assert.equal(metadata.mission, 'Epic Battle')
    assert.equal(metadata.playersCount, 2)
    assert.equal(metadata.roundsCount, 0) // Rounds not included in wizard anymore
    assert.isFalse(metadata.enableRounds) // Rounds added after creation
    assert.isTrue(metadata.hasArmyInfo)
    assert.equal(metadata.opponentType, 'existing')
  })

  test('should handle wizard data without mission', ({ assert }) => {
    const wizardData: GameCreationWizardRequest = {
      gameType: 'OPEN_PLAY',
      pointsLimit: 1000,
      // mission is optional
      opponentType: 'guest',
      opponentPseudo: 'QuickGame',
      players: [
        { pseudo: 'Player1', isCurrentUser: true },
        { pseudo: 'QuickGame', isCurrentUser: false },
      ],
      enableRounds: false,
      rounds: [],
    }

    const metadata = WizardGameMapper.extractGameMetadata(wizardData)

    assert.equal(metadata.gameType, 'OPEN_PLAY')
    assert.equal(metadata.pointsLimit, 1000)
    assert.isUndefined(metadata.mission)
    assert.isFalse(metadata.hasArmyInfo) // No army info provided
  })

  test('should detect army information presence correctly', ({ assert }) => {
    // With army info
    const wizardWithArmy: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      opponentType: 'guest',
      opponentPseudo: 'TestOpponent',
      players: [
        { pseudo: 'Player1', army: 'Space Marines', isCurrentUser: true },
        { pseudo: 'TestOpponent', army: 'Tyranids', isCurrentUser: false },
      ],
      enableRounds: false,
      rounds: [],
    }

    const metadataWithArmy = WizardGameMapper.extractGameMetadata(wizardWithArmy)
    assert.isTrue(metadataWithArmy.hasArmyInfo)

    // Without army info
    const wizardWithoutArmy: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      opponentType: 'guest',
      opponentPseudo: 'TestOpponent',
      players: [
        { pseudo: 'Player1', isCurrentUser: true },
        { pseudo: 'TestOpponent', isCurrentUser: false },
      ],
      enableRounds: false,
      rounds: [],
    }

    const metadataWithoutArmy = WizardGameMapper.extractGameMetadata(wizardWithoutArmy)
    assert.isFalse(metadataWithoutArmy.hasArmyInfo)
  })

  test('should validate business rules correctly', ({ assert }) => {
    const wizardData: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 1750, // Not multiple of 50
      opponentType: 'existing',
      // Missing opponentId for existing opponent
      players: [
        { pseudo: 'Player1', isCurrentUser: true },
        { pseudo: 'Player1', isCurrentUser: false }, // Duplicate pseudo
      ],
      enableRounds: false,
      rounds: [],
    }

    try {
      WizardGameMapper.validateWizardData(wizardData)
      assert.fail('Should have thrown validation error for business rules')
    } catch (error) {
      // Should catch business validation errors
      const errorMessage = error.message
      assert.isTrue(
        errorMessage.includes('50') ||
          errorMessage.includes('opponent') ||
          errorMessage.includes('pseudo'),
        'Should contain business validation errors'
      )
    }
  })

  test('should handle different opponent types correctly', ({ assert }) => {
    // Existing opponent
    const existingOpponent: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      opponentType: 'existing',
      opponentId: 123,
      players: [
        { pseudo: 'Player1', isCurrentUser: true },
        { pseudo: 'ExistingPlayer', isCurrentUser: false },
      ],
      enableRounds: false,
      rounds: [],
    }

    const existingMetadata = WizardGameMapper.extractGameMetadata(existingOpponent)
    assert.equal(existingMetadata.opponentType, 'existing')

    // Guest opponent
    const guestOpponent: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      opponentType: 'guest',
      opponentPseudo: 'GuestPlayer',
      players: [
        { pseudo: 'Player1', isCurrentUser: true },
        { pseudo: 'GuestPlayer', isCurrentUser: false },
      ],
      enableRounds: false,
      rounds: [],
    }

    const guestMetadata = WizardGameMapper.extractGameMetadata(guestOpponent)
    assert.equal(guestMetadata.opponentType, 'guest')

    // Email opponent
    const emailOpponent: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      opponentType: 'email',
      opponentEmail: 'test@example.com',
      opponentPseudo: 'EmailPlayer',
      players: [
        { pseudo: 'Player1', isCurrentUser: true },
        { pseudo: 'EmailPlayer', isCurrentUser: false },
      ],
      enableRounds: false,
      rounds: [],
    }

    const emailMetadata = WizardGameMapper.extractGameMetadata(emailOpponent)
    assert.equal(emailMetadata.opponentType, 'email')
  })

  test('should handle edge case with maximum valid points limit', ({ assert }) => {
    const wizardData: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 5000, // Maximum valid
      opponentType: 'guest',
      opponentPseudo: 'TestOpponent',
      players: [
        { pseudo: 'Player1', isCurrentUser: true },
        { pseudo: 'TestOpponent', isCurrentUser: false },
      ],
      enableRounds: false,
      rounds: [],
    }

    try {
      WizardGameMapper.validateWizardData(wizardData)
      const metadata = WizardGameMapper.extractGameMetadata(wizardData)
      assert.equal(metadata.pointsLimit, 5000)
    } catch (error) {
      assert.fail(`Should accept maximum points limit: ${error.message}`)
    }
  })

  test('should handle minimum valid points limit', ({ assert }) => {
    const wizardData: GameCreationWizardRequest = {
      gameType: 'MATCHED_PLAY',
      pointsLimit: 500, // Minimum valid
      opponentType: 'guest',
      opponentPseudo: 'TestOpponent',
      players: [
        { pseudo: 'Player1', isCurrentUser: true },
        { pseudo: 'TestOpponent', isCurrentUser: false },
      ],
      enableRounds: false,
      rounds: [],
    }

    try {
      WizardGameMapper.validateWizardData(wizardData)
      const metadata = WizardGameMapper.extractGameMetadata(wizardData)
      assert.equal(metadata.pointsLimit, 500)
    } catch (error) {
      assert.fail(`Should accept minimum points limit: ${error.message}`)
    }
  })
})
