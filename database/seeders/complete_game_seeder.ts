import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import GameModel from '#models/game'
import PlayerModel from '#models/player'
import RoundModel from '#models/round'
import ScoreModel from '#models/score'
import UserModel from '#models/user'
import CompleteGameFactory from '#tests/helpers/complete_game_factory'
import GameId from '#domain/value-objects/game_id'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'

/**
 * CompleteGameSeeder
 *
 * Creates complete game scenarios for development and testing.
 * Generates realistic W40K game data including:
 * - 2 players (1 registered user, 1 guest)
 * - 5 rounds with varied scores
 * - Detailed scoring per round
 *
 * Usage: node ace db:seed
 *
 * Issue #12: Complete seeder/factory for full game scenarios
 */
export default class extends BaseSeeder {
  async run() {
    console.log('🚀 Starting Complete Game Seeder...')

    // Clear existing data
    await this.clearExistingData()

    // Create demo users first (needed for registered players)
    const users = await this.createDemoUsers()
    console.log(`👥 Created ${users.length} demo users`)

    // Create multiple complete game scenarios
    const scenarios = [
      {
        name: 'Competitive Tournament Game',
        config: {
          gameId: new GameId(1),
          userId: users[0].id,
          gameType: GameType.MATCHED_PLAY,
          pointsLimit: new PointsLimit(2000),
          players: [
            { pseudo: 'ImperialCommander_VII', userId: users[0].id },
            { pseudo: 'Tau_Shadowsun', userId: users[1].id },
          ],
          scorePattern: 'realistic' as const,
          includeDetailedScores: true,
          seed: 12345, // Reproducible results
        },
      },
      {
        name: 'Learning Game (Combat Patrol)',
        config: {
          gameId: new GameId(2),
          userId: users[2].id,
          gameType: GameType.NARRATIVE,
          pointsLimit: new PointsLimit(500),
          players: [
            { pseudo: 'Rookie_SpaceMarine', userId: users[2].id },
            { pseudo: 'Guest_Newbie', userId: null }, // Guest player
          ],
          roundCount: 3, // Shorter game for beginners
          scorePattern: 'realistic' as const,
          includeDetailedScores: false,
          seed: 67890,
        },
      },
      {
        name: 'Close Championship Match',
        config: {
          gameId: new GameId(3),
          userId: users[3].id,
          gameType: GameType.MATCHED_PLAY,
          pointsLimit: new PointsLimit(2000),
          players: [
            { pseudo: 'ChampionPlayer_Alpha', userId: users[3].id },
            { pseudo: 'ContenderBeta_Prime', userId: users[4].id },
          ],
          scorePattern: 'close' as const,
          includeDetailedScores: true,
          seed: 11111,
        },
      },
    ]

    // Generate and persist each scenario
    for (const scenario of scenarios) {
      console.log(`🎮 Creating scenario: ${scenario.name}`)
      await this.createCompleteGameScenario(scenario.config)
    }

    console.log('✅ Complete Game Seeder finished successfully!')
    console.log('')
    console.log('📊 Generated data summary:')
    const gameCount = await GameModel.query().count('* as total')
    const playerCount = await PlayerModel.query().count('* as total')
    const roundCount = await RoundModel.query().count('* as total')
    const scoreCount = await ScoreModel.query().count('* as total')

    console.log(`- Games: ${gameCount[0].$extras.total}`)
    console.log(`- Players: ${playerCount[0].$extras.total}`)
    console.log(`- Rounds: ${roundCount[0].$extras.total}`)
    console.log(`- Scores: ${scoreCount[0].$extras.total}`)
    console.log('')
    console.log('🎯 You can now test the application with realistic game data!')
  }

  /**
   * Clear existing test/demo data
   */
  private async clearExistingData() {
    console.log('🧹 Clearing existing data...')

    // Order matters due to foreign keys
    await ScoreModel.query().delete()
    await RoundModel.query().delete()
    await PlayerModel.query().delete()
    await GameModel.query().delete()

    // Keep users if they exist for other purposes
    // Only delete demo users we created
    await UserModel.query().where('email', 'like', '%@demo.w40k%').delete()
  }

