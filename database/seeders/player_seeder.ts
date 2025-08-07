import { BaseSeeder } from '@adonisjs/lucid/seeders'
import PlayerModel from '#models/player'
import GameModel from '#models/game'

export default class extends BaseSeeder {
  async run() {
    // Clear existing test data
    await PlayerModel.query().delete()
    await GameModel.query().delete()

    // Create test game first
    await GameModel.create({
      id: 1,
      userId: 123,
      gameType: 'MATCHED_PLAY',
      pointsLimit: 2000,
      status: 'PLANNED',
      playerScore: null,
      opponentScore: null,
      mission: null,
      notes: '',
    })

    // Create test players with known data (unique user_id per game)
    await PlayerModel.createMany([
      {
        id: 1,
        gameId: 1,
        userId: 123,
        pseudo: 'TestPlayer123',
      },
      {
        id: 2,
        gameId: 1,
        userId: null,
        pseudo: 'GuestPlayer',
      },
      {
        id: 3,
        gameId: 1,
        userId: 456,
        pseudo: 'FindablePlayer',
      },
      {
        id: 10,
        gameId: 1,
        userId: null,
        pseudo: 'Guest1',
      },
      {
        id: 11,
        gameId: 1,
        userId: null,
        pseudo: 'Guest2',
      },
      {
        id: 20,
        gameId: 1,
        userId: 789,
        pseudo: 'PlayerToDelete',
      },
      {
        id: 30,
        gameId: 1,
        userId: 321,
        pseudo: 'CombinedTest',
      },
    ])

    // Create additional test players for specific scenarios
    await PlayerModel.create({
      gameId: 1,
      userId: 999,
      pseudo: 'TakenPseudo',
    })

    // Create batch test players
    const batchPlayers = []
    for (let i = 1; i <= 5; i++) {
      batchPlayers.push({
        gameId: 1,
        userId: 100 + i,
        pseudo: `BatchPlayer${i}`,
      })
    }
    await PlayerModel.createMany(batchPlayers)
  }
}