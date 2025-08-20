/**
 * Composable pour la validation avancée du wizard
 */

import type { GameCreationWizardData, GameType } from '../types/wizard'

export const useGameValidation = () => {
  // Messages d'erreur personnalisés
  const errorMessages = {
    gameType: 'Veuillez sélectionner un type de jeu',
    pointsLimit: 'La limite de points doit être entre 500 et 5000, multiple de 50',
    opponentRequired: 'Veuillez sélectionner un adversaire',
    opponentEmail: 'Veuillez entrer une adresse email valide',
    opponentPseudo: 'Le pseudo doit contenir au moins 3 caractères',
    playersRequired: 'Deux joueurs sont requis pour une partie',
    playerPseudo: 'Le pseudo doit contenir entre 3 et 20 caractères',
    playerArmy: "Le nom d'armée ne peut pas dépasser 50 caractères",
  }

  // Validation des types de jeu
  const validateGameType = (gameType: GameType): boolean => {
    const validTypes: GameType[] = ['MATCHED_PLAY', 'NARRATIVE', 'OPEN_PLAY']
    return validTypes.includes(gameType)
  }

  // Validation des limites de points
  const validatePointsLimit = (points: number): boolean => {
    return points >= 500 && points <= 5000 && points % 50 === 0 && Number.isInteger(points)
  }

  // Validation email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  // Validation pseudo
  const validatePseudo = (pseudo: string): boolean => {
    const trimmed = pseudo.trim()
    return trimmed.length >= 3 && trimmed.length <= 20
  }

  // Validation armée
  const validateArmy = (army: string): boolean => {
    return army.trim().length <= 50
  }

  // Validation des scores de round
  const validateRoundScore = (score: number): boolean => {
    return Number.isInteger(score) && score >= 0 && score <= 50
  }

  // Validation complète d'une étape
  const validateStep = (
    stepNumber: number,
    data: GameCreationWizardData
  ): {
    isValid: boolean
    errors: Record<string, string[]>
  } => {
    const errors: Record<string, string[]> = {}

    switch (stepNumber) {
      case 1:
        if (!validateGameType(data.gameType)) {
          errors.gameType = [errorMessages.gameType]
        }
        if (!validatePointsLimit(data.pointsLimit)) {
          errors.pointsLimit = [errorMessages.pointsLimit]
        }
        break

      case 2:
        if (data.opponentType === 'existing' && !data.opponentId) {
          errors.opponent = [errorMessages.opponentRequired]
        }
        if (data.opponentType === 'invite') {
          if (!data.opponentEmail || !validateEmail(data.opponentEmail)) {
            errors.opponentEmail = [errorMessages.opponentEmail]
          }
        }
        if (data.opponentType === 'guest') {
          if (!data.opponentPseudo || !validatePseudo(data.opponentPseudo)) {
            errors.opponentPseudo = [errorMessages.opponentPseudo]
          }
        }
        break

      case 3:
        if (data.players.length !== 2) {
          errors.players = [errorMessages.playersRequired]
        }

        data.players.forEach((player, index) => {
          if (!validatePseudo(player.pseudo)) {
            errors[`player${index}Pseudo`] = [errorMessages.playerPseudo]
          }
          if (player.army && !validateArmy(player.army)) {
            errors[`player${index}Army`] = [errorMessages.playerArmy]
          }
        })
        break

      case 4:
        // Validation finale : toutes les étapes précédentes (Step4 est maintenant Summary)
        const step1 = validateStep(1, data)
        const step2 = validateStep(2, data)
        const step3 = validateStep(3, data)

        Object.assign(errors, step1.errors, step2.errors, step3.errors)
        break
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  // Validation de données complètes pour soumission
  const validateForSubmission = (
    data: GameCreationWizardData
  ): {
    isValid: boolean
    errors: Record<string, string[]>
    warnings: string[]
  } => {
    const warnings: string[] = []
    let allErrors: Record<string, string[]> = {}

    // Valider toutes les étapes (4 étapes maintenant)
    for (let step = 1; step <= 4; step++) {
      const stepValidation = validateStep(step, data)
      if (!stepValidation.isValid) {
        Object.assign(allErrors, stepValidation.errors)
      }
    }

    // Ajouter des avertissements
    if (!data.mission) {
      warnings.push('Aucune mission sélectionnée - une mission aléatoire sera assignée')
    }

    if (data.players.some((p) => !p.army || p.army.trim() === '')) {
      warnings.push("Certains joueurs n'ont pas d'armée spécifiée")
    }

    if (!data.enableRounds) {
      warnings.push('Les rounds ne seront pas pré-créés')
    }

    return {
      isValid: Object.keys(allErrors).length === 0,
      errors: allErrors,
      warnings,
    }
  }

  // Suggestions d'amélioration
  const getSuggestions = (data: GameCreationWizardData): string[] => {
    const suggestions: string[] = []

    // Suggestions de points selon le type de jeu
    if (data.gameType === 'MATCHED_PLAY' && data.pointsLimit !== 2000) {
      suggestions.push('2000 points est la limite standard pour le Matched Play')
    }

    if (data.gameType === 'NARRATIVE' && data.pointsLimit > 1500) {
      suggestions.push('Les parties narratives sont souvent meilleures avec moins de points')
    }

    // Suggestions d'armées
    if (data.players.length === 2) {
      const armies = data.players.map((p) => p.army?.toLowerCase().trim()).filter(Boolean)
      const hasDuplicateArmies = armies.length !== new Set(armies).size

      if (hasDuplicateArmies) {
        suggestions.push('Considérez des armées différentes pour plus de variété')
      }
    }

    return suggestions
  }

  // Constantes utiles
  const constants = {
    minPoints: 500,
    maxPoints: 5000,
    pointsStep: 50,
    standardPoints: [1000, 1500, 2000, 2500, 3000],
    minPseudoLength: 3,
    maxPseudoLength: 20,
    maxArmyLength: 50,
    maxRounds: 5,
    maxRoundScore: 50,
  }

  return {
    // Fonctions de validation
    validateGameType,
    validatePointsLimit,
    validateEmail,
    validatePseudo,
    validateArmy,
    validateRoundScore,
    validateStep,
    validateForSubmission,

    // Utilitaires
    getSuggestions,
    errorMessages,
    constants,
  }
}
