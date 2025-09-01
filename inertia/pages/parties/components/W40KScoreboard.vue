<template>
  <div class="w40k-scoreboard space-y-6 animate-in slide-in-from-bottom-4 duration-500">
    <!-- En-tête du jeu -->
    <W40KGameHeader :game="game" :current-round="currentRound" @round-change="handleRoundChange" />

    <!-- Grille des joueurs et scores -->
    <W40KPlayerGrid
      :players="game?.players || []"
      :current-round="currentRound"
      :editable="canEdit"
      :has-changes="hasChanges"
      :saving="isSaving"
      @score-update="handleScoreUpdate"
      @save-scores="saveScores"
    />

    <!-- Objectifs secondaires (optionnel) -->
    <div v-if="showSecondaries" class="w40k-secondary-objectives">
      <div class="bg-w40k-bg-card border border-w40k-border/30 rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-w40k-text-primary flex items-center gap-2">
            <svg class="w-5 h-5 text-w40k-gold-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Objectifs Secondaires
          </h3>

          <button
            @click="toggleSecondariesVisibility"
            class="text-sm text-w40k-text-secondary hover:text-w40k-text-primary transition-colors duration-200"
          >
            Masquer
          </button>
        </div>

        <!-- Liste des objectifs par joueur -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div v-for="player in game?.players" :key="player.id" class="space-y-3">
            <h4 class="font-semibold text-w40k-text-primary">
              {{ player.pseudo }}
            </h4>

            <div class="space-y-2">
              <div
                v-for="objective in getPlayerObjectives(player.id.toString())"
                :key="objective.id"
                class="flex items-center justify-between p-3 bg-w40k-bg-elevated rounded-lg border border-w40k-border/20"
              >
                <div class="flex-1">
                  <div class="font-medium text-sm text-w40k-text-primary">
                    {{ objective.name }}
                  </div>
                  <div class="text-xs text-w40k-text-muted">
                    {{ objective.description }}
                  </div>
                </div>

                <div class="flex items-center gap-2 ml-3">
                  <span class="text-xs text-w40k-text-secondary">
                    Max: {{ objective.maxPoints }}
                  </span>

                  <button
                    @click="removeObjective(player.id.toString(), objective.id)"
                    class="text-red-400 hover:text-red-300 transition-colors duration-200"
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

              <!-- Bouton d'ajout d'objectif -->
              <button
                @click="openObjectiveModal(player.id.toString())"
                :disabled="getPlayerObjectives(player.id.toString()).length >= 3"
                class="w-full p-3 border-2 border-dashed border-w40k-border hover:border-w40k-gold-500/50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div
                  class="flex items-center justify-center gap-2 text-sm text-w40k-text-secondary"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>
                    {{
                      getPlayerObjectives(player.id.toString()).length >= 3
                        ? 'Limite atteinte'
                        : 'Ajouter objectif'
                    }}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions de sauvegarde -->
    <W40KScoreActions
      :can-save="hasChanges"
      :saving="isSaving"
      :auto-saving="false"
      :last-saved="lastSaveTime"
      @save="saveScores"
      @reset="resetChanges"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GameDetailDto } from '../types'
import { useW40KScoring } from '../composables/use_w40k_scoring'
import { useW40KSecondaryObjectives } from '../composables/useW40KSecondaryObjectives'
import W40KGameHeader from './W40KGameHeader.vue'
import W40KPlayerGrid from './W40KPlayerGrid.vue'
import W40KScoreActions from './W40KScoreActions.vue'

interface Props {
  gameId: string
  initialGame: GameDetailDto
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
})

// Composables principaux
const {
  game,
  currentRound,
  hasChanges,
  isSaving,
  lastSaveTime,
  handleRoundChange,
  handleScoreUpdate,
  saveScores,
  resetChanges,
} = useW40KScoring(props.gameId, props.initialGame)

const { showSecondaries, getPlayerObjectives, removeObjective, toggleSecondariesVisibility } =
  useW40KSecondaryObjectives(game)

// État local
const objectiveModalVisible = ref(false)
const selectedPlayerId = ref<string>('')

// Computed properties
const canEdit = computed(() => props.canEdit && game.value?.canEdit !== false)

// Actions
const openObjectiveModal = (playerId: string) => {
  selectedPlayerId.value = playerId
  objectiveModalVisible.value = true
}

const closeObjectiveModal = () => {
  objectiveModalVisible.value = false
  selectedPlayerId.value = ''
}

// Débogage en développement
if (import.meta.env.DEV) {
  // Exposition des données pour debugging
  Object.assign(window, {
    w40kScoring: {
      game,
      currentRound,
      hasChanges,
      isSaving,
    },
  })
}
</script>

<style scoped>
.w40k-scoreboard {
  /* Variables CSS personnalisées */
  --w40k-transition: all 0.2s ease-out;
  --w40k-shadow-color: rgba(220, 38, 38, 0.1);

  /* Animation d'entrée fluide */
  animation: fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

/* Container principal avec scroll optimisé */
.w40k-scoreboard {
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* Amélioration du scrolling sur mobile */
.w40k-scoreboard::-webkit-scrollbar {
  width: 6px;
}

.w40k-scoreboard::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 3px;
}

.w40k-scoreboard::-webkit-scrollbar-thumb {
  background: #dc2626;
  border-radius: 3px;
}

.w40k-scoreboard::-webkit-scrollbar-thumb:hover {
  background: #b91c1c;
}

/* Animation des sections */
.w40k-secondary-objectives {
  animation: slideInLeft 0.4s ease-out 0.3s both;
}

/* Responsive design */
@media (max-width: 768px) {
  .w40k-scoreboard {
    padding: 0.5rem;
  }

  .w40k-scoreboard .space-y-6 > * + * {
    margin-top: 1rem;
  }
}

/* Animations keyframes */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* États de performance */
.performance-mode .w40k-scoreboard {
  /* Désactiver les animations en mode performance */
  animation: none;
  transition: none;
}

.performance-mode .w40k-secondary-objectives {
  animation: none;
}
</style>
