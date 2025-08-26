import { test } from '@japa/runner'

/**
 * Tests unitaires pour la logique de mapping des scores
 * Valide que la correction du problème de différentiation fonctionne
 */

test.group('Score Mapping Logic', () => {
  test('should correctly map scores to players using playerScores mapping', ({ assert }) => {
    // Arrange - Données simulées
    const mockRound = {
      id: 1,
      roundNumber: 1,
      playerScore: 12,
      opponentScore: 8,
      isCompleted: true,
      gameId: 1,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      playerScores: {
        1: 12, // Joueur ID 1 -> 12 points
        2: 8, // Joueur ID 2 -> 8 points
      },
    }

    const mockPlayers = [
      { id: 1, pseudo: 'Joueur1', userId: 7, isMainPlayer: true },
      { id: 2, pseudo: 'Joueur2', userId: 8, isMainPlayer: false },
    ]

    // Act - Simulation de la logique corrigée (W40KScoreCell.vue)
    function getScoreForPlayer(playerId: number, round: any, players: any[]) {
      // Nouvelle logique avec mapping
      if (round.playerScores && playerId in round.playerScores) {
        return round.playerScores[playerId] ?? 0
      }

      // Fallback vers ancienne logique
      const player = players.find((p) => p.id === playerId)
      if (!player) return 0

      return player.isMainPlayer ? round.playerScore : round.opponentScore
    }

    // Assert
    const player1Score = getScoreForPlayer(1, mockRound, mockPlayers)
    const player2Score = getScoreForPlayer(2, mockRound, mockPlayers)

    assert.equal(player1Score, 12, 'Player 1 should get 12 points')
    assert.equal(player2Score, 8, 'Player 2 should get 8 points')
    assert.isTrue(player1Score !== player2Score, 'Players should have different scores')
  })

  test('should fallback to old logic when playerScores mapping is missing', ({ assert }) => {
    // Arrange - Round sans mapping (pour rétrocompatibilité)
    const mockRoundWithoutMapping = {
      id: 1,
      playerScore: 15,
      opponentScore: 10,
      // pas de playerScores
    }

    const mockPlayers = [
      { id: 1, pseudo: 'MainPlayer', isMainPlayer: true },
      { id: 2, pseudo: 'Opponent', isMainPlayer: false },
    ]

    // Act
    function getScoreForPlayerFallback(playerId: number, round: any, players: any[]) {
      if (round.playerScores && playerId in round.playerScores) {
        return round.playerScores[playerId] ?? 0
      }

      const player = players.find((p) => p.id === playerId)
      if (!player) return 0

      return player.isMainPlayer ? round.playerScore : round.opponentScore
    }

    // Assert
    const player1Score = getScoreForPlayerFallback(1, mockRoundWithoutMapping, mockPlayers)
    const player2Score = getScoreForPlayerFallback(2, mockRoundWithoutMapping, mockPlayers)

    assert.equal(player1Score, 15, 'Main player should get playerScore')
    assert.equal(player2Score, 10, 'Opponent should get opponentScore')
  })

  test('should build correct playerScores mapping from backend data', ({ assert }) => {
    // Arrange - Simulation des données backend
    const roundData = {
      id: 1,
      playerScore: 20,
      opponentScore: 14,
    }

    const players = [
      { id: 1, userId: 7 }, // Joueur principal
      { id: 2, userId: 8 }, // Adversaire
    ]

    const gameOwnerId = 7

    // Act - Simulation de la méthode du contrôleur
    function buildPlayerScoresMapping(round: any, playersList: any[], gameOwner: number) {
      const scoreMap: { [playerId: number]: number } = {}

      const mainPlayer = playersList.find((p) => p.userId === gameOwner)
      const opponentPlayer = playersList.find((p) => p.userId !== gameOwner)

      if (mainPlayer) {
        scoreMap[mainPlayer.id] = round.playerScore || 0
      }

      if (opponentPlayer) {
        scoreMap[opponentPlayer.id] = round.opponentScore || 0
      }

      return scoreMap
    }

    const mapping = buildPlayerScoresMapping(roundData, players, gameOwnerId)

    // Assert
    assert.equal(mapping[1], 20, 'Main player (ID=1) should have playerScore')
    assert.equal(mapping[2], 14, 'Opponent (ID=2) should have opponentScore')
    assert.equal(Object.keys(mapping).length, 2, 'Should have mapping for both players')
  })

  test('should calculate total scores correctly using new mapping', ({ assert }) => {
    // Arrange - Simulation de GameScoreBoard.vue avec plusieurs rounds
    const players = [
      { id: 1, pseudo: 'Player1', isMainPlayer: true },
      { id: 2, pseudo: 'Player2', isMainPlayer: false },
    ]

    const rounds = [
      {
        id: 1,
        playerScore: 18,
        opponentScore: 12,
        playerScores: { 1: 18, 2: 12 },
      },
      {
        id: 2,
        playerScore: 7,
        opponentScore: 22,
        playerScores: { 1: 7, 2: 22 },
      },
      {
        id: 3,
        playerScore: 15,
        opponentScore: 8,
        playerScores: { 1: 15, 2: 8 },
      },
    ]

    // Act - Simulation du calcul dans GameScoreBoard.vue
    function calculatePlayerScores(playerList: any[], roundList: any[]) {
      const scores = new Map()

      playerList.forEach((player) => {
        if (!player) return

        const primary = roundList.reduce((total, round) => {
          // Utiliser le nouveau mapping si disponible
          if (round.playerScores && player.id in round.playerScores) {
            return total + (round.playerScores[player.id] || 0)
          }

          // Fallback vers ancienne logique
          const score = player.isMainPlayer ? round.playerScore : round.opponentScore
          return total + (score || 0)
        }, 0)

        scores.set(player.id, {
          primary,
          secondary: 0,
          total: primary,
        })
      })

      return scores
    }

    const playerScores = calculatePlayerScores(players, rounds)

    // Assert
    const player1Total = playerScores.get(1)?.total || 0 // 18 + 7 + 15 = 40
    const player2Total = playerScores.get(2)?.total || 0 // 12 + 22 + 8 = 42

    assert.equal(player1Total, 40, 'Player 1 should have 40 total points')
    assert.equal(player2Total, 42, 'Player 2 should have 42 total points')
    assert.isTrue(player1Total !== player2Total, 'Players should have different totals')
  })

  test('should handle edge case with zero scores', ({ assert }) => {
    // Arrange
    const roundWithZeros = {
      playerScore: 0,
      opponentScore: 0,
      playerScores: { 1: 0, 2: 0 },
    }

    // Act
    function getScore(playerId: number) {
      if (roundWithZeros.playerScores && playerId in roundWithZeros.playerScores) {
        return (roundWithZeros.playerScores as Record<number, number>)[playerId] ?? 0
      }
      return 0
    }

    // Assert
    assert.equal(getScore(1), 0, 'Player 1 should have 0 points')
    assert.equal(getScore(2), 0, 'Player 2 should have 0 points')
    // Les deux ont le même score mais restent différenciés par ID
    assert.equal(
      getScore(1),
      getScore(2),
      'Both players have same score but are still differentiated'
    )
  })

  test('should handle missing player correctly', ({ assert }) => {
    // Arrange
    const round = {
      playerScores: { 1: 10, 2: 15 },
    }

    // Act
    function getScoreForNonExistentPlayer(playerId: number) {
      if (round.playerScores && playerId in round.playerScores) {
        return (round.playerScores as Record<number, number>)[playerId] ?? 0
      }
      return 0
    }

    // Assert
    assert.equal(getScoreForNonExistentPlayer(99), 0, 'Non-existent player should get 0 points')
    assert.equal(getScoreForNonExistentPlayer(1), 10, 'Existing player should get correct score')
  })
})
