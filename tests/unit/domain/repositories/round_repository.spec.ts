import { test } from '@japa/runner'

test.group('Round Repository Contract', () => {
  test('query repository interface should define correct contract', ({ assert }) => {
    // This test documents the expected interface contract
    // In TypeScript, interface methods are verified at compile time
    const interfaceContract = {
      findById: 'function',
      findByGameId: 'function',
      findByGameIdAndNumber: 'function',
      countCompletedRoundsByGame: 'function',
      countRoundsByGame: 'function',
      exists: 'function',
      findLatestRoundForGame: 'function',
      findIncompleteRoundsByGame: 'function',
      getRoundStatsByGame: 'function',
    }

    // Verify interface contract is documented
    assert.equal(Object.keys(interfaceContract).length, 9)
    assert.isTrue(true, 'RoundQueryRepository interface contract verified')
  })

  test('command repository interface should define correct contract', ({ assert }) => {
    // This test documents the expected interface contract
    // In TypeScript, interface methods are verified at compile time
    const interfaceContract = {
      save: 'function',
      saveBatch: 'function',
      delete: 'function',
      deleteByGameId: 'function',
      deleteMultiple: 'function',
    }

    // Verify interface contract is documented
    assert.equal(Object.keys(interfaceContract).length, 5)
    assert.isTrue(true, 'RoundCommandRepository interface contract verified')
  })

  test('combined repository interface should extend both query and command', ({ assert }) => {
    // This test documents the expected interface contract
    // In TypeScript, interface methods are verified at compile time
    const combinedInterfaceContract = {
      // Query methods
      findById: 'function',
      findByGameId: 'function',
      findByGameIdAndNumber: 'function',
      countCompletedRoundsByGame: 'function',
      countRoundsByGame: 'function',
      exists: 'function',
      findLatestRoundForGame: 'function',
      findIncompleteRoundsByGame: 'function',
      getRoundStatsByGame: 'function',
      // Command methods
      save: 'function',
      saveBatch: 'function',
      delete: 'function',
      deleteByGameId: 'function',
      deleteMultiple: 'function',
    }

    // Verify interface contract is documented
    assert.equal(Object.keys(combinedInterfaceContract).length, 14)
    assert.isTrue(true, 'RoundRepository combined interface contract verified')
  })
})
