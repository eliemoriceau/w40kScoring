<script setup lang="ts">
import { computed } from 'vue'
import type { PartieUI } from '../types'
import { usePartiesHelpers } from '../composables/usePartiesHelpers'

interface Props {
  partie: PartieUI
}

interface Emits {
  (e: 'view-details', partieId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { formatRelativeDate, getScoreStats, getGameTypeIcon } = usePartiesHelpers()

const scoreStats = computed(() => getScoreStats(props.partie))

const statusStyles = computed(() => {
  const baseStyles = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium'

  switch (props.partie.statusColor) {
    case 'blue':
      return `${baseStyles} bg-blue-600/20 text-blue-300 border border-blue-500/30`
    case 'green':
      return `${baseStyles} bg-green-600/20 text-green-300 border border-green-500/30`
    case 'red':
      return `${baseStyles} bg-red-600/20 text-red-300 border border-red-500/30`
    default:
      return `${baseStyles} bg-gray-600/20 text-gray-300 border border-gray-500/30`
  }
})

const gameTypeStyles = computed(() => {
  const baseStyles = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium'

  switch (props.partie.gameType) {
    case 'MATCHED_PLAY':
      return `${baseStyles} bg-purple-600/20 text-purple-300`
    case 'NARRATIVE':
      return `${baseStyles} bg-yellow-600/20 text-yellow-300`
    case 'OPEN_PLAY':
      return `${baseStyles} bg-green-600/20 text-green-300`
    default:
      return `${baseStyles} bg-gray-600/20 text-gray-300`
  }
})

const handleViewDetails = () => {
  emit('view-details', props.partie.id)
}

const formatScore = (score?: number) => {
  return score?.toLocaleString() || '0'
}
</script>

<template>
  <article
    class="partie-card bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 cursor-pointer group"
    @click="handleViewDetails"
  >
    <!-- Header avec status et type -->
    <header class="p-4 border-b border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-2">
          <span :class="statusStyles">
            {{ partie.statusLabel }}
          </span>
          <span :class="gameTypeStyles">
            <span class="mr-1">{{ getGameTypeIcon(partie.gameType) }}</span>
            {{ partie.gameTypeLabel }}
          </span>
        </div>

        <div class="text-xs text-gray-400">
          {{ formatRelativeDate(partie.createdAt) }}
        </div>
      </div>

      <h3 class="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors">
        {{ partie.mission || `Partie ${partie.gameTypeLabel}` }}
      </h3>
    </header>

    <!-- Contenu principal -->
    <div class="p-4 space-y-4">
      <!-- Informations de base -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-400">Points :</span>
          <span class="text-white ml-2 font-medium">{{ partie.pointsLimit.toLocaleString() }}</span>
        </div>
        <div>
          <span class="text-gray-400">Joueurs :</span>
          <span class="text-white ml-2">{{ partie.playersText }}</span>
        </div>
      </div>

      <!-- Scores (si disponibles) -->
      <div
        v-if="partie.playerScore !== undefined || partie.opponentScore !== undefined"
        class="space-y-2"
      >
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">Score</span>
          <div class="flex items-center space-x-2">
            <span
              :class="[
                'font-bold',
                scoreStats.winner === 'player'
                  ? 'text-green-400'
                  : scoreStats.winner === 'opponent'
                    ? 'text-red-400'
                    : 'text-yellow-400',
              ]"
            >
              {{ formatScore(partie.playerScore) }}
            </span>
            <span class="text-gray-500">-</span>
            <span
              :class="[
                'font-bold',
                scoreStats.winner === 'opponent'
                  ? 'text-green-400'
                  : scoreStats.winner === 'player'
                    ? 'text-red-400'
                    : 'text-yellow-400',
              ]"
            >
              {{ formatScore(partie.opponentScore) }}
            </span>
          </div>
        </div>

        <!-- Barre de progression du score -->
        <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
            :style="{ width: `${scoreStats.playerPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Durée (si la partie est commencée) -->
      <div v-if="partie.duration" class="text-sm">
        <span class="text-gray-400">Durée :</span>
        <span class="text-white ml-2">{{ partie.duration }}</span>
      </div>

      <!-- Notes (aperçu) -->
      <div v-if="partie.notes" class="text-sm">
        <p class="text-gray-300 line-clamp-2">
          {{ partie.notes }}
        </p>
      </div>
    </div>

    <!-- Footer avec actions -->
    <footer class="p-4 border-t border-gray-700 bg-gray-900/30">
      <div class="flex items-center justify-between">
        <!-- Dates importantes -->
        <div class="text-xs text-gray-400">
          <div v-if="partie.startedAt && partie.status === 'IN_PROGRESS'">
            Commencée {{ formatRelativeDate(partie.startedAt) }}
          </div>
          <div v-else-if="partie.completedAt">
            Terminée {{ formatRelativeDate(partie.completedAt) }}
          </div>
          <div v-else>Créée {{ formatRelativeDate(partie.createdAt) }}</div>
        </div>

        <!-- Actions -->
        <div class="flex items-center space-x-2">
          <!-- Badge métadonnées -->
          <div v-if="partie.metadata?.winner" class="flex items-center">
            <span
              :class="[
                'text-xs px-2 py-1 rounded font-medium',
                partie.metadata.winner === 'PLAYER'
                  ? 'bg-green-600/20 text-green-300'
                  : partie.metadata.winner === 'OPPONENT'
                    ? 'bg-red-600/20 text-red-300'
                    : 'bg-yellow-600/20 text-yellow-300',
              ]"
            >
              {{
                partie.metadata.winner === 'PLAYER'
                  ? '🏆 Victoire'
                  : partie.metadata.winner === 'OPPONENT'
                    ? '💀 Défaite'
                    : '🤝 Égalité'
              }}
            </span>
          </div>

          <!-- Bouton principal -->
          <button
            @click.stop="handleViewDetails"
            class="inline-flex items-center px-3 py-1 text-sm font-medium text-yellow-400 hover:text-yellow-300 border border-yellow-500/30 hover:border-yellow-500 rounded transition-colors group-hover:bg-yellow-500/10"
          >
            {{ partie.canContinue ? 'Continuer' : 'Voir détails' }}
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.partie-card {
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.partie-card:hover {
  transform: translateY(-4px);
}

/* Ligne clamp pour les notes */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Animation pour la barre de score */
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to));
}

/* Hover effect pour les actions */
.partie-card:hover .group-hover\:bg-yellow-500\/10 {
  background-color: rgb(234 179 8 / 0.1);
}
</style>
