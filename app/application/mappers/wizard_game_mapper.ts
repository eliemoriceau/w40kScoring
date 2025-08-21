import type { GameCreationWizardRequest } from '#validators/game_creation_wizard_validator'
import type { CompleteGameData, PlayerData, RoundData } from '#application/services/game_service'
import GameType from '#domain/value-objects/game_type'
import PointsLimit from '#domain/value-objects/points_limit'
import Pseudo from '#domain/value-objects/pseudo'

/**
 * Mapper pour convertir les données du wizard frontend
 * vers les structures attendues par les services application
 */
export class WizardGameMapper {
  /**
   * Convertit les données du wizard vers CompleteGameData
   */
  static toCompleteGameData(
    wizardData: GameCreationWizardRequest,
    currentUserId: number
  ): CompleteGameData {
    // Validation des value objects
    const gameType = GameType.fromValue(wizardData.gameType)
    const pointsLimit = new PointsLimit(wizardData.pointsLimit)

    // Mapper les joueurs
    const players: PlayerData[] = wizardData.players.map((player) => ({
      pseudo: player.pseudo,
      userId: player.userId || null,
    }))

    // Ne plus inclure les rounds - ils seront créés automatiquement
    // Les rounds sont désormais créés automatiquement lors de la création de partie
    const rounds: RoundData[] | undefined = undefined

    return {
      userId: currentUserId,
      gameType: gameType.value,
      pointsLimit: pointsLimit.value,
      players,
      rounds,
      mission: wizardData.mission,
    }
  }

  /**
   * Résout l'userId de l'adversaire selon le type d'adversaire
   */
  static resolveOpponentUserId(wizardData: GameCreationWizardRequest): number | undefined {
    switch (wizardData.opponentType) {
      case 'existing':
        return wizardData.opponentId

      case 'invite':
        // Pour les invitations, on devra créer l'utilisateur ou gérer l'email
        // Pour l'instant, on retourne undefined (joueur invité)
        return undefined

      case 'guest':
        // Les joueurs invités n'ont pas d'userId
        return undefined

      default:
        return undefined
    }
  }

  /**
   * Créé les données de joueur pour l'utilisateur actuel
   */
  static createCurrentUserPlayerData(
    wizardData: GameCreationWizardRequest,
    currentUserId: number
  ): PlayerData {
    const currentUserPlayer = wizardData.players.find((p) => p.isCurrentUser)
    if (!currentUserPlayer) {
      throw new Error('Aucun joueur marqué comme utilisateur actuel')
    }

    // Validation du pseudo
    new Pseudo(currentUserPlayer.pseudo) // Lève une exception si invalide

    return {
      pseudo: currentUserPlayer.pseudo,
      userId: currentUserId,
    }
  }

  /**
   * Créé les données de joueur pour l'adversaire
   */
  static createOpponentPlayerData(wizardData: GameCreationWizardRequest): PlayerData {
    const opponentPlayer = wizardData.players.find((p) => !p.isCurrentUser)
    if (!opponentPlayer) {
      throw new Error('Aucun joueur adversaire trouvé')
    }

    // Validation du pseudo
    new Pseudo(opponentPlayer.pseudo) // Lève une exception si invalide

    // Déterminer l'userId selon le type d'adversaire
    let userId: number | null = null
    switch (wizardData.opponentType) {
      case 'existing':
        userId = wizardData.opponentId || null
        break
      case 'invite':
        // Pour les invitations, on peut créer un utilisateur temporaire
        // ou gérer différemment selon la logique métier
        userId = null
        break
      case 'guest':
        userId = null
        break
    }

    return {
      pseudo: opponentPlayer.pseudo,
      userId,
    }
  }

  /**
   * Valide la cohérence des données du wizard
   */
  static validateWizardData(wizardData: GameCreationWizardRequest): void {
    // Validation du type de jeu
    GameType.fromValue(wizardData.gameType)

    // Validation de la limite de points
    new PointsLimit(wizardData.pointsLimit)

    // Validation des pseudos
    wizardData.players.forEach((player) => {
      new Pseudo(player.pseudo)
    })

    // Validation de la cohérence adversaire
    const errors: string[] = []

    switch (wizardData.opponentType) {
      case 'existing':
        if (!wizardData.opponentId) {
          errors.push('opponentId requis pour un adversaire existant')
        }
        break

      case 'invite':
        if (!wizardData.opponentEmail) {
          errors.push('opponentEmail requis pour une invitation')
        }
        break

      case 'guest':
        if (!wizardData.opponentPseudo) {
          errors.push('opponentPseudo requis pour un adversaire invité')
        }
        break
    }

    if (errors.length > 0) {
      throw new Error(`Validation échouée: ${errors.join(', ')}`)
    }

    // Validation des joueurs
    const currentUserCount = wizardData.players.filter((p) => p.isCurrentUser).length
    if (currentUserCount !== 1) {
      throw new Error('Exactement un joueur doit être marqué comme utilisateur actuel')
    }

    if (wizardData.players.length !== 2) {
      throw new Error('Exactement 2 joueurs sont requis')
    }
  }

  /**
   * Extrait les métadonnées de la partie pour la réponse
   */
  static extractGameMetadata(wizardData: GameCreationWizardRequest) {
    return {
      gameType: wizardData.gameType,
      pointsLimit: wizardData.pointsLimit,
      mission: wizardData.mission,
      opponentType: wizardData.opponentType,
      enableRounds: false, // Rounds désormais ajoutés après création
      roundsCount: 0, // Pas de rounds lors de la création initiale
      playersCount: wizardData.players.length,
    }
  }
}
