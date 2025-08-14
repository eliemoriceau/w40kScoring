/**
 * CreatePartieCompleteDto - Application Layer Contract
 *
 * DTO pour l'orchestration complète de création de partie
 * Issue #18 - Orchestration 'création Partie complète'
 *
 * Architecture hexagonale : Contrat application layer pour coordination de services
 */

/**
 * Données du joueur pour création complète
 */
export interface PlayerDataDto {
  pseudo: string
  userId?: number | null
}

/**
 * Données du round pour création complète
 */
export interface RoundDataDto {
  roundNumber: number
  playerScore: number
  opponentScore: number
  scores?: ScoreDataDto[]
}

/**
 * Données du score détaillé
 */
export interface ScoreDataDto {
  playerId: string // Index du joueur (1, 2, 3...)
  scoreType: string // PRIMARY, SECONDARY, CHALLENGER, etc.
  scoreName: string
  scoreValue: number
}

/**
 * DTO principal pour création partie complète
 * Coordination des services : Partie → Players → Rounds → Scores
 */
export interface CreatePartieCompleteDto {
  // Métadonnées de la partie
  userId: number
  gameType: string
  pointsLimit: number
  mission?: string
  opponentId?: number

  // Données des joueurs
  players: PlayerDataDto[]

  // Données optionnelles des rounds et scores
  rounds?: RoundDataDto[]

  // Contexte d'autorisation
  requestingUserId: number
}

/**
 * Résultat de l'orchestration complète
 */
export interface PartieCompleteResult {
  partieId: number
  gameId: number
  players: Array<{
    id: number
    pseudo: string
    isGuest: boolean
    userId?: number
  }>
  rounds: Array<{
    id: number
    roundNumber: number
    playerScore: number
    opponentScore: number
    isCompleted: boolean
  }>
  scores: Array<{
    id: number
    roundId: number
    playerId: number
    scoreType: string
    scoreName: string
    scoreValue: number
  }>
  summary: {
    totalPlayerScore: number
    totalOpponentScore: number
    status: string
    mission?: string
  }
}

/**
 * Factory pour création et validation des DTOs
 * Pattern factory avec validation métier
 */
export class CreatePartieCompleteDtoFactory {
  /**
   * Crée et valide un DTO CreatePartieCompleteDto
   */
  static create(data: {
    userId: number
    gameType: string
    pointsLimit: number
    mission?: string
    opponentId?: number
    players: PlayerDataDto[]
    rounds?: RoundDataDto[]
    requestingUserId: number
  }): CreatePartieCompleteDto {
    // Validation des données de base
    this.validateBasicData(data)

    // Validation des joueurs
    this.validatePlayers(data.players)

    // Validation des rounds si fournis
    if (data.rounds && data.rounds.length > 0) {
      this.validateRounds(data.rounds, data.players.length)
    }

    // Validation de l'autorisation
    this.validateAuthorization(data.userId, data.requestingUserId)

    return {
      userId: data.userId,
      gameType: data.gameType.trim().toUpperCase(),
      pointsLimit: data.pointsLimit,
      mission: data.mission?.trim() || undefined,
      opponentId: data.opponentId,
      players: this.normalizePlayersData(data.players),
      rounds: data.rounds ? this.normalizeRoundsData(data.rounds) : undefined,
      requestingUserId: data.requestingUserId,
    }
  }

