<template>
  <div class="space-y-6">
    <!-- En-tête minimal avec scores totaux -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
      <div class="grid grid-cols-3 gap-4 items-center">
        <!-- Joueur 1 -->
        <div class="text-center">
          <h3 class="text-lg font-semibold text-red-300 mb-1">
            {{ players[0]?.pseudo || 'Joueur 1' }}
            <span v-if="players[0]?.isMainPlayer" class="text-sm text-slate-400 font-normal"
              >(Vous)</span
            >
          </h3>
          <div class="text-3xl font-bold text-white">
            {{ getPlayerTotalScore(players[0]) }}
          </div>
        </div>

        <!-- VS Central -->
        <div class="text-center">
          <div class="text-xl font-bold text-slate-400 bg-slate-700 px-4 py-2 rounded-lg">VS</div>
          <div v-if="game.winner" class="mt-2">
            <span :class="winnerClasses">{{ getWinnerText() }}</span>
          </div>
        </div>

        <!-- Joueur 2 -->
        <div v-if="players[1]" class="text-center">
          <h3 class="text-lg font-semibold text-red-300 mb-1">
            {{ players[1].pseudo }}
            <span v-if="players[1].isMainPlayer" class="text-sm text-slate-400 font-normal"
              >(Vous)</span
            >
          </h3>
          <div class="text-3xl font-bold text-white">
            {{ getPlayerTotalScore(players[1]) }}
          </div>
        </div>
        <div v-else class="text-center text-slate-400">
          <span class="text-sm">En attente d'adversaire</span>
        </div>
      </div>
    </div>

    <!-- Scores primaires par round - Une ligne par joueur -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
      <h3 class="text-xl font-semibold text-red-300 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Scores Primaires
      </h3>

      <!-- Compteur de Round Courant -->
      <div v-if="localRounds.length > 0" class="flex items-center justify-center mb-4">
        <div
          class="bg-slate-700 border border-red-700/50 rounded-lg px-6 py-2 flex items-center gap-4"
        >
          <button
            @click="previousRound"
            class="text-red-300 hover:text-red-200 disabled:text-slate-500 transition-colors duration-200 p-1"
            :disabled="roundCounter.currentRound <= 1"
            aria-label="Round précédent"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div class="text-center">
            <div class="text-xs text-slate-400 font-medium">Round Courant</div>
            <div class="text-lg font-bold text-white">
              {{ roundCounter.currentRound }} / {{ totalRounds }}
            </div>
          </div>

          <button
            @click="nextRound"
            class="text-red-300 hover:text-red-200 disabled:text-slate-500 transition-colors duration-200 p-1"
            :disabled="roundCounter.currentRound >= totalRounds"
            aria-label="Round suivant"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <!-- Grid côte à côte pour les deux joueurs -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Tableau pour le joueur 1 -->
        <div class="border border-slate-600 rounded-lg p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-red-300">{{ players[0]?.pseudo || 'Joueur 1' }}</span>
            <span class="text-lg font-bold text-white">{{ getPrimaryScore(players[0]) }}</span>
          </div>
          <div class="grid grid-cols-5 gap-2">
            <div v-for="round in localRounds" :key="`player1-${round.id}`" class="text-center">
              <div
                class="text-xs mb-1 transition-colors duration-200"
                :class="
                  round.roundNumber === roundCounter.currentRound
                    ? 'text-red-300 font-bold'
                    : 'text-slate-400'
                "
              >
                R{{ round.roundNumber }}
              </div>
              <W40KScoreCell
                :round="round"
                :player="players[0]"
                :game-id="props.game.id"
                :editable="canEdit && !round.isCompleted"
                :current="round.roundNumber === roundCounter.currentRound"
                @score-updated="handleScoreUpdate"
              />
            </div>
          </div>
        </div>

        <!-- Tableau pour le joueur 2 -->
        <div v-if="players[1]" class="border border-slate-600 rounded-lg p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-red-300">{{ players[1].pseudo }}</span>
            <span class="text-lg font-bold text-white">{{ getPrimaryScore(players[1]) }}</span>
          </div>
          <div class="grid grid-cols-5 gap-2">
            <div v-for="round in localRounds" :key="`player2-${round.id}`" class="text-center">
              <div
                class="text-xs mb-1 transition-colors duration-200"
                :class="
                  round.roundNumber === roundCounter.currentRound
                    ? 'text-red-300 font-bold'
                    : 'text-slate-400'
                "
              >
                R{{ round.roundNumber }}
              </div>
              <W40KScoreCell
                :round="round"
                :player="players[1]"
                :game-id="props.game.id"
                :editable="canEdit && !round.isCompleted"
                :current="round.roundNumber === roundCounter.currentRound"
                @score-updated="handleScoreUpdate"
              />
            </div>
          </div>
        </div>

        <!-- Placeholder si pas de joueur 2 -->
        <div v-else class="border border-slate-600 rounded-lg p-3 flex items-center justify-center">
          <span class="text-slate-400 text-sm">En attente d'adversaire</span>
        </div>
      </div>

      <!-- Message si aucun round -->
      <div v-if="localRounds.length === 0" class="py-8 text-center text-slate-400">
        <div class="space-y-2">
          <svg
            class="w-12 h-12 mx-auto text-slate-500"
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
          <p>Aucun round créé pour cette partie</p>
          <p class="text-sm text-slate-500">Les rounds seront créés lors du démarrage</p>
        </div>
      </div>
    </div>

    <!-- Tableau des scores secondaires -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
      <h3 class="text-xl font-semibold text-red-300 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Scores Secondaires
      </h3>

      <W40KCompactSecondaryScores :players="players" :secondary-scores="secondaryScores" />
    </div>

    <!-- Toast de notification -->
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
        class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border max-w-sm"
      >
        <div class="flex items-center gap-2">
          <span>{{ notificationIcon }}</span>
          <span class="font-medium">{{ notificationMessage }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import W40KScoreCell from './W40KScoreCell.vue'
import W40KCompactSecondaryScores from './W40KCompactSecondaryScores.vue'
import type {
  GameScoreBoardProps,
  ScoreUpdateEvent,
  SecondaryScoreUpdateEvent,
  RoundDto,
  PlayerDto,
  OptimisticUpdate,
  RoundCounterState,
  RoundNavigationEvent,
} from '../types'

const props = defineProps<GameScoreBoardProps>()

// Émissions d'événements
const emit = defineEmits<{
  'round-changed': [event: RoundNavigationEvent]
}>()

// Configuration
const NOTIFICATION_TIMEOUT = 3000

// État local pour optimistic updates
const localRounds = ref<RoundDto[]>([...props.rounds])

// État du compteur de round
const roundCounter = reactive<RoundCounterState>({
  currentRound: 1,
  totalRounds: 5,
  canNavigate: true,
  roundHistory: [],
})

// État des notifications
const notification = reactive({
  show: false,
  type: 'success' as 'success' | 'error' | 'info',
  message: '',
  timeout: null as NodeJS.Timeout | null,
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

// Calculs pour le compteur de round
const currentRound = computed(() => {
  if (!localRounds.value.length) return 1

  const firstIncomplete = localRounds.value.find((r) => !r.isCompleted)
  return firstIncomplete?.roundNumber || localRounds.value[localRounds.value.length - 1].roundNumber
})

const totalRounds = computed(() => {
  return Math.max(localRounds.value.length, 5) // Minimum 5 rounds W40K
})

// Fonctions de navigation des rounds
const navigateToRound = (roundNumber: number) => {
  if (roundNumber < 1 || roundNumber > totalRounds.value) return

  const previousRound = roundCounter.currentRound
  roundCounter.roundHistory.push(previousRound)
  roundCounter.currentRound = roundNumber

  // Émettre événement pour mise à jour de l'affichage
  const targetRound = localRounds.value.find((r) => r.roundNumber === roundNumber)
  emit('round-changed', {
    previousRound,
    currentRound: roundNumber,
    roundId: targetRound?.id || 0,
  })

  showNotificationMessage(`Navigation vers Round ${roundNumber}`, 'info')
}

const nextRound = () => {
  if (roundCounter.currentRound < totalRounds.value) {
    navigateToRound(roundCounter.currentRound + 1)
  }
}

const previousRound = () => {
  if (roundCounter.currentRound > 1) {
    navigateToRound(roundCounter.currentRound - 1)
  }
}

// Synchroniser le round courant avec le state
const syncCurrentRound = () => {
  roundCounter.currentRound = currentRound.value
  roundCounter.totalRounds = totalRounds.value
}

// Initialisation au montage du composant
onMounted(() => {
  syncCurrentRound()
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

  const baseClasses = 'text-sm font-semibold px-3 py-1 rounded-full'

  if (props.game.winner === 'DRAW') {
    return `${baseClasses} text-yellow-300 bg-yellow-900/30 border border-yellow-500`
  }

  const isMainPlayerWinner =
    (props.game.winner === 'PLAYER' && props.players[0]?.isMainPlayer) ||
    (props.game.winner === 'OPPONENT' && props.players[1]?.isMainPlayer)

  return isMainPlayerWinner
    ? `${baseClasses} text-green-300 bg-green-900/30 border border-green-500`
    : `${baseClasses} text-red-300 bg-red-900/30 border border-red-500`
})

// Gestionnaires d'événements
const updateLocalRound = (roundId: number, playerId: number, score: number) => {
  const round = localRounds.value.find((r) => r.id === roundId)
  if (!round) return

  const isMainPlayer = props.players.find((p) => p.id === playerId)?.isMainPlayer

  if (isMainPlayer) {
    round.playerScore = score
  } else {
    round.opponentScore = score
  }

  round.isCompleted = round.playerScore !== null && round.opponentScore !== null
}

const handleScoreUpdate = async (event: ScoreUpdateEvent) => {
  updateLocalRound(event.roundId, event.playerId, event.score)
  syncCurrentRound() // Resynchroniser après mise à jour
  showNotificationMessage('Score mis à jour', 'success')
}

const handleSecondaryScoreUpdate = (event: SecondaryScoreUpdateEvent) => {
  showNotificationMessage('Score secondaire mis à jour', 'success')
}

// Système de notifications
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
      return '✅'
    case 'error':
      return '❌'
    case 'info':
      return 'ℹ️'
    default:
      return '✅'
  }
})

const notificationClasses = computed(() => {
  const baseClasses = 'backdrop-blur-sm'

  switch (notification.type) {
    case 'success':
      return `${baseClasses} bg-green-900/80 border-green-500 text-green-100`
    case 'error':
      return `${baseClasses} bg-red-900/80 border-red-500 text-red-100`
    case 'info':
      return `${baseClasses} bg-blue-900/80 border-blue-500 text-blue-100`
    default:
      return baseClasses
  }
})
</script>
