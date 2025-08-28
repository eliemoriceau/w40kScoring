<template>
  <Teleport to="body">
    <Transition
      name="modal"
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        @click.self="onClose"
      >
        <div
          class="relative bg-slate-800 border-2 border-red-800/50 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          @click.stop
        >
          <!-- Header avec thème W40K -->
          <div class="bg-gradient-to-r from-slate-900 to-slate-800 p-6 border-b border-red-800/30">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center"
                >
                  <svg
                    class="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-red-300">🎯 Objectifs Secondaires</h2>
                  <p class="text-sm text-slate-400">{{ playerName }} • Round {{ roundNumber }}</p>
                </div>
              </div>

              <button
                @click="onClose"
                class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-red-600 text-slate-400 hover:text-white transition-all duration-200"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content scrollable -->
          <div class="overflow-y-auto max-h-[60vh] p-6">
            <!-- Filtres et recherche -->
            <div class="mb-6 space-y-4">
              <!-- Recherche -->
              <div class="relative">
                <input
                  v-model="state.searchFilter"
                  type="text"
                  placeholder="Rechercher un objectif..."
                  class="w-full px-4 py-2 pl-10 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <svg
                  class="absolute left-3 top-2.5 w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <!-- Filtres par catégorie -->
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="category in categories"
                  :key="category.id"
                  @click="state.activeCategory = category.id"
                  :class="[
                    'px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200',
                    state.activeCategory === category.id
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
                  ]"
                >
                  {{ category.label }}
                </button>
              </div>
            </div>

            <!-- Objectifs prédéfinis -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Objectifs Disponibles
              </h3>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <button
                  v-for="objective in filteredObjectives"
                  :key="objective.id"
                  @click="selectObjective(objective)"
                  :disabled="isObjectiveSelected(objective.id)"
                  :class="[
                    'p-3 rounded-lg border-2 text-left transition-all duration-200',
                    isObjectiveSelected(objective.id)
                      ? 'border-green-500 bg-green-900/20 text-green-300'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-red-500 hover:bg-slate-700',
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="font-medium text-sm">{{ objective.name }}</div>
                      <div class="text-xs text-slate-400 mt-1">{{ objective.description }}</div>
                    </div>
                    <div class="ml-3 text-xs font-medium px-2 py-1 rounded bg-red-600 text-white">
                      {{ objective.maxPoints }} pts
                    </div>
                  </div>
                  <div
                    v-if="isObjectiveSelected(objective.id)"
                    class="mt-2 flex items-center gap-2"
                  >
                    <span class="text-xs text-green-400">✓ Sélectionné</span>
                    <div class="flex items-center gap-1">
                      <span class="text-xs text-slate-400">Score:</span>
                      <input
                        :value="getSelectedObjectiveScore(objective.id)"
                        @input="
                          updateObjectiveScore(
                            objective.id,
                            ($event.target as HTMLInputElement).value
                          )
                        "
                        @click.stop
                        type="number"
                        min="0"
                        :max="objective.maxPoints"
                        class="w-12 px-1 py-0.5 text-xs bg-slate-600 border border-slate-500 rounded text-center text-white"
                      />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Objectif personnalisé -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Objectif Personnalisé
              </h3>

              <div class="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div class="lg:col-span-2">
                    <label class="block text-sm font-medium text-slate-300 mb-2"
                      >Nom de l'objectif</label
                    >
                    <input
                      v-model="state.customObjectiveName"
                      type="text"
                      placeholder="Nom de votre objectif personnalisé..."
                      class="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      maxlength="50"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-300 mb-2"
                      >Score (0-15)</label
                    >
                    <div class="flex gap-2">
                      <input
                        v-model.number="state.customObjectiveScore"
                        type="number"
                        min="0"
                        max="15"
                        class="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded text-center text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <button
                        @click="addCustomObjective"
                        :disabled="!canAddCustomObjective"
                        :class="[
                          'px-4 py-2 rounded font-medium transition-all duration-200',
                          canAddCustomObjective
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-slate-600 text-slate-400 cursor-not-allowed',
                        ]"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Objectifs sélectionnés -->
            <div v-if="state.selectedObjectives.length > 0" class="mb-6">
              <h3 class="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Objectifs Sélectionnés ({{ state.selectedObjectives.length }})
              </h3>

              <div class="space-y-2">
                <div
                  v-for="selected in state.selectedObjectives"
                  :key="selected.id"
                  class="flex items-center justify-between p-3 bg-green-900/20 border border-green-600/50 rounded-lg"
                >
                  <div class="flex-1">
                    <div class="font-medium text-green-300">{{ selected.name }}</div>
                    <div class="text-xs text-slate-400">
                      {{ selected.score }} / {{ selected.maxPoints }} points
                    </div>
                  </div>
                  <button
                    @click="removeSelectedObjective(selected.id)"
                    class="w-6 h-6 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white transition-all duration-200"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="text-right text-sm text-slate-400 mt-2">
                Total: {{ totalSelectedScore }} points
              </div>
            </div>
          </div>

          <!-- Footer actions -->
          <div class="bg-slate-900 border-t border-red-800/30 p-6 flex justify-end gap-3">
            <button
              @click="onClose"
              class="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-all duration-200"
            >
              Annuler
            </button>
            <button
              @click="saveSelection"
              :disabled="state.isSaving || state.selectedObjectives.length === 0"
              :class="[
                'px-6 py-2 rounded-lg font-medium transition-all duration-200',
                state.isSaving || state.selectedObjectives.length === 0
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-500 text-white',
              ]"
            >
              {{
                state.isSaving
                  ? 'Sauvegarde...'
                  : `Sauvegarder (${state.selectedObjectives.length})`
              }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type {
  SecondarySelectionModalProps,
  SecondarySelectionModalState,
  SecondaryObjective,
  SelectedSecondaryScore,
  PredefinedSecondaryObjectives,
} from '../types'

const props = defineProps<SecondarySelectionModalProps>()

// État réactif de la modal
const state = reactive<SecondarySelectionModalState>({
  selectedObjectives: [],
  customObjectiveName: '',
  customObjectiveScore: 0,
  searchFilter: '',
  activeCategory: 'all',
  isSaving: false,
  validationErrors: {},
})

// Catégories disponibles
const categories = [
  { id: 'all', label: '🎯 Tous' },
  { id: 'tactical', label: '⚡ Tactiques' },
  { id: 'strategic', label: '🧠 Stratégiques' },
  { id: 'warden', label: '🛡️ Gardiens' },
] as const

// Objectifs prédéfinis W40K
const predefinedObjectives: PredefinedSecondaryObjectives = {
  tactical: [
    {
      id: 'engage-on-all-fronts',
      name: 'Engagement Sur Tous Les Fronts',
      description: 'Avoir des unités dans 3+ quadrants du champ de bataille',
      maxPoints: 15,
      category: 'tactical',
    },
    {
      id: 'linebreaker',
      name: 'Briseur de Ligne',
      description: 'Avoir des unités dans la zone de déploiement ennemie',
      maxPoints: 15,
      category: 'tactical',
    },
    {
      id: 'behind-enemy-lines',
      name: 'Derrière les Lignes Ennemies',
      description: 'Déployer des unités dans le territoire ennemi',
      maxPoints: 15,
      category: 'tactical',
    },
    {
      id: 'teleport-homer',
      name: 'Balise de Téléportation',
      description: 'Déployer des unités via téléportation stratégique',
      maxPoints: 15,
      category: 'tactical',
    },
  ],
  strategic: [
    {
      id: 'raise-the-banners',
      name: 'Hisser les Bannières',
      description: 'Contrôler des objectifs avec des bannières',
      maxPoints: 15,
      category: 'strategic',
    },
    {
      id: 'investigate-sites',
      name: 'Enquêter Sur Les Sites',
      description: 'Explorer et sécuriser des zones spécifiques',
      maxPoints: 15,
      category: 'strategic',
    },
    {
      id: 'priority-targets',
      name: 'Cibles Prioritaires',
      description: 'Éliminer des unités ennemies spécifiques',
      maxPoints: 15,
      category: 'strategic',
    },
    {
      id: 'domination',
      name: 'Domination',
      description: "Contrôler plus d'objectifs que l'adversaire",
      maxPoints: 15,
      category: 'strategic',
    },
  ],
  warden: [
    {
      id: 'defend-stronghold',
      name: 'Défendre la Forteresse',
      description: 'Maintenir le contrôle de votre zone de déploiement',
      maxPoints: 15,
      category: 'warden',
    },
    {
      id: 'hold-the-line',
      name: 'Tenir la Ligne',
      description: "Empêcher l'ennemi de pénétrer vos défenses",
      maxPoints: 15,
      category: 'warden',
    },
    {
      id: 'calculated-retreat',
      name: 'Retraite Calculée',
      description: 'Préserver vos unités tout en accomplissant la mission',
      maxPoints: 15,
      category: 'warden',
    },
  ],
}

// Objectifs filtrés selon la recherche et la catégorie
const filteredObjectives = computed(() => {
  let objectives: SecondaryObjective[] = []

  if (state.activeCategory === 'all') {
    objectives = [
      ...predefinedObjectives.tactical,
      ...predefinedObjectives.strategic,
      ...predefinedObjectives.warden,
    ]
  } else {
    objectives = predefinedObjectives[state.activeCategory] || []
  }

  if (state.searchFilter.trim()) {
    const filter = state.searchFilter.toLowerCase()
    objectives = objectives.filter(
      (obj) =>
        obj.name.toLowerCase().includes(filter) || obj.description.toLowerCase().includes(filter)
    )
  }

  return objectives
})

// Score total sélectionné
const totalSelectedScore = computed(() => {
  return state.selectedObjectives.reduce((total, obj) => total + obj.score, 0)
})

// Peut ajouter un objectif personnalisé
const canAddCustomObjective = computed(() => {
  return (
    state.customObjectiveName.trim().length > 0 &&
    state.customObjectiveScore >= 0 &&
    state.customObjectiveScore <= 15
  )
})

// Vérifier si un objectif est sélectionné
const isObjectiveSelected = (objectiveId: string): boolean => {
  return state.selectedObjectives.some((obj) => obj.objectiveId === objectiveId)
}

// Obtenir le score d'un objectif sélectionné
const getSelectedObjectiveScore = (objectiveId: string): number => {
  const selected = state.selectedObjectives.find((obj) => obj.objectiveId === objectiveId)
  return selected?.score || 0
}

// Sélectionner un objectif prédéfini
const selectObjective = (objective: SecondaryObjective) => {
  if (isObjectiveSelected(objective.id)) return

  const selectedScore: SelectedSecondaryScore = {
    id: crypto.randomUUID(),
    objectiveId: objective.id,
    name: objective.name,
    score: 0,
    maxPoints: objective.maxPoints,
  }

  state.selectedObjectives.push(selectedScore)
}

// Mettre à jour le score d'un objectif
const updateObjectiveScore = (objectiveId: string, newScore: string) => {
  const score = parseInt(newScore) || 0
  const selected = state.selectedObjectives.find((obj) => obj.objectiveId === objectiveId)
  if (selected && score >= 0 && score <= selected.maxPoints) {
    selected.score = score
  }
}

// Ajouter un objectif personnalisé
const addCustomObjective = () => {
  if (!canAddCustomObjective.value) return

  const customObjective: SelectedSecondaryScore = {
    id: crypto.randomUUID(),
    objectiveId: `custom-${Date.now()}`,
    name: state.customObjectiveName.trim(),
    score: state.customObjectiveScore,
    maxPoints: 15,
  }

  state.selectedObjectives.push(customObjective)
  state.customObjectiveName = ''
  state.customObjectiveScore = 0
}

// Supprimer un objectif sélectionné
const removeSelectedObjective = (selectedId: string) => {
  const index = state.selectedObjectives.findIndex((obj) => obj.id === selectedId)
  if (index !== -1) {
    state.selectedObjectives.splice(index, 1)
  }
}

// Sauvegarder la sélection
const saveSelection = async () => {
  if (state.selectedObjectives.length === 0) return

  state.isSaving = true
  try {
    props.onSave(state.selectedObjectives)
  } finally {
    state.isSaving = false
  }
}

// Initialiser avec les scores existants
watch(
  () => props.existingScores,
  (newScores) => {
    if (newScores?.length > 0) {
      state.selectedObjectives = newScores.map((score) => ({
        id: crypto.randomUUID(),
        objectiveId: `existing-${score.id}`,
        name: score.scoreName,
        score: score.scoreValue,
        maxPoints: 15,
      }))
    }
  },
  { immediate: true }
)

// Réinitialiser l'état quand la modal se ferme
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      setTimeout(() => {
        state.selectedObjectives = []
        state.customObjectiveName = ''
        state.customObjectiveScore = 0
        state.searchFilter = ''
        state.activeCategory = 'all'
        state.isSaving = false
        state.validationErrors = {}
      }, 300)
    }
  }
)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