  /**
   * Validation des données de base de la partie
   */
  private static validateBasicData(data: Partial<CreatePartieCompleteDto>): void {
    if (!data.userId || !Number.isInteger(data.userId) || data.userId <= 0) {
      throw new PartieCompleteValidationError('User ID must be a positive integer')
    }

    if (!data.gameType || typeof data.gameType !== 'string' || data.gameType.trim() === '') {
      throw new PartieCompleteValidationError('Game type cannot be empty')
    }

    const validGameTypes = ['MATCHED_PLAY', 'NARRATIVE', 'OPEN_PLAY']
    if (!validGameTypes.includes(data.gameType.trim().toUpperCase())) {
      throw new PartieCompleteValidationError(
        `Game type must be one of: ${validGameTypes.join(', ')}`
      )
    }

    if (!data.pointsLimit || !Number.isInteger(data.pointsLimit) || data.pointsLimit <= 0) {
      throw new PartieCompleteValidationError('Points limit must be a positive integer')
    }

    const validPointsLimits = [500, 1000, 1500, 2000, 3000]
    if (!validPointsLimits.includes(data.pointsLimit)) {
      throw new PartieCompleteValidationError(
        `Points limit must be one of: ${validPointsLimits.join(', ')}`
      )
    }

    if (
      data.opponentId !== undefined &&
      (!Number.isInteger(data.opponentId) || data.opponentId <= 0)
    ) {
      throw new PartieCompleteValidationError('Opponent ID must be a positive integer')
    }

    if (
      !data.requestingUserId ||
      !Number.isInteger(data.requestingUserId) ||
      data.requestingUserId <= 0
    ) {
      throw new PartieCompleteValidationError('Requesting user ID must be a positive integer')
    }
  }

  /**
   * Validation des données des joueurs
   */
  private static validatePlayers(players: PlayerDataDto[]): void {
    if (!players || !Array.isArray(players) || players.length === 0) {
      throw new PartieCompleteValidationError('At least one player is required')
    }

    if (players.length > 4) {
      throw new PartieCompleteValidationError('Maximum 4 players allowed')
    }

    const pseudos = new Set<string>()

    for (const [index, player] of players.entries()) {
      if (!player.pseudo || typeof player.pseudo !== 'string' || player.pseudo.trim() === '') {
        throw new PartieCompleteValidationError(`Player ${index + 1}: Pseudo cannot be empty`)
      }

      const normalizedPseudo = player.pseudo.trim().toLowerCase()
      if (pseudos.has(normalizedPseudo)) {
        throw new PartieCompleteValidationError(`Duplicate pseudo: ${player.pseudo}`)
      }
      pseudos.add(normalizedPseudo)

      if (player.pseudo.length > 50) {
        throw new PartieCompleteValidationError(
          `Player ${index + 1}: Pseudo too long (max 50 characters)`
        )
      }

      if (player.userId !== undefined && player.userId !== null) {
        if (!Number.isInteger(player.userId) || player.userId <= 0) {
          throw new PartieCompleteValidationError(
            `Player ${index + 1}: User ID must be a positive integer`
          )
        }
      }
    }
  }

  /**
   * Validation des données des rounds
   */
  private static validateRounds(rounds: RoundDataDto[], playerCount: number): void {
    if (rounds.length === 0) {
      return // Rounds optionnels
    }

    if (rounds.length > 10) {
      throw new PartieCompleteValidationError('Maximum 10 rounds allowed')
    }

    const roundNumbers = new Set<number>()

    for (const [index, round] of rounds.entries()) {
      // Validation numéro de round
      if (!Number.isInteger(round.roundNumber) || round.roundNumber <= 0) {
        throw new PartieCompleteValidationError(
          `Round ${index + 1}: Round number must be a positive integer`
        )
      }

      if (roundNumbers.has(round.roundNumber)) {
        throw new PartieCompleteValidationError(`Duplicate round number: ${round.roundNumber}`)
      }
      roundNumbers.add(round.roundNumber)

      // Validation scores
      if (!Number.isInteger(round.playerScore) || round.playerScore < 0) {
        throw new PartieCompleteValidationError(
          `Round ${round.roundNumber}: Player score must be a non-negative integer`
        )
      }

      if (!Number.isInteger(round.opponentScore) || round.opponentScore < 0) {
        throw new PartieCompleteValidationError(
          `Round ${round.roundNumber}: Opponent score must be a non-negative integer`
        )
      }

      if (round.playerScore > 100 || round.opponentScore > 100) {
        throw new PartieCompleteValidationError(
          `Round ${round.roundNumber}: Scores too high (max 100 per round)`
        )
      }

      // Validation scores détaillés si fournis
      if (round.scores && round.scores.length > 0) {
        this.validateDetailedScores(round.scores, playerCount, round.roundNumber)
      }
    }

    // Validation séquence des rounds
    const sortedNumbers = Array.from(roundNumbers).sort((a, b) => a - b)
    for (const [index, sortedNumber] of sortedNumbers.entries()) {
      if (sortedNumber !== index + 1) {
        throw new PartieCompleteValidationError('Round numbers must be sequential starting from 1')
      }
    }
  }

