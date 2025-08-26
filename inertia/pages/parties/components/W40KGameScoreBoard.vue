<template>
  <div class="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
    <!-- En-tête avec résumé des scores - Design W40K Epic -->
    <div
      class="relative bg-gradient-to-br from-w40k-bg-secondary to-w40k-bg-elevated border-2 border-w40k-red-500/50 rounded-xl p-6 shadow-w40k-xl overflow-hidden"
    >
      <!-- Effet de fond animé -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-w40k-red-900/20 via-transparent to-w40k-gold-900/20 opacity-30"
      />

      <div class="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <!-- Joueur 1 -->
        <div class="text-center md:text-left space-y-4">
          <div class="space-y-2">
            <h3
              class="text-lg font-bold text-w40k-red-300 flex items-center justify-center md:justify-start gap-2"
            >
              <span class="w-3 h-3 bg-w40k-red-500 rounded-full animate-pulse" />
              {{ players[0]?.pseudo || 'Joueur 1' }}
              <span v-if="players[0]?.isMainPlayer" class="text-sm text-w40k-text-muted font-normal"
                >(Vous)</span
              >
            </h3>

            <!-- Score total avec effet brillant -->
            <div class="relative">
              <div
                class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-w40k-red-400 to-w40k-gold-400 drop-shadow-lg"
              >
                {{ getPlayerTotalScore(players[0]) }}
              </div>
              <div
                v-if="getPlayerTotalScore(players[0]) > 30"
                class="absolute inset-0 bg-gradient-to-r from-w40k-gold-400/20 to-w40k-red-400/20 blur-xl animate-pulse"
              />
            </div>

            <!-- Breakdown des scores -->
            <div class="flex flex-col gap-1 text-sm">
              <div class="flex items-center justify-center md:justify-start gap-2">
                <div class="w-2 h-2 bg-blue-400 rounded-full" />
                <span class="text-blue-300 font-medium"
                  >Primaires: {{ getPrimaryScore(players[0]) }}</span
                >
              </div>
              <div class="flex items-center justify-center md:justify-start gap-2">
                <div class="w-2 h-2 bg-green-400 rounded-full" />
                <span class="text-green-300 font-medium"
                  >Secondaires: {{ getSecondaryScore(players[0]) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Section VS et statut - Design W40K -->
        <div class="text-center space-y-4">
          <div class="relative">
            <div
              class="text-3xl font-black text-w40k-text-subtle bg-w40k-bg-primary px-6 py-3 rounded-full border-2 border-w40k-text-subtle/30 shadow-inner"
            >
              VS
            </div>
            <div
              class="absolute -inset-1 bg-gradient-to-r from-w40k-red-500/20 via-w40k-gold-500/20 to-w40k-red-500/20 rounded-full blur animate-pulse"
            />
          </div>

          <!-- Statut de partie avec badges -->
          <div class="flex justify-center">
            <span :class="gameStatusClasses">{{ gameStatusText }}</span>
          </div>

          <!-- Annonce du gagnant avec effet spectaculaire -->
          <div v-if="game.winner" class="animate-in zoom-in-50 duration-700">
            <div class="relative">
              <span :class="winnerClasses">{{ getWinnerText() }}</span>
              <div
                v-if="isMainPlayerWinner"
                class="absolute -inset-2 bg-gradient-to-r from-green-500/30 to-green-400/30 rounded-lg blur-sm animate-pulse"
              />
            </div>
          </div>
        </div>

        <!-- Joueur 2 -->
        <div v-if="players[1]" class="text-center md:text-right space-y-4">
          <div class="space-y-2">
            <h3
              class="text-lg font-bold text-w40k-red-300 flex items-center justify-center md:justify-end gap-2"
            >
              <span class="w-3 h-3 bg-w40k-red-500 rounded-full animate-pulse" />
              {{ players[1].pseudo }}
              <span v-if="players[1].isMainPlayer" class="text-sm text-w40k-text-muted font-normal"
                >(Vous)</span
              >
            </h3>

            <div class="relative">
              <div
                class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-w40k-red-400 to-w40k-gold-400 drop-shadow-lg"
              >
                {{ getPlayerTotalScore(players[1]) }}
              </div>
              <div
                v-if="getPlayerTotalScore(players[1]) > 30"
                class="absolute inset-0 bg-gradient-to-l from-w40k-gold-400/20 to-w40k-red-400/20 blur-xl animate-pulse"
              />
            </div>

            <div class="flex flex-col gap-1 text-sm">
              <div class="flex items-center justify-center md:justify-end gap-2">
                <div class="w-2 h-2 bg-blue-400 rounded-full" />
                <span class="text-blue-300 font-medium"
                  >Primaires: {{ getPrimaryScore(players[1]) }}</span
                >
              </div>
              <div class="flex items-center justify-center md:justify-end gap-2">
                <div class="w-2 h-2 bg-green-400 rounded-full" />
                <span class="text-green-300 font-medium"
                  >Secondaires: {{ getSecondaryScore(players[1]) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <div class="inline-flex items-center gap-2 text-w40k-text-muted animate-pulse">
            <div class="w-2 h-2 bg-w40k-text-muted rounded-full animate-bounce" />
            <span>En attente d'adversaire</span>
            <div
              class="w-2 h-2 bg-w40k-text-muted rounded-full animate-bounce"
              style="animation-delay: 0.2s"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Grille des rounds avec design W40K -->
    <div
      class="bg-gradient-to-br from-w40k-bg-secondary to-w40k-bg-elevated border-2 border-w40k-red-500/50 rounded-xl p-6 shadow-w40k-lg"
    >
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h3
          class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-w40k-red-300 to-w40k-gold-400"
        >
          ⚔️ Scores par Round
        </h3>

        <!-- Légende avec design W40K -->
        <div class="flex flex-wrap gap-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span class="text-green-300 font-medium">✅ Terminé</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
            <span class="text-orange-300 font-medium">🎯 En cours</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-gray-500 rounded-full" />
            <span class="text-w40k-text-muted font-medium">📋 À venir</span>
          </div>
        </div>
      </div>

      <!-- Liste des rounds -->
      <div class="space-y-4">
        <W40KRoundRow
          v-for="round in localRounds"
          :key="round.id"
          :round="round"
          :players="players"
          :game-id="game.id"
          :can-edit="canEdit"
          :current-round="getCurrentRound()"
          :allow-edit-completed="false"
          @score-updated="handleScoreUpdate"
          @round-completed="handleRoundCompleted"
        />
      </div>

      <!-- Message si aucun round -->
      <div v-if="localRounds.length === 0" class="py-16 text-center">
        <div class="space-y-4">
          <div
            class="w-16 h-16 mx-auto bg-gradient-to-br from-w40k-red-500/20 to-w40k-gold-500/20 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-8 h-8 text-w40k-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div class="space-y-2">
            <p class="text-w40k-text-muted text-lg">Aucun round créé pour cette partie</p>
            <p class="text-sm text-w40k-text-subtle">
              Les rounds seront automatiquement créés lors du démarrage
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Scores secondaires -->
    <div class="animate-in slide-in-from-bottom-2 duration-700 delay-200">
      <W40KSecondaryScores
        :players="players"
        :secondary-scores="secondaryScores"
        :rounds="localRounds"
        :can-edit="canEdit"
        @secondary-score-updated="handleSecondaryScoreUpdate"
      />
    </div>

    <!-- Indicateurs de progression W40K -->
    <div
      v-if="showProgressIndicators"
      class="bg-gradient-to-br from-w40k-bg-secondary to-w40k-bg-elevated border-2 border-w40k-red-500/30 rounded-xl p-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-w40k-red-500 rounded-full animate-pulse" />
            <span class="text-sm font-medium text-w40k-text-secondary">Rounds terminés</span>
          </div>

          <div class="relative w-full bg-w40k-bg-primary rounded-full h-3 overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-w40k-red-500 to-w40k-gold-500 rounded-full transition-all duration-500 ease-out relative"
              :style="{ width: `${getCompletionPercentage()}%` }"
            >
              <div
                class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"
              />
            </div>
          </div>

          <span class="text-xs text-w40k-text-muted"
            >{{ getCompletedRounds() }}/{{ localRounds.length }}</span
          >
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-w40k-gold-500 rounded-full animate-pulse" />
            <span class="text-sm font-medium text-w40k-text-secondary">Scores saisis</span>
          </div>

          <div class="relative w-full bg-w40k-bg-primary rounded-full h-3 overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-w40k-gold-500 to-w40k-red-500 rounded-full transition-all duration-500 ease-out relative"
              :style="{ width: `${getScoreEntryPercentage()}%` }"
            >
              <div
                class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"
              />
            </div>
          </div>

          <span class="text-xs text-w40k-text-muted"
            >{{ getEnteredScores() }}/{{ getTotalPossibleScores() }}</span
          >
        </div>
      </div>
    </div>

    <!-- Toast de notification W40K -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-x-full opacity-0"
      enter-to-class="transform translate-x-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-x-0 opacity-100"
      leave-to-class="transform translate-x-full opacity-0"
    >
      <div
        v-if="showNotification"
        :class="notificationClasses"
        class="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-lg shadow-2xl border-2 max-w-sm"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">{{ notificationIcon }}</span>
          <span class="font-medium">{{ notificationMessage }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { router } from '@inertiajs/vue3'
import W40KRoundRow from './W40KRoundRow.vue'
import W40KSecondaryScores from './W40KSecondaryScores.vue'
import type {
  GameScoreBoardProps,
  ScoreUpdateEvent,
  SecondaryScoreUpdateEvent,
  RoundDto,
  PlayerDto,
  OptimisticUpdate,
} from '../types'

const props = defineProps<GameScoreBoardProps>()

// Configuration
const NOTIFICATION_TIMEOUT = 3000
const MAX_OPTIMISTIC_UPDATES = 50

// État local pour optimistic updates
const localRounds = ref<RoundDto[]>([...props.rounds])
const optimisticUpdates = ref<OptimisticUpdate[]>([])

// État des notifications
const notification = reactive({
  show: false,
  type: 'success' as 'success' | 'error' | 'info',
  message: '',
  timeout: null as NodeJS.Timeout | null,
})

// Round en cours
const getCurrentRound = () => {
  const incompleteRound = localRounds.value.find((r) => !r.isCompleted)
  return incompleteRound?.roundNumber || localRounds.value.length + 1
}

// Statut de la partie avec style W40K
const gameStatusText = computed(() => {
  switch (props.game.status) {
    case 'PLANNED':
      return '📋 Planifiée'
    case 'IN_PROGRESS':
      return '⚔️ En cours'
    case 'COMPLETED':
      return '🏆 Terminée'
    case 'CANCELLED':
      return '❌ Annulée'
    default:
      return 'Inconnue'
  }
})

const gameStatusClasses = computed(() => {
  const baseClasses =
    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all duration-200'

  switch (props.game.status) {
    case 'PLANNED':
      return `${baseClasses} bg-blue-900/30 border-blue-500 text-blue-300 shadow-lg`
    case 'IN_PROGRESS':
      return `${baseClasses} bg-orange-900/30 border-orange-500 text-orange-300 shadow-lg animate-pulse`
    case 'COMPLETED':
      return `${baseClasses} bg-green-900/30 border-green-500 text-green-300 shadow-lg`
    case 'CANCELLED':
      return `${baseClasses} bg-gray-900/30 border-gray-500 text-gray-300 shadow-lg`
    default:
      return baseClasses
  }
})

// Calculs des scores avec mise en cache
const playerScores = computed(() => {
  const scores = new Map<number, { primary: number; secondary: number; total: number }>()

  props.players.forEach((player) => {
    if (!player) return

    const primary = localRounds.value.reduce((total, round) => {
      const score = player.isMainPlayer ? round.playerScore : round.opponentScore
      return total + (score || 0)
    }, 0)

    const secondary = props.secondaryScores
      .filter((score) => score.playerId === player.id)
      .reduce((total, score) => total + score.scoreValue, 0)

    scores.set(player.id, { primary, secondary, total: primary + secondary })
  })

  return scores
})

const getPlayerTotalScore = (player?: PlayerDto) => {
  if (!player) return 0
  return playerScores.value.get(player.id)?.total || 0
}

const getPrimaryScore = (player?: PlayerDto) => {
  if (!player) return 0
  return playerScores.value.get(player.id)?.primary || 0
}

const getSecondaryScore = (player?: PlayerDto) => {
  if (!player) return 0
  return playerScores.value.get(player.id)?.secondary || 0
}

// Gestion du gagnant avec style W40K
const isMainPlayerWinner = computed(() => {
  if (!props.game.winner) return false
  return (
    (props.game.winner === 'PLAYER' && props.players[0]?.isMainPlayer) ||
    (props.game.winner === 'OPPONENT' && props.players[1]?.isMainPlayer)
  )
})

const getWinnerText = () => {
  if (!props.game.winner) return ''

  switch (props.game.winner) {
    case 'DRAW':
      return '⚔️ Égalité !'
    case 'PLAYER':
      return props.players[0]?.isMainPlayer
        ? '🏆 Victoire !'
        : `👑 ${props.players[0]?.pseudo} gagne`
    case 'OPPONENT':
      return props.players[1]?.isMainPlayer
        ? '🏆 Victoire !'
        : `👑 ${props.players[1]?.pseudo || 'Adversaire'} gagne`
    default:
      return ''
  }
}

const winnerClasses = computed(() => {
  if (!props.game.winner) return ''

  const baseClasses = 'text-xl font-black px-4 py-2 rounded-lg border-2'

  if (props.game.winner === 'DRAW') {
    return `${baseClasses} text-w40k-gold-300 bg-w40k-gold-900/20 border-w40k-gold-500`
  }

  if (isMainPlayerWinner.value) {
    return `${baseClasses} text-green-300 bg-green-900/30 border-green-500 shadow-green-500/20 shadow-lg`
  }

  return `${baseClasses} text-w40k-red-300 bg-w40k-red-900/30 border-w40k-red-500 shadow-w40k-red-500/20 shadow-lg`
})

// Progression avec style W40K
const progressStats = computed(() => {
  const totalRounds = localRounds.value.length
  const playersCount = props.players.filter((p) => p).length

  if (totalRounds === 0) {
    return {
      completedRounds: 0,
      completionPercentage: 0,
      enteredScores: 0,
      totalPossibleScores: 0,
      scoreEntryPercentage: 0,
    }
  }

  let completedRounds = 0
  let enteredScores = 0

  localRounds.value.forEach((round) => {
    if (round.isCompleted) completedRounds++
    if (round.playerScore !== null && round.playerScore !== undefined) enteredScores++
    if (round.opponentScore !== null && round.opponentScore !== undefined) enteredScores++
  })

  const totalPossibleScores = totalRounds * playersCount

  return {
    completedRounds,
    completionPercentage: Math.round((completedRounds / totalRounds) * 100),
    enteredScores,
    totalPossibleScores,
    scoreEntryPercentage:
      totalPossibleScores > 0 ? Math.round((enteredScores / totalPossibleScores) * 100) : 0,
  }
})

const getCompletedRounds = () => progressStats.value.completedRounds
const getCompletionPercentage = () => progressStats.value.completionPercentage
const getEnteredScores = () => progressStats.value.enteredScores
const getTotalPossibleScores = () => progressStats.value.totalPossibleScores
const getScoreEntryPercentage = () => progressStats.value.scoreEntryPercentage

const showProgressIndicators = computed(() => {
  return localRounds.value.length > 0 && props.game.status === 'IN_PROGRESS'
})

// Gestionnaires d'événements
const updateLocalRound = (roundId: number, playerId: number, score: number) => {
  const round = localRounds.value.find((r) => r.id === roundId)
  if (!round) return

  const isMainPlayer = props.players.find((p) => p.id === playerId)?.isMainPlayer
  const oldValue = isMainPlayer ? round.playerScore : round.opponentScore

  if (isMainPlayer) {
    round.playerScore = score
  } else {
    round.opponentScore = score
  }

  round.isCompleted = round.playerScore !== null && round.opponentScore !== null

  optimisticUpdates.value.push({
    roundId,
    playerId,
    oldValue,
    newValue: score,
    timestamp: Date.now(),
  })

  if (optimisticUpdates.value.length > MAX_OPTIMISTIC_UPDATES) {
    optimisticUpdates.value = optimisticUpdates.value.slice(-MAX_OPTIMISTIC_UPDATES)
  }
}

const handleScoreUpdate = async (event: ScoreUpdateEvent) => {
  updateLocalRound(event.roundId, event.playerId, event.score)
  showNotificationMessage('⚔️ Score mis à jour', 'success')
}

const handleRoundCompleted = (roundId: number) => {
  showNotificationMessage('🏆 Round terminé !', 'success')
}

const handleSecondaryScoreUpdate = (event: SecondaryScoreUpdateEvent) => {
  showNotificationMessage('✨ Score secondaire mis à jour', 'success')
}

// Système de notifications W40K
const showNotificationMessage = (
  message: string,
  type: 'success' | 'error' | 'info' = 'success'
) => {
  if (notification.show && notification.message === message) return

  notification.message = message
  notification.type = type
  notification.show = true

  if (notification.timeout) {
    clearTimeout(notification.timeout)
  }

  notification.timeout = setTimeout(() => {
    notification.show = false
  }, NOTIFICATION_TIMEOUT)
}

const showNotification = computed(() => notification.show)
const notificationMessage = computed(() => notification.message)
const notificationIcon = computed(() => {
  switch (notification.type) {
    case 'success':
      return '⚔️'
    case 'error':
      return '💥'
    case 'info':
      return '🛡️'
    default:
      return '⚔️'
  }
})

const notificationClasses = computed(() => {
  const baseClasses = 'backdrop-blur-sm'

  switch (notification.type) {
    case 'success':
      return `${baseClasses} bg-green-900/80 border-green-500 text-green-100`
    case 'error':
      return `${baseClasses} bg-w40k-red-900/80 border-w40k-red-500 text-w40k-red-100`
    case 'info':
      return `${baseClasses} bg-blue-900/80 border-blue-500 text-blue-100`
    default:
      return baseClasses
  }
})
</script>

<style scoped>
/* Animation keyframes W40K */
@keyframes animate-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: animate-in 0.6s ease-out forwards;
}

/* Responsive optimisations */
@media (max-width: 768px) {
  .text-4xl {
    font-size: 2rem;
  }
  .text-3xl {
    font-size: 1.5rem;
  }
  .text-2xl {
    font-size: 1.25rem;
  }
}
</style>