  /**
   * Create demo users for testing
   */
  private async createDemoUsers() {
    const demoUsers = [
      {
        username: 'imperial_commander',
        email: 'imperial.commander@demo.w40k',
        fullName: 'Imperial Commander VII',
        password: 'demo123', // Will be hashed by model
        roleId: 1, // USER role
        newsletterConsent: false,
        termsAcceptedAt: DateTime.now(),
      },
      {
        username: 'tau_shadowsun',
        email: 'tau.commander@demo.w40k',
        fullName: 'Tau Commander Shadowsun',
        password: 'demo123',
        roleId: 1, // USER role
        newsletterConsent: false,
        termsAcceptedAt: DateTime.now(),
      },
      {
        username: 'rookie_marine',
        email: 'rookie.marine@demo.w40k',
        fullName: 'Rookie Space Marine',
        password: 'demo123',
        roleId: 1, // USER role
        newsletterConsent: false,
        termsAcceptedAt: DateTime.now(),
      },
      {
        username: 'champion_alpha',
        email: 'champion.alpha@demo.w40k',
        fullName: 'Champion Player Alpha',
        password: 'demo123',
        roleId: 1, // USER role
        newsletterConsent: false,
        termsAcceptedAt: DateTime.now(),
      },
      {
        username: 'contender_beta',
        email: 'contender.beta@demo.w40k',
        fullName: 'Contender Beta Prime',
        password: 'demo123',
        roleId: 1, // USER role
        newsletterConsent: false,
        termsAcceptedAt: DateTime.now(),
      },
    ]

    return await UserModel.createMany(demoUsers)
  }

  /**
   * Create and persist a complete game scenario
   */
  private async createCompleteGameScenario(config: any) {
    // Generate the complete game using our factory
    const completeGame = CompleteGameFactory.createCompleteGame(config)

    // Persist the game
    await GameModel.create({
      id: completeGame.game.id.value,
      userId: completeGame.game.userId,
      gameType: completeGame.game.gameType.value as 'MATCHED_PLAY' | 'NARRATIVE' | 'OPEN_PLAY',
      pointsLimit: completeGame.game.pointsLimit.value,
      status: completeGame.game.status.value as
        | 'PLANNED'
        | 'IN_PROGRESS'
        | 'COMPLETED'
        | 'CANCELLED',
      opponentId: completeGame.game.opponentId,
      playerScore: completeGame.game.playerScore,
      opponentScore: completeGame.game.opponentScore,
      mission: completeGame.game.mission,
      notes: completeGame.game.notes,
      startedAt: completeGame.game.startedAt
        ? DateTime.fromJSDate(completeGame.game.startedAt)
        : null,
      completedAt: completeGame.game.completedAt
        ? DateTime.fromJSDate(completeGame.game.completedAt)
        : null,
      createdAt: DateTime.fromJSDate(completeGame.game.createdAt),
    })

    // Persist players
    for (const player of completeGame.players) {
      await PlayerModel.create({
        id: player.id.value,
        gameId: player.gameId.value,
        userId: player.userId,
        pseudo: player.pseudo.value,
        isGuest: player.isGuest,
        createdAt: DateTime.fromJSDate(player.createdAt),
      })
    }

    // Persist rounds
    for (const round of completeGame.rounds) {
      await RoundModel.create({
        id: round.id.value,
        gameId: round.gameId.value,
        roundNumber: round.roundNumber.value,
        playerScore: round.playerScore,
        opponentScore: round.opponentScore,
        isCompleted: round.isCompleted,
        createdAt: DateTime.fromJSDate(round.createdAt),
      })
    }

    // Persist detailed scores (if any)
    for (const score of completeGame.scores) {
      await ScoreModel.create({
        id: Number(score.id.value),
        roundId: score.roundId.value,
        joueurId: score.playerId.value,
        typeScore: score.scoreType.value,
        nomScore: score.scoreName.value,
        valeurScore: score.scoreValue.value,
        createdAt: DateTime.fromJSDate(score.createdAt),
      })
    }

    console.log(
      `  ✓ Game ${completeGame.game.id.value}: ${completeGame.players.length} players, ${completeGame.rounds.length} rounds, ${completeGame.scores.length} scores`
    )
  }
}
