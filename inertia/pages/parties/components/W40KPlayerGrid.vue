<template>
  <div class="w40k-player-grid space-y-6">
    <!-- En-têtes des joueurs -->
    <div class="grid grid-cols-2 gap-6">
      <div
        v-for="(player, index) in players"
        :key="player.id"
        class="relative p-4 bg-gradient-to-br from-w40k-bg-secondary to-w40k-bg-elevated rounded-xl border border-w40k-border/30 shadow-lg"
      >
        <!-- Badge de joueur -->
        <div class="flex items-center gap-3 mb-4">
          <div
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
              index === 0
                ? 'bg-gradient-to-br from-w40k-red-400 to-w40k-red-600 text-white'
                : 'bg-gradient-to-br from-w40k-gold-400 to-w40k-gold-600 text-w40k-dark-900',
            ]"
          >
            {{ index + 1 }}
          </div>

          <div class="flex-1">
            <h3 class="font-bold text-w40k-text-primary">
              {{ player.pseudo }}
            </h3>

            <p v-if="player.isMainPlayer" class="text-xs text-w40k-text-muted">(Vous)</p>

            <p v-if="player.army" class="text-sm text-w40k-gold-400 font-medium">
              {{ player.army }}
            </p>
          </div>

          <!-- Score total avec animation -->
          <div class="text-right">
            <div
              :class="[
                'text-2xl font-black transition-all duration-300',
                getPlayerTotalScore(player) > 50 ? 'text-w40k-gold-400' : 'text-w40k-text-primary',
              ]"
            >
              {{ getPlayerTotalScore(player) }}
            </div>
            <p class="text-xs text-w40k-text-muted">Points totaux</p>
          </div>
        </div>

        <!-- Breakdown des scores -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span class="text-w40k-text-secondary">Primaires:</span>
            <span class="font-medium text-blue-300">{{ getPrimaryScore(player) }}</span>
          </div>

          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
            <span class="text-w40k-text-secondary">Secondaires:</span>
            <span class="font-medium text-green-300">{{ getSecondaryScore(player) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau des scores du round actuel -->
    <div
      class="w40k-score-grid bg-w40k-bg-card rounded-xl border border-w40k-border/30 overflow-hidden shadow-lg"
    >
      <div class="p-6">
        <h3 class="text-lg font-bold text-w40k-text-primary mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-w40k-gold-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Scores Round {{ currentRound }}
        </h3>

        <!-- Grid des scores éditables -->
        <div class="space-y-4">
          <!-- Scores primaires -->
          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="(player, playerIndex) in players"
              :key="`primary-${player.id}`"
              class="space-y-2"
            >
              <label class="text-sm font-medium text-w40k-text-secondary">
                {{ player.pseudo }} - Score primaire
              </label>

              <W40KScoreCell
                :player-id="player.id"
                :round-id="currentRound"
                :score-type="'primary'"
                :value="getPrimaryScoreForRound(player, currentRound)"
                :editable="editable"
                :class="playerIndex === 0 ? 'border-w40k-red-500/50' : 'border-w40k-gold-500/50'"
                @score-update="handleScoreUpdate"
              />
            </div>
          </div>

          <!-- Séparateur décoratif -->
          <div class="flex items-center gap-4 py-2">
            <div
              class="flex-1 h-px bg-gradient-to-r from-transparent via-w40k-border to-transparent"
            ></div>
            <span class="text-xs text-w40k-text-muted font-medium">OBJECTIFS SECONDAIRES</span>
            <div
              class="flex-1 h-px bg-gradient-to-r from-transparent via-w40k-border to-transparent"
            ></div>
          </div>

          <!-- Scores secondaires -->
          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="(player, playerIndex) in players"
              :key="`secondary-${player.id}`"
              class="space-y-2"
            >
              <label class="text-sm font-medium text-w40k-text-secondary">
                {{ player.pseudo }} - Secondaires
              </label>

              <div class="grid grid-cols-3 gap-2">
                <W40KScoreCell
                  v-for="secondaryIndex in 3"
                  :key="`secondary-${player.id}-${secondaryIndex}`"
                  :player-id="player.id"
                  :round-id="currentRound"
                  :score-type="`secondary-${secondaryIndex}`"
                  :value="getSecondaryScoreForRound(player, currentRound, secondaryIndex)"
                  :editable="editable"
                  :max-value="15"
                  :class="playerIndex === 0 ? 'border-w40k-red-500/30' : 'border-w40k-gold-500/30'"
                  @score-update="handleScoreUpdate"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions rapides -->
    <div v-if="editable && hasChanges" class="flex justify-center">
      <div
        class="flex items-center gap-3 bg-w40k-bg-elevated rounded-lg p-4 border border-w40k-border/30"
      >
        <div class="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        <span class="text-sm text-w40k-text-secondary">Modifications non sauvegardées</span>

        <button
          @click="$emit('save-scores')"
          :disabled="saving"
          class="btn-w40k-primary text-xs px-3 py-1"
        >
          {{ saving ? 'Sauvegarde...' : 'Sauvegarder' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerDto, ScoreUpdateEvent } from '../types'
import W40KScoreCell from './W40KScoreCell.vue'

interface Props {
  players: PlayerDto[]
  currentRound: number
  editable: boolean
  hasChanges?: boolean
  saving?: boolean
}

interface Emits {
  (e: 'score-update', event: ScoreUpdateEvent): void
  (e: 'save-scores'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Calculs des scores
const getPlayerTotalScore = (player: PlayerDto): number => {
  return player.totalScore || 0
}

const getPrimaryScore = (player: PlayerDto): number => {
  // Logique pour calculer le score primaire total
  // À adapter selon la structure des données
  return Math.floor(getPlayerTotalScore(player) * 0.7) // Exemple
}

const getSecondaryScore = (player: PlayerDto): number => {
  // Logique pour calculer le score secondaire total
  // À adapter selon la structure des données
  return Math.floor(getPlayerTotalScore(player) * 0.3) // Exemple
}

const getPrimaryScoreForRound = (player: PlayerDto, round: number): number => {
  // Logique pour obtenir le score primaire d'un round spécifique
  // À adapter selon la structure des données
  return 0
}

const getSecondaryScoreForRound = (
  player: PlayerDto,
  round: number,
  objectiveIndex: number
): number => {
  // Logique pour obtenir le score secondaire d'un round et objectif spécifique
  // À adapter selon la structure des données
  return 0
}

// Gestionnaire d'événements
const handleScoreUpdate = (event: ScoreUpdateEvent) => {
  emit('score-update', event)
}
</script>

<style scoped>
.w40k-player-grid {
  /* Animation d'entrée */
  animation: fadeInUp 0.6s ease-out;
}

.w40k-score-grid {
  /* Effet de glow subtil */
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(220, 38, 38, 0.1);
}

/* Animation des scores qui changent */
.score-changing {
  transform: scale(1.05);
  transition: transform 0.2s ease-out;
}

/* Responsive design pour mobile */
@media (max-width: 768px) {
  .w40k-player-grid .grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .w40k-score-grid .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

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
</style>