  /**
   * Validation des scores détaillés
   */
  private static validateDetailedScores(
    scores: ScoreDataDto[],
    playerCount: number,
    roundNumber: number
  ): void {
    const validScoreTypes = ['PRIMARY', 'SECONDARY', 'CHALLENGER', 'BONUS', 'PENALTY', 'OBJECTIVE']

    for (const [index, score] of scores.entries()) {
      // Validation playerId
      const playerIndex = Number.parseInt(score.playerId)
      if (!Number.isInteger(playerIndex) || playerIndex < 1 || playerIndex > playerCount) {
        throw new PartieCompleteValidationError(
          `Round ${roundNumber}, Score ${index + 1}: Invalid player ID (must be 1-${playerCount})`
        )
      }

      // Validation scoreType
      if (!validScoreTypes.includes(score.scoreType.toUpperCase())) {
        throw new PartieCompleteValidationError(
          `Round ${roundNumber}, Score ${index + 1}: Invalid score type (${validScoreTypes.join(', ')})`
        )
      }

      // Validation scoreName
      if (!score.scoreName || score.scoreName.trim() === '') {
        throw new PartieCompleteValidationError(
          `Round ${roundNumber}, Score ${index + 1}: Score name cannot be empty`
        )
      }

      // Validation scoreValue
      if (!Number.isInteger(score.scoreValue)) {
        throw new PartieCompleteValidationError(
          `Round ${roundNumber}, Score ${index + 1}: Score value must be an integer`
        )
      }

      if (score.scoreValue < -10 || score.scoreValue > 15) {
        throw new PartieCompleteValidationError(
          `Round ${roundNumber}, Score ${index + 1}: Score value out of range (-10 to 15)`
        )
      }

      // Validation spécifique SECONDARY
      if (score.scoreType.toUpperCase() === 'SECONDARY' && score.scoreName.trim().length < 3) {
        throw new PartieCompleteValidationError(
          `Round ${roundNumber}, Score ${index + 1}: SECONDARY score name must be at least 3 characters`
        )
      }
    }
  }

  /**
   * Validation de l'autorisation
   */
  private static validateAuthorization(userId: number, requestingUserId: number): void {
    if (userId !== requestingUserId) {
      throw new PartieCompleteValidationError(
        'Requesting user must be the owner of the partie being created'
      )
    }
  }

  /**
   * Normalisation des données des joueurs
   */
  private static normalizePlayersData(players: PlayerDataDto[]): PlayerDataDto[] {
    return players.map((player) => ({
      pseudo: player.pseudo.trim(),
      userId: player.userId || null,
    }))
  }

  /**
   * Normalisation des données des rounds
   */
  private static normalizeRoundsData(rounds: RoundDataDto[]): RoundDataDto[] {
    return rounds.map((round) => ({
      roundNumber: round.roundNumber,
      playerScore: round.playerScore,
      opponentScore: round.opponentScore,
      scores: round.scores
        ? round.scores.map((score) => ({
            playerId: score.playerId,
            scoreType: score.scoreType.toUpperCase(),
            scoreName: score.scoreName.trim(),
            scoreValue: score.scoreValue,
          }))
        : undefined,
    }))
  }
}

/**
 * Erreur de validation spécialisée pour création partie complète
 */
export class PartieCompleteValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PartieCompleteValidationError'
  }
}
