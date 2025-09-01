import { ref, computed, type Ref } from 'vue'
import type { GameDetailDto, SecondaryObjective, PredefinedSecondaryObjectives } from '../types'

/**
 * Composable pour la gestion des objectifs secondaires W40K
 * Fournit les données et logique pour les objectifs secondaires du jeu
 */
export function useW40KSecondaryObjectives(game: Ref<GameDetailDto | null>) {
  // État réactif
  const selectedObjectives = ref<Map<string, SecondaryObjective[]>>(new Map())
  const showSecondaries = ref(true)

  // Objectifs prédéfinis W40K (Édition 10)
  const predefinedObjectives: PredefinedSecondaryObjectives = {
    tactical: [
      {
        id: 'tactical-1',
        name: 'Assassinate',
        description: 'Détruisez les unités de Personnage ennemies',
        maxPoints: 15,
        category: 'tactical',
      },
      {
        id: 'tactical-2',
        name: 'Bring It Down',
        description: 'Détruisez les véhicules et monstres ennemis',
        maxPoints: 15,
        category: 'tactical',
      },
      {
        id: 'tactical-3',
        name: 'Titan Hunter',
        description: 'Détruisez les unités Titanic ennemies',
        maxPoints: 15,
        category: 'tactical',
      },
      {
        id: 'tactical-4',
        name: 'Slay the Warlord',
        description: 'Détruisez le Seigneur de Guerre ennemi',
        maxPoints: 6,
        category: 'tactical',
      },
    ],

    strategic: [
      {
        id: 'strategic-1',
        name: 'Deploy Teleport Homer',
        description: 'Contrôlez des positions stratégiques avec vos unités',
        maxPoints: 15,
        category: 'strategic',
      },
      {
        id: 'strategic-2',
        name: 'Investigate Sites',
        description: "Explorez les sites d'intérêt sur le champ de bataille",
        maxPoints: 15,
        category: 'strategic',
      },
      {
        id: 'strategic-3',
        name: "Secure No Man's Land",
        description: 'Contrôlez le centre du champ de bataille',
        maxPoints: 15,
        category: 'strategic',
      },
      {
        id: 'strategic-4',
        name: 'Behind Enemy Lines',
        description: 'Placez vos unités dans la zone de déploiement ennemie',
        maxPoints: 15,
        category: 'strategic',
      },
    ],

    warden: [
      {
        id: 'warden-1',
        name: 'Defend Stronghold',
        description: 'Protégez vos positions défensives clés',
        maxPoints: 15,
        category: 'warden',
      },
      {
        id: 'warden-2',
        name: 'Cleanse',
        description: 'Contrôlez des marqueurs objectifs dans votre zone',
        maxPoints: 15,
        category: 'warden',
      },
      {
        id: 'warden-3',
        name: 'No Prisoners',
        description: 'Éliminez complètement les unités ennemies',
        maxPoints: 15,
        category: 'warden',
      },
      {
        id: 'warden-4',
        name: 'Area Denial',
        description: "Empêchez l'ennemi de contrôler certaines zones",
        maxPoints: 12,
        category: 'warden',
      },
    ],
  }

  // Objectifs disponibles par catégorie
  const availableObjectives = computed(() => predefinedObjectives)

  // Tous les objectifs dans une liste plate
  const allObjectives = computed(() => [
    ...predefinedObjectives.tactical,
    ...predefinedObjectives.strategic,
    ...predefinedObjectives.warden,
  ])

  // Objectifs sélectionnés pour le jeu actuel
  const gameObjectives = computed(() => {
    if (!game.value) return []
    return selectedObjectives.value.get(game.value.id.toString()) || []
  })

  // Actions
  const selectObjective = (playerId: string, objective: SecondaryObjective) => {
    if (!game.value) return

    const gameId = game.value.id.toString()
    const current = selectedObjectives.value.get(gameId) || []

    // Limite de 3 objectifs par joueur en W40K
    const playerObjectives = current.filter((obj) => obj.id.includes(playerId))
    if (playerObjectives.length >= 3) {
      throw new Error('Maximum 3 objectifs secondaires par joueur')
    }

    // Créer un objectif unique pour ce joueur
    const playerObjective: SecondaryObjective = {
      ...objective,
      id: `${objective.id}-${playerId}`,
    }

    selectedObjectives.value.set(gameId, [...current, playerObjective])
  }

  const removeObjective = (playerId: string, objectiveId: string) => {
    if (!game.value) return

    const gameId = game.value.id.toString()
    const current = selectedObjectives.value.get(gameId) || []

    const updated = current.filter((obj) => obj.id !== `${objectiveId}-${playerId}`)
    selectedObjectives.value.set(gameId, updated)
  }

  const getPlayerObjectives = (playerId: string): SecondaryObjective[] => {
    if (!game.value) return []

    const gameId = game.value.id.toString()
    const current = selectedObjectives.value.get(gameId) || []

    return current.filter((obj) => obj.id.includes(playerId))
  }

  const createCustomObjective = (
    playerId: string,
    name: string,
    description: string,
    maxPoints: number = 15
  ): SecondaryObjective => {
    const customId = `custom-${Date.now()}-${playerId}`

    return {
      id: customId,
      name,
      description,
      maxPoints,
      category: 'custom',
    }
  }

  const toggleSecondariesVisibility = () => {
    showSecondaries.value = !showSecondaries.value
  }

  // Validation des objectifs
  const validateObjectiveSelection = (playerId: string, objective: SecondaryObjective): boolean => {
    const playerObjectives = getPlayerObjectives(playerId)

    // Vérifier la limite
    if (playerObjectives.length >= 3) return false

    // Vérifier les doublons
    const baseId = objective.id.replace(`-${playerId}`, '')
    return !playerObjectives.some((obj) => obj.id.includes(baseId))
  }

  // Calcul des points totaux d'objectifs secondaires
  const calculateSecondaryPoints = (playerId: string): number => {
    const objectives = getPlayerObjectives(playerId)
    return objectives.reduce((total, obj) => total + obj.maxPoints, 0)
  }

  // Reset des objectifs pour un nouveau jeu
  const resetObjectives = (gameId: string) => {
    selectedObjectives.value.delete(gameId)
  }

  // Sauvegarde des objectifs (pour persistance)
  const serializeObjectives = (gameId: string) => {
    const objectives = selectedObjectives.value.get(gameId) || []
    return JSON.stringify(objectives)
  }

  const deserializeObjectives = (gameId: string, data: string) => {
    try {
      const objectives = JSON.parse(data) as SecondaryObjective[]
      selectedObjectives.value.set(gameId, objectives)
    } catch (error) {
      console.error('Erreur de désérialisation des objectifs:', error)
    }
  }

  return {
    // État
    showSecondaries,
    selectedObjectives: gameObjectives,

    // Données
    availableObjectives,
    allObjectives,
    predefinedObjectives,

    // Actions
    selectObjective,
    removeObjective,
    getPlayerObjectives,
    createCustomObjective,
    toggleSecondariesVisibility,

    // Validation
    validateObjectiveSelection,
    calculateSecondaryPoints,

    // Persistance
    resetObjectives,
    serializeObjectives,
    deserializeObjectives,
  }
}
