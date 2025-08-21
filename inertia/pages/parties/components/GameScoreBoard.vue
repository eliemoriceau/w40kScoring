<template>
  <div class="game-score-board">
    <!-- En-tête avec résumé des scores -->
    <div class="score-summary mb-6">
      <div class="summary-grid">
        <!-- Joueur 1 -->
        <div class="player-summary">
          <div class="player-info">
            <h3 class="player-name">
              {{ players[0]?.pseudo || 'Joueur 1' }}
              <span v-if="players[0]?.isMainPlayer" class="main-player-badge">(Vous)</span>
            </h3>
            <div class="total-score">{{ getPlayerTotalScore(players[0]) }}</div>
            <div class="score-breakdown">
              <span class="primary-score"> Primaires: {{ getPrimaryScore(players[0]) }} </span>
              <span class="secondary-score">
                Secondaires: {{ getSecondaryScore(players[0]) }}
              </span>
            </div>
          </div>
        </div>

        <!-- VS et statut de partie -->
        <div class="vs-section">
          <div class="vs-indicator">VS</div>
          <div class="game-status">
            <span :class="gameStatusClasses">{{ gameStatusText }}</span>
          </div>
          <div v-if="game.winner" class="winner-announcement">
            <span :class="winnerClasses">{{ getWinnerText() }}</span>
          </div>
        </div>

        <!-- Joueur 2 -->
        <div class="player-summary">
          <div v-if="players[1]" class="player-info">
            <h3 class="player-name">
              {{ players[1].pseudo }}
              <span v-if="players[1].isMainPlayer" class="main-player-badge">(Vous)</span>
            </h3>
            <div class="total-score">{{ getPlayerTotalScore(players[1]) }}</div>
            <div class="score-breakdown">
              <span class="primary-score"> Primaires: {{ getPrimaryScore(players[1]) }} </span>
              <span class="secondary-score">
                Secondaires: {{ getSecondaryScore(players[1]) }}
              </span>
            </div>
          </div>
          <div v-else class="awaiting-opponent">
            <span class="text-gray-500">En attente d'adversaire</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Grille des rounds -->
    <div class="rounds-container">
      <div class="rounds-header">
        <h3 class="rounds-title">Scores par Round</h3>
        <div class="rounds-legend">
          <span class="legend-item completed">✅ Terminé</span>
          <span class="legend-item current">🎯 En cours</span>
          <span class="legend-item pending">📋 À venir</span>
        </div>
      </div>

      <div class="rounds-grid">
        <RoundRow
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
      <div v-if="localRounds.length === 0" class="no-rounds">
        <div class="no-rounds-content">
          <svg
            class="w-12 h-12 text-gray-600 mb-4"
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
          <p class="text-gray-400">Aucun round créé pour cette partie</p>
          <p class="text-sm text-gray-500">
            Les rounds seront automatiquement créés lors du démarrage
          </p>
        </div>
      </div>
    </div>

    <!-- Scores secondaires -->
    <div class="secondary-scores-container mt-8">
      <SecondaryScores
        :players="players"
        :secondary-scores="secondaryScores"
        :rounds="localRounds"
        :can-edit="canEdit"
        @secondary-score-updated="handleSecondaryScoreUpdate"
      />
    </div>

    <!-- Indicateurs de progression -->
    <div v-if="showProgressIndicators" class="progress-indicators mt-6">
      <div class="progress-grid">
        <div class="progress-item">
          <span class="progress-label">Rounds terminés</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${getCompletionPercentage()}%` }" />
          </div>
          <span class="progress-text">{{ getCompletedRounds() }}/{{ localRounds.length }}</span>
        </div>

        <div class="progress-item">
          <span class="progress-label">Scores saisis</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${getScoreEntryPercentage()}%` }" />
          </div>
          <span class="progress-text">{{ getEnteredScores() }}/{{ getTotalPossibleScores() }}</span>
        </div>
      </div>
    </div>

    <!-- Notification toast -->
    <div v-if="showNotification" :class="notificationClasses" class="notification-toast">
      <div class="notification-content">
        <span class="notification-icon">{{ notificationIcon }}</span>
        <span class="notification-message">{{ notificationMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { router } from '@inertiajs/vue3'
import RoundRow from './RoundRow.vue'
import SecondaryScores from './SecondaryScores.vue'
import type {
  GameScoreBoardProps,
  ScoreUpdateEvent,
  SecondaryScoreUpdateEvent,
  RoundDto,
  PlayerDto,
  OptimisticUpdate,
} from '../types'

const props = defineProps<GameScoreBoardProps>()

// Configuration des notifications
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

// Round en cours (premier round non complété)
const getCurrentRound = () => {
  const incompleteRound = localRounds.value.find((r) => !r.isCompleted)
  return incompleteRound?.roundNumber || localRounds.value.length + 1
}

// Statut de la partie
const gameStatusText = computed(() => {
  switch (props.game.status) {
    case 'PLANNED':
      return 'Planifiée'
    case 'IN_PROGRESS':
      return 'En cours'
    case 'COMPLETED':
      return 'Terminée'
    case 'CANCELLED':
      return 'Annulée'
    default:
      return 'Inconnue'
  }
})

const gameStatusClasses = computed(() => {
  const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'
  switch (props.game.status) {
    case 'PLANNED':
      return `${baseClasses} bg-blue-900/50 border border-blue-700 text-blue-200`
    case 'IN_PROGRESS':
      return `${baseClasses} bg-orange-900/50 border border-orange-700 text-orange-200`
    case 'COMPLETED':
      return `${baseClasses} bg-green-900/50 border border-green-700 text-green-200`
    case 'CANCELLED':
      return `${baseClasses} bg-gray-900/50 border border-gray-700 text-gray-200`
    default:
      return baseClasses
  }
})

// Calculs des scores avec mise en cache
const playerScores = computed(() => {
  const scores = new Map<number, { primary: number; secondary: number; total: number }>()
  
  props.players.forEach(player => {
    if (!player) return
    
    // Score primaire
    const primary = localRounds.value.reduce((total, round) => {
      const score = player.isMainPlayer ? round.playerScore : round.opponentScore
      return total + (score || 0)
    }, 0)
    
    // Score secondaire
    const secondary = props.secondaryScores
      .filter((score) => score.playerId === player.id)
      .reduce((total, score) => total + score.scoreValue, 0)
    
    scores.set(player.id, {
      primary,
      secondary,
      total: primary + secondary
    })
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

// Calculs de progression optimisés
const progressStats = computed(() => {
  const totalRounds = localRounds.value.length
  const playersCount = props.players.filter((p) => p).length
  
  if (totalRounds === 0) {
    return {
      completedRounds: 0,
      completionPercentage: 0,
      enteredScores: 0,
      totalPossibleScores: 0,
      scoreEntryPercentage: 0
    }
  }
  
  let completedRounds = 0
  let enteredScores = 0
  
  localRounds.value.forEach(round => {
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
    scoreEntryPercentage: totalPossibleScores > 0 ? Math.round((enteredScores / totalPossibleScores) * 100) : 0
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

// Gestion du gagnant
const getWinnerText = () => {
  if (!props.game.winner) return ''

  switch (props.game.winner) {
    case 'DRAW':
      return 'Égalité'
    case 'PLAYER':
      return props.players[0]?.isMainPlayer ? 'Victoire !' : `${props.players[0]?.pseudo} gagne`
    case 'OPPONENT':
      return props.players[1]?.isMainPlayer
        ? 'Victoire !'
        : `${props.players[1]?.pseudo || 'Adversaire'} gagne`
    default:
      return ''
  }
}

const winnerClasses = computed(() => {
  if (!props.game.winner) return ''

  const isMainPlayerWin =
    (props.game.winner === 'PLAYER' && props.players[0]?.isMainPlayer) ||
    (props.game.winner === 'OPPONENT' && props.players[1]?.isMainPlayer)

  if (props.game.winner === 'DRAW') {
    return 'text-yellow-400 font-bold'
  }

  return isMainPlayerWin ? 'text-green-400 font-bold' : 'text-red-400 font-bold'
})

// Mise à jour optimiste avec nettoyage automatique
const updateLocalRound = (roundId: number, playerId: number, score: number) => {
  const round = localRounds.value.find((r) => r.id === roundId)
  if (!round) return

  // Sauvegarder l'ancienne valeur pour rollback
  const isMainPlayer = props.players.find((p) => p.id === playerId)?.isMainPlayer
  const oldValue = isMainPlayer ? round.playerScore : round.opponentScore

  // Appliquer la mise à jour optimiste
  if (isMainPlayer) {
    round.playerScore = score
  } else {
    round.opponentScore = score
  }

  // Mettre à jour le statut de complétion
  round.isCompleted = round.playerScore !== null && round.opponentScore !== null

  // Enregistrer pour rollback potentiel avec nettoyage automatique
  optimisticUpdates.value.push({
    roundId,
    playerId,
    oldValue,
    newValue: score,
    timestamp: Date.now(),
  })
  
  // Nettoyer les anciennes mises à jour optimistes
  if (optimisticUpdates.value.length > MAX_OPTIMISTIC_UPDATES) {
    optimisticUpdates.value = optimisticUpdates.value.slice(-MAX_OPTIMISTIC_UPDATES)
  }
}

const revertLocalRound = (roundId: number, playerId: number) => {
  const round = localRounds.value.find((r) => r.id === roundId)
  if (!round) return

  const update = optimisticUpdates.value.find(
    (u) => u.roundId === roundId && u.playerId === playerId
  )
  if (!update) return

  // Restaurer l'ancienne valeur
  const isMainPlayer = props.players.find((p) => p.id === playerId)?.isMainPlayer
  if (isMainPlayer) {
    round.playerScore = update.oldValue
  } else {
    round.opponentScore = update.oldValue
  }

  // Recalculer le statut de complétion
  round.isCompleted = round.playerScore !== null && round.opponentScore !== null
}

// Gestionnaires d'événements
const handleScoreUpdate = async (event: ScoreUpdateEvent) => {
  // 1. Mise à jour optimiste immédiate
  updateLocalRound(event.roundId, event.playerId, event.score)

  // 2. Afficher notification de succès temporaire
  showNotificationMessage('Score mis à jour', 'success')

  // Note: La sauvegarde est déjà gérée par ScoreCell.vue
  // En cas d'erreur, ScoreCell.vue peut émettre un événement d'erreur
}

const handleRoundCompleted = (roundId: number) => {
  showNotificationMessage('Round terminé !', 'success')
}

const handleSecondaryScoreUpdate = (event: SecondaryScoreUpdateEvent) => {
  showNotificationMessage('Score secondaire mis à jour', 'success')
}

// Système de notifications optimisé
const showNotificationMessage = (
  message: string,
  type: 'success' | 'error' | 'info' = 'success'
) => {
  // Éviter les notifications en double
  if (notification.show && notification.message === message) {
    return
  }
  
  notification.message = message
  notification.type = type
  notification.show = true

  // Nettoyer le timeout précédent
  if (notification.timeout) {
    clearTimeout(notification.timeout)
  }
  
  // Auto-hide avec constante configurée
  notification.timeout = setTimeout(() => {
    notification.show = false
  }, NOTIFICATION_TIMEOUT)
}

const showNotification = computed(() => notification.show)
const notificationMessage = computed(() => notification.message)
const notificationIcon = computed(() => {
  switch (notification.type) {
    case 'success':
      return '✅'
    case 'error':
      return '❌'
    case 'info':
      return 'ℹ️'
    default:
      return '✅'
  }
})

const notificationClasses = computed(() => [
  'fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300',
  {
    'bg-green-900/90 border border-green-700 text-green-200': notification.type === 'success',
    'bg-red-900/90 border border-red-700 text-red-200': notification.type === 'error',
    'bg-blue-900/90 border border-blue-700 text-blue-200': notification.type === 'info',
  },
])
</script>

<style scoped>
.game-score-board {
  @apply space-y-6;
}

.score-summary {
  @apply bg-slate-800 border border-red-800/50 rounded-lg p-6;
}

.summary-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6 items-center;
}

.player-summary {
  @apply text-center md:text-left;
}

.player-info {
  @apply space-y-2;
}

.player-name {
  @apply text-lg font-bold text-red-300;
}

.main-player-badge {
  @apply text-sm text-gray-400 font-normal;
}

.total-score {
  @apply text-3xl font-bold text-white;
}

.score-breakdown {
  @apply flex flex-col gap-1 text-sm;
}

.primary-score {
  @apply text-blue-300;
}

.secondary-score {
  @apply text-green-300;
}

.vs-section {
  @apply text-center space-y-2;
}

.vs-indicator {
  @apply text-2xl font-bold text-gray-500 bg-slate-700 px-4 py-2 rounded-full inline-block;
}

.game-status {
  @apply flex justify-center;
}

.winner-announcement {
  @apply text-lg;
}

.awaiting-opponent {
  @apply text-center py-8 text-gray-500;
}

.rounds-container {
  @apply bg-slate-800 border border-red-800/50 rounded-lg p-6;
}

.rounds-header {
  @apply flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3;
}

.rounds-title {
  @apply text-xl font-bold text-red-300;
}

.rounds-legend {
  @apply flex flex-wrap gap-3 text-sm;
}

.legend-item {
  @apply flex items-center gap-1;
}

.legend-item.completed {
  @apply text-green-300;
}

.legend-item.current {
  @apply text-orange-300;
}

.legend-item.pending {
  @apply text-gray-400;
}

.rounds-grid {
  @apply space-y-3;
}

.no-rounds {
  @apply py-12;
}

.no-rounds-content {
  @apply text-center;
}

.secondary-scores-container {
  /* Styles handled by SecondaryScores component */
}

.progress-indicators {
  @apply bg-slate-800 border border-red-800/50 rounded-lg p-4;
}

.progress-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.progress-item {
  @apply space-y-2;
}

.progress-label {
  @apply text-sm font-medium text-gray-300;
}

.progress-bar {
  @apply w-full bg-slate-700 rounded-full h-2;
}

.progress-fill {
  @apply bg-gradient-to-r from-red-600 to-red-500 h-2 rounded-full transition-all duration-300;
}

.progress-text {
  @apply text-xs text-gray-400;
}

.notification-toast {
  @apply animate-in slide-in-from-right-2 duration-300;
}

.notification-content {
  @apply flex items-center gap-2;
}

.notification-icon {
  @apply text-lg;
}

.notification-message {
  @apply font-medium;
}

/* Responsive */
@media (max-width: 768px) {
  .summary-grid {
    @apply grid-cols-1 gap-4;
  }

  .vs-section {
    @apply order-3;
  }

  .total-score {
    @apply text-2xl;
  }

  .score-breakdown {
    @apply flex-row justify-center gap-4;
  }

  .rounds-header {
    @apply text-center;
  }

  .rounds-legend {
    @apply justify-center;
  }
}
</style>
