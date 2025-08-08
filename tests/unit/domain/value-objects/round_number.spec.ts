import { test } from '@japa/runner'
import RoundNumber from '#domain/value-objects/round_number'

test.group('RoundNumber Value Object', () => {
  test('should create a valid RoundNumber for values 1-5', ({ assert }) => {
    // Valid Warhammer 40K round numbers
    for (let i = 1; i <= 5; i++) {
      const roundNumber = new RoundNumber(i)
      assert.equal(roundNumber.value, i)
    }
  })

  test('should throw error for round number less than 1', ({ assert }) => {
    assert.throws(() => new RoundNumber(0), 'Round number must be between 1 and 5')

    assert.throws(() => new RoundNumber(-1), 'Round number must be between 1 and 5')
  })

  test('should throw error for round number greater than 5', ({ assert }) => {
    assert.throws(() => new RoundNumber(6), 'Round number must be between 1 and 5')

    assert.throws(() => new RoundNumber(10), 'Round number must be between 1 and 5')
  })

  test('should throw error for non-integer values', ({ assert }) => {
    assert.throws(() => new RoundNumber(1.5), 'Round number must be an integer')

    assert.throws(() => new RoundNumber(2.7), 'Round number must be an integer')
  })

  test('should compare equality correctly', ({ assert }) => {
    const roundNumber1 = new RoundNumber(3)
    const roundNumber2 = new RoundNumber(3)
    const roundNumber3 = new RoundNumber(4)

    assert.isTrue(roundNumber1.equals(roundNumber2))
    assert.isFalse(roundNumber1.equals(roundNumber3))
  })

  test('should convert to string representation', ({ assert }) => {
    const roundNumber = new RoundNumber(2)
    assert.equal(roundNumber.toString(), '2')
  })

  test('should support ordinal representation', ({ assert }) => {
    const tests = [
      { number: 1, ordinal: '1st' },
      { number: 2, ordinal: '2nd' },
      { number: 3, ordinal: '3rd' },
      { number: 4, ordinal: '4th' },
      { number: 5, ordinal: '5th' },
    ]

    tests.forEach(({ number, ordinal }) => {
      const roundNumber = new RoundNumber(number)
      assert.equal(roundNumber.toOrdinal(), ordinal)
    })
  })

  test('should create from valid string', ({ assert }) => {
    const roundNumber = RoundNumber.fromString('3')
    assert.equal(roundNumber.value, 3)
  })

  test('should throw error for invalid string', ({ assert }) => {
    assert.throws(() => RoundNumber.fromString('0'), 'Round number must be between 1 and 5')

    assert.throws(() => RoundNumber.fromString('invalid'), 'Invalid round number format')
  })

  test('should provide next round number', ({ assert }) => {
    const round1 = new RoundNumber(1)
    const round2 = round1.next()
    assert.equal(round2.value, 2)

    const round4 = new RoundNumber(4)
    const round5 = round4.next()
    assert.equal(round5.value, 5)
  })

  test('should throw error when trying to get next of round 5', ({ assert }) => {
    const round5 = new RoundNumber(5)
    assert.throws(() => round5.next(), 'Round 5 is the final round')
  })

  test('should check if round is final', ({ assert }) => {
    const round3 = new RoundNumber(3)
    const round5 = new RoundNumber(5)

    assert.isFalse(round3.isFinal())
    assert.isTrue(round5.isFinal())
  })
})
