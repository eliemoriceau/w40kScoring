import vine from '@vinejs/vine'

/**
 * Validator pour la création de partie via le wizard
 *
 * Valide les données complètes du wizard de création de partie
 * basé sur les types TypeScript du frontend.
 */

/**
 * Schema pour un joueur
 */
const playerSchema = vine.object({
  pseudo: vine.string().minLength(3).maxLength(20).trim(),
  army: vine.string().maxLength(50).trim().optional(),
  userId: vine.number().positive().optional(),
  isCurrentUser: vine.boolean().optional(),
})

/**
 * Schema pour un score détaillé
 */
const scoreSchema = vine.object({
  playerId: vine.string(),
  scoreType: vine.string().in(['PRIMARY', 'SECONDARY', 'CHALLENGER']),
  scoreName: vine.string().maxLength(50).trim().optional(),
  scoreValue: vine.number().min(0).max(50),
})

/**
 * Schema pour un round
 */
const roundSchema = vine.object({
  roundNumber: vine.number().min(1).max(5),
  playerScore: vine.number().min(0).max(100).optional(),
  opponentScore: vine.number().min(0).max(100).optional(),
  scores: vine.array(scoreSchema).optional(),
})

/**
 * Validator principal pour la création de partie
 */
export const gameCreationWizardValidator = vine.compile(
  vine.object({
    // Étape 1: Configuration de base
    gameType: vine.string().in(['MATCHED_PLAY', 'NARRATIVE', 'OPEN_PLAY']),
    pointsLimit: vine.number().min(500).max(5000),
    mission: vine.string().maxLength(100).trim().optional(),

    // Étape 2: Adversaire
    opponentType: vine.string().in(['existing', 'invite', 'guest']),
    opponentId: vine.number().positive().optional(),
    opponentEmail: vine.string().email().maxLength(255).trim().optional(),
    opponentPseudo: vine.string().minLength(3).maxLength(20).trim().optional(),

    // Étape 3: Joueurs
    players: vine.array(playerSchema).minLength(2).maxLength(2),

    // Étape 4: Rounds
    enableRounds: vine.boolean(),
    rounds: vine.array(roundSchema).optional(),
  })
)

/**
 * Validator spécifique pour la recherche d'utilisateurs
 */
export const userSearchValidator = vine.compile(
  vine.object({
    q: vine.string().minLength(2).maxLength(50).trim(),
    limit: vine.number().min(1).max(20).optional(),
  })
)

/**
 * Types inférés pour utilisation TypeScript
 */
export type GameCreationWizardRequest = {
  gameType: 'MATCHED_PLAY' | 'NARRATIVE' | 'OPEN_PLAY'
  pointsLimit: number
  mission?: string
  opponentType: 'existing' | 'invite' | 'guest'
  opponentId?: number
  opponentEmail?: string
  opponentPseudo?: string
  players: Array<{
    pseudo: string
    army?: string
    userId?: number
    isCurrentUser?: boolean
  }>
  enableRounds: boolean
  rounds?: Array<{
    roundNumber: number
    playerScore?: number
    opponentScore?: number
    scores?: Array<{
      playerId: string
      scoreType: 'PRIMARY' | 'SECONDARY' | 'CHALLENGER'
      scoreName?: string
      scoreValue: number
    }>
  }>
}

export type UserSearchRequest = {
  q: string
  limit?: number
}

/**
 * Validation des règles métier spécifiques
 */
export class GameCreationWizardValidationRules {
  /**
   * Valide que la limite de points est un multiple de 50
   */
  static validatePointsLimit(pointsLimit: number): boolean {
    return pointsLimit % 50 === 0
  }

  /**
   * Valide la cohérence des données d'adversaire
   */
  static validateOpponentData(data: GameCreationWizardRequest): string[] {
    const errors: string[] = []

    switch (data.opponentType) {
      case 'existing':
        if (!data.opponentId) {
          errors.push('opponentId est requis pour un adversaire existant')
        }
        break

      case 'invite':
        if (!data.opponentEmail) {
          errors.push('opponentEmail est requis pour une invitation')
        }
        break

      case 'guest':
        if (!data.opponentPseudo) {
          errors.push('opponentPseudo est requis pour un adversaire invité')
        }
        break
    }

    return errors
  }

  /**
   * Valide que les joueurs sont correctement configurés
   */
  static validatePlayers(players: GameCreationWizardRequest['players']): string[] {
    const errors: string[] = []

    if (players.length !== 2) {
      errors.push('Exactement 2 joueurs sont requis')
      return errors
    }

    const currentUserCount = players.filter((p) => p.isCurrentUser).length
    if (currentUserCount !== 1) {
      errors.push('Exactement 1 joueur doit être marqué comme utilisateur actuel')
    }

    // Vérifier que les pseudos sont uniques
    const pseudos = players.map((p) => p.pseudo.toLowerCase())
    if (new Set(pseudos).size !== pseudos.length) {
      errors.push('Les pseudos des joueurs doivent être uniques')
    }

    return errors
  }

  /**
   * Valide les rounds si activés
   */
  static validateRounds(data: GameCreationWizardRequest): string[] {
    const errors: string[] = []

    if (data.enableRounds && data.rounds) {
      if (data.rounds.length > 5) {
        errors.push('Maximum 5 rounds autorisés')
      }

      // Vérifier que les numéros de rounds sont consécutifs
      const roundNumbers = data.rounds.map((r) => r.roundNumber).sort()
      for (const [index, roundNumber] of roundNumbers.entries()) {
        if (roundNumber !== index + 1) {
          errors.push('Les numéros de rounds doivent être consécutifs à partir de 1')
          break
        }
      }

      // Valider les scores détaillés si présents
      data.rounds.forEach((round, index) => {
        if (round.scores) {
          round.scores.forEach((score) => {
            if (score.scoreType === 'SECONDARY' && !score.scoreName) {
              errors.push(`Round ${index + 1}: scoreName requis pour les scores SECONDARY`)
            }
          })
        }
      })
    }

    return errors
  }

  /**
   * Validation complète des données
   */
  static validateComplete(data: GameCreationWizardRequest): string[] {
    const errors: string[] = []

    // Validation des règles métier
    if (!this.validatePointsLimit(data.pointsLimit)) {
      errors.push('La limite de points doit être un multiple de 50')
    }

    errors.push(...this.validateOpponentData(data))
    errors.push(...this.validatePlayers(data.players))
    errors.push(...this.validateRounds(data))

    return errors
  }
}
