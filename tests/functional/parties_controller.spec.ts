import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Game from '#models/game'
import User from '#models/user'
import GameService from '#application/services/game_service'
import LucidGameRepository from '#infrastructure/repositories/lucid_game_repository'
import LucidPlayerRepository from '#infrastructure/repositories/lucid_player_repository'
import LucidRoundRepository from '#infrastructure/repositories/lucid_round_repository'
import LucidScoreRepository from '#infrastructure/repositories/lucid_score_repository'
import UuidV7IdGenerator from '#infrastructure/services/uuid_v7_id_generator'
import { PartieFilterDto } from '#application/dto/partie_filter_dto'

/**
 * Tests fonctionnels pour GameService et parties listing
 *
 * Valide l'intégration complète :
 * - Service métier GameService
 * - Filtrage et pagination
 * - Données structurées pour frontend
 */

/**
 * Simple factory function pour créer des parties de test
 */
async function createGame(options: {
  userId: number
  gameType?: 'MATCHED_PLAY' | 'NARRATIVE' | 'OPEN_PLAY'
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  pointsLimit?: number
  playerScore?: number | null
  opponentScore?: number | null
}) {
  return await Game.create({
    userId: options.userId,
    gameType: options.gameType || 'MATCHED_PLAY',
    status: options.status || 'PLANNED',
    pointsLimit: options.pointsLimit || 2000,
    playerScore: options.playerScore || null,
    opponentScore: options.opponentScore || null,
  })
}

async function createBatch(options: {
  userId: number
  count: number
  variants?: Array<{
    gameType?: 'MATCHED_PLAY' | 'NARRATIVE' | 'OPEN_PLAY'
    status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    pointsLimit?: number
    playerScore?: number | null
    opponentScore?: number | null
  }>
}) {
  const games = []
  for (let i = 0; i < options.count; i++) {
    const variant = options.variants?.[i] || {}
    const game = await createGame({
      userId: options.userId,
      gameType: variant.gameType,
      status: variant.status,
      pointsLimit: variant.pointsLimit,
      playerScore: variant.playerScore,
      opponentScore: variant.opponentScore,
    })
    games.push(game)
  }
  return games
}

