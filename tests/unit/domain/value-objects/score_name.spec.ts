import { test } from '@japa/runner'
import ScoreName from '#domain/value-objects/score_name'

test.group('ScoreName Value Object', () => {
  test('should create a valid ScoreName with acceptable length', ({ assert }) => {
    const scoreName = new ScoreName('Hold Objective 1')

    assert.equal(scoreName.value, 'Hold Objective 1')
    assert.equal(scoreName.toString(), 'Hold Objective 1')
  })

  test('should throw error for empty or whitespace-only name', ({ assert }) => {
    const invalidNames = ['', '   ', '\t', '\n', '  \t  \n  ']

    invalidNames.forEach((name) => {
      assert.throws(
        () => new ScoreName(name),
        'Score name cannot be empty or contain only whitespace'
      )
    })
  })

  test('should throw error for name too short', ({ assert }) => {
    const shortNames = ['A', 'AB']

    shortNames.forEach((name) => {
      assert.throws(
        () => new ScoreName(name),
        `Score name must be between 3 and 100 characters long, got: ${name.length} characters`
      )
    })
  })

  test('should throw error for name too long', ({ assert }) => {
    const longName = 'A'.repeat(101)

    assert.throws(
      () => new ScoreName(longName),
      `Score name must be between 3 and 100 characters long, got: ${longName.length} characters`
    )
  })

  test('should accept name with minimum valid length', ({ assert }) => {
    const minName = 'ABC' // 3 characters

    const scoreName = new ScoreName(minName)
    assert.equal(scoreName.value, minName)
  })

  test('should accept name with maximum valid length', ({ assert }) => {
    const maxName = 'A'.repeat(100) // 100 characters

    const scoreName = new ScoreName(maxName)
    assert.equal(scoreName.value, maxName)
  })

  test('should trim whitespace from name', ({ assert }) => {
    const nameWithWhitespace = '  Kill Enemy Warlord  '
    const expectedName = 'Kill Enemy Warlord'

    const scoreName = new ScoreName(nameWithWhitespace)
    assert.equal(scoreName.value, expectedName)
  })

  test('should allow alphanumeric characters and common symbols', ({ assert }) => {
    const validNames = [
      'Hold Objective 1',
      'Kill 50% of Enemy Units',
      'Deploy Scramblers (Action)',
      'Assassinate - Kill Enemy HQ',
      "Linebreaker: Cross No-Man's Land",
      'Paint the Target #1',
      'Mission Objective A+B',
    ]

    validNames.forEach((name) => {
      const scoreName = new ScoreName(name)
      assert.equal(scoreName.value, name)
    })
  })

  test('should reject name with invalid characters', ({ assert }) => {
    const invalidNames = [
      'Objective @#$%^&*',
      'Kill <enemies>',
      'Deploy {scramblers}',
      'Mission [A]',
      'Objective \\\\//|\\\\',
    ]

    invalidNames.forEach((name) => {
      assert.throws(
        () => new ScoreName(name),
        'Score name contains invalid characters. Only letters, numbers, spaces, and common punctuation (.-\'",():+#%) are allowed'
      )
    })
  })

  test('should compare equality correctly', ({ assert }) => {
    const scoreName1 = new ScoreName('Hold Objective 1')
    const scoreName2 = new ScoreName('Hold Objective 1')
    const scoreName3 = new ScoreName('Hold Objective 2')

    assert.isTrue(scoreName1.equals(scoreName2))
    assert.isFalse(scoreName1.equals(scoreName3))
  })

  test('should be case sensitive for equality', ({ assert }) => {
    const scoreName1 = new ScoreName('Hold Objective')
    const scoreName2 = new ScoreName('hold objective')

    assert.isFalse(scoreName1.equals(scoreName2))
  })

  test('should convert to string representation', ({ assert }) => {
    const scoreName = new ScoreName('Assassinate Warlord')

    assert.equal(scoreName.toString(), 'Assassinate Warlord')
  })

  test('should preserve original case in value', ({ assert }) => {
    const originalName = 'Kill HQ Units'
    const scoreName = new ScoreName(originalName)

    assert.equal(scoreName.value, originalName)
  })

  test('should get abbreviation for long names', ({ assert }) => {
    const longName = 'Deploy Scramblers: Action to Deploy Scramblers on Objective'
    const scoreName = new ScoreName(longName)

    const abbreviation = scoreName.getAbbreviation(20)
    assert.equal(abbreviation.length, 20)
    assert.isTrue(abbreviation.endsWith('...'))
    assert.equal(abbreviation, 'Deploy Scramblers...')
  })

  test('should return full name as abbreviation if shorter than limit', ({ assert }) => {
    const shortName = 'Kill HQ'
    const scoreName = new ScoreName(shortName)

    const abbreviation = scoreName.getAbbreviation(20)
    assert.equal(abbreviation, shortName)
  })

  test('should check if name contains specific word', ({ assert }) => {
    const scoreName = new ScoreName('Hold Objective 1')

    assert.isTrue(scoreName.contains('Objective'))
    assert.isTrue(scoreName.contains('Hold'))
    assert.isFalse(scoreName.contains('Kill'))
  })
})