test.group('GameService Parties Listing', (group) => {
  let user: User
  let gameService: GameService

  group.setup(async () => {
    const gameRepository = new LucidGameRepository()
    const playerRepository = new LucidPlayerRepository()
    const roundRepository = new LucidRoundRepository()
    const scoreRepository = new LucidScoreRepository()
    const idGenerator = new UuidV7IdGenerator()
    gameService = new GameService(
      gameRepository,
      playerRepository,
      roundRepository,
      scoreRepository,
      idGenerator
    )
  })

  group.each.setup(async () => {
    // Créer un utilisateur de test
    user = await User.create({
      username: 'test_parties',
      email: 'test.parties@example.com',
      fullName: 'Test User Parties',
      password: 'password123',
      roleId: 1,
      newsletterConsent: false,
      termsAcceptedAt: DateTime.now(),
    })
  })

  group.each.teardown(async () => {
    // Nettoyer après chaque test
    await Game.query().delete()
    await User.query().where('email', 'like', '%@example.com').delete()
  })

  /**
   * Test 1: Service list parties pour utilisateur sans parties
   */
  test('should return empty list for user with no parties', async ({ assert }) => {
    // Arrange: Filtres vides
    const filters: PartieFilterDto = { userId: user.id }

    // Act: Appel du service
    const result = await gameService.listParties(filters)

    // Assert: Liste vide
    assert.equal(result.parties.length, 0)
    assert.equal(result.pagination.totalCount, 0)
    assert.equal(result.pagination.hasMore, false)
    assert.equal(result.pagination.nextCursor, undefined)
  })

  /**
   * Test 2: Service retourne les parties de l'utilisateur avec données correctes
   */
  test('should return user parties with correct data', async ({ assert }) => {
    // Arrange: Créer des parties pour l'utilisateur
    await createBatch({
      userId: user.id,
      count: 3,
      variants: [
        { gameType: 'MATCHED_PLAY', status: 'IN_PROGRESS', playerScore: 85, opponentScore: 72 },
        { gameType: 'NARRATIVE', status: 'COMPLETED', playerScore: 92, opponentScore: 88 },
        { gameType: 'OPEN_PLAY', status: 'PLANNED' },
      ],
    })

    // Créer aussi une partie pour un autre utilisateur (ne doit pas apparaître)
    const otherUser = await User.create({
      username: 'other_user',
      email: 'other@example.com',
      fullName: 'Other User',
      password: 'password123',
      roleId: 1,
      newsletterConsent: false,
      termsAcceptedAt: DateTime.now(),
    })
    await createGame({ userId: otherUser.id })

    // Act: Récupération des parties
    const filters: PartieFilterDto = { userId: user.id }
    const result = await gameService.listParties(filters)

    // Assert: Vérification des données
    assert.equal(result.parties.length, 3)

    // Vérifier la structure des données
    const firstPartie = result.parties[0]
    assert.properties(firstPartie, [
      'id',
      'userId',
      'gameType',
      'pointsLimit',
      'status',
      'createdAt',
      'metadata',
    ])

    // Vérifier que toutes les parties appartiennent au bon utilisateur
    result.parties.forEach((partie) => {
      assert.equal(partie.userId, user.id)
    })
  })

  /**
   * Test 3: Filtrage par statut
   */
  test('should filter parties by status', async ({ assert }) => {
    // Arrange: Créer parties avec différents statuts
    await createBatch({
      userId: user.id,
      count: 4,
      variants: [
        { status: 'PLANNED' },
        { status: 'PLANNED' },
        { status: 'IN_PROGRESS' },
        { status: 'COMPLETED' },
      ],
    })

    // Act: Filtrer par statut PLANNED
    const filters: PartieFilterDto = {
      userId: user.id,
      status: ['PLANNED'],
    }
    const result = await gameService.listParties(filters)

    // Assert: Vérifier le filtrage
    assert.equal(result.parties.length, 2)

    result.parties.forEach((partie) => {
      assert.equal(partie.status, 'PLANNED')
    })
  })

  /**
   * Test 4: Filtrage par type de jeu
   */
  test('should filter parties by game type', async ({ assert }) => {
    // Arrange: Créer parties avec différents types
    await createBatch({
      userId: user.id,
      count: 3,
      variants: [
        { gameType: 'MATCHED_PLAY' },
        { gameType: 'MATCHED_PLAY' },
        { gameType: 'NARRATIVE' },
      ],
    })

    // Act: Filtrer par type MATCHED_PLAY
    const filters: PartieFilterDto = {
      userId: user.id,
      gameType: 'MATCHED_PLAY',
    }
    const result = await gameService.listParties(filters)

    // Assert: Vérifier le filtrage
    assert.equal(result.parties.length, 2)

    result.parties.forEach((partie) => {
      assert.equal(partie.gameType, 'MATCHED_PLAY')
    })
  })

  /**
   * Test 5: Pagination avec limite
   */
  test('should paginate results with limit parameter', async ({ assert }) => {
    // Arrange: Créer plus de parties que la limite
    await createBatch({
      userId: user.id,
      count: 25, // Plus que la limite par défaut de 20
    })

    // Act: Demander avec limite de 10
    const filters: PartieFilterDto = {
      userId: user.id,
      limit: 10,
    }
    const result = await gameService.listParties(filters)

    // Assert: Vérifier la pagination
    assert.equal(result.parties.length, 10)
    assert.isTrue(result.pagination.hasMore)
    assert.exists(result.pagination.nextCursor)
  })

  /**
   * Test 6: Filtres combinés
   */
  test('should apply multiple filters correctly', async ({ assert }) => {
    // Arrange: Créer parties variées
    await createBatch({
      userId: user.id,
      count: 6,
      variants: [
        { gameType: 'MATCHED_PLAY', status: 'PLANNED' },
        { gameType: 'MATCHED_PLAY', status: 'IN_PROGRESS' },
        { gameType: 'NARRATIVE', status: 'PLANNED' },
        { gameType: 'NARRATIVE', status: 'COMPLETED' },
        { gameType: 'OPEN_PLAY', status: 'PLANNED' },
        { gameType: 'OPEN_PLAY', status: 'CANCELLED' },
      ],
    })

    // Act: Appliquer filtres combinés
    const filters: PartieFilterDto = {
      userId: user.id,
      status: ['PLANNED'],
      gameType: 'MATCHED_PLAY',
    }
    const result = await gameService.listParties(filters)

    // Assert: Une seule partie doit matcher
    assert.equal(result.parties.length, 1)

    const partie = result.parties[0]
    assert.equal(partie.status, 'PLANNED')
    assert.equal(partie.gameType, 'MATCHED_PLAY')
  })

  /**
   * Test 7: Données avec scores
   */
  test('should include score data when available', async ({ assert }) => {
    // Arrange: Créer partie avec scores
    await createGame({
      userId: user.id,
      status: 'COMPLETED',
      playerScore: 95,
      opponentScore: 78,
    })

    // Act: Récupérer les parties
    const filters: PartieFilterDto = { userId: user.id }
    const result = await gameService.listParties(filters)

    // Assert: Vérifier les scores
    assert.equal(result.parties.length, 1)
    const partie = result.parties[0]
    assert.equal(partie.playerScore, 95)
    assert.equal(partie.opponentScore, 78)
    assert.equal(partie.status, 'COMPLETED')
  })

  /**
   * Test 8: Métadonnées enrichies
   */
  test('should provide enriched metadata', async ({ assert }) => {
    // Arrange: Créer partie terminée
    await createGame({
      userId: user.id,
      status: 'COMPLETED',
      playerScore: 88,
      opponentScore: 92,
    })

    // Act: Récupérer les parties
    const filters: PartieFilterDto = { userId: user.id }
    const result = await gameService.listParties(filters)

    // Assert: Vérifier les métadonnées
    assert.equal(result.parties.length, 1)
    const partie = result.parties[0]
    assert.properties(partie, ['metadata'])

    // La métadonnée devrait indiquer si la partie peut être modifiée
    assert.properties(partie.metadata, ['canBeModified'])
  })
})
