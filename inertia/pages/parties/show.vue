<template>
  <Head :title="meta.title" />

  <div class="min-h-screen bg-slate-900 p-4">
    <!-- Header avec statut en haut et navigation -->
    <div class="max-w-6xl mx-auto mb-8">
      <!-- Statut en haut de page -->
      <div class="text-center mb-6">
        <span :class="statusClasses" class="px-4 py-2 rounded-lg text-lg font-bold">
          {{ meta.statusLabel }}
        </span>
      </div>

      <!-- Navigation retour -->
      <div class="mb-6">
        <Link
          href="/parties"
          class="inline-flex items-center text-red-400 hover:text-red-300 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour aux parties
        </Link>
      </div>

      <!-- Nom de la game -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6 mb-6">
        <h1 class="text-3xl font-bold text-red-100 mb-2">
          Partie #{{ game.id }} - {{ meta.gameTypeLabel }}
        </h1>
        <div class="text-slate-400">
          <p class="mb-2">{{ game.pointsLimit }} points</p>
          <p v-if="game.mission" class="mb-2">Mission: {{ game.mission }}</p>
          <p class="text-sm">
            Créée le {{ formatDate(game.createdAt) }}
            <span v-if="game.startedAt"> • Commencée le {{ formatDate(game.startedAt) }}</span>
            <span v-if="game.completedAt"> • Terminée le {{ formatDate(game.completedAt) }}</span>
          </p>
        </div>
      </div>

      <!-- Informations sur la partie -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6 mb-8">
        <h2 class="text-xl font-bold text-red-300 mb-4">Informations sur celle ci</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300">
          <div><span class="text-slate-500">Format:</span> {{ meta.gameTypeLabel }}</div>
          <div><span class="text-slate-500">Type:</span> {{ game.gameType }}</div>
          <div><span class="text-slate-500">Points:</span> {{ game.pointsLimit }}</div>
          <div v-if="game.deployment">
            <span class="text-slate-500">Déploiement:</span> {{ game.deployment }}
          </div>
          <div v-if="game.primaryScoringMethod">
            <span class="text-slate-500">Score Primaire:</span> {{ game.primaryScoringMethod }}
          </div>
          <div v-if="stats">
            <span class="text-slate-500">Rounds:</span> {{ stats.completedRounds }}/{{
              stats.totalRounds
            }}
          </div>
          <div v-if="game.winner">
            <span class="text-slate-500">Gagnant:</span>
            <span :class="winnerClasses">{{ getWinnerText() }}</span>
          </div>
        </div>
        <div v-if="game.notes" class="mt-4 pt-4 border-t border-slate-700">
          <span class="text-slate-500">Notes:</span>
          <p class="text-slate-300 mt-1">{{ game.notes }}</p>
        </div>
      </div>

      <!-- Nouveau composant minimaliste pour l'affichage des scores -->
      <W40KMinimalScoreBoard
        :game="gameDetailData"
        :players="players"
        :rounds="rounds"
        :secondary-scores="secondaryScores"
        :can-edit="meta.canEdit"
        class="mb-8"
      />

      <!-- Actions en bas -->
      <div v-if="meta.canEdit" class="mt-8 flex justify-center">
        <button
          class="bg-red-700 hover:bg-red-600 text-red-100 font-medium py-3 px-6 rounded-lg transition-colors"
          @click="editGame"
        >
          Modifier la partie
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { Head, Link, router } from '@inertiajs/vue3'
import W40KMinimalScoreBoard from './components/W40KMinimalScoreBoard.vue'
import type { GameDetailDto, PlayerDto, RoundDto, SecondaryScoreDto, GameMetaDto } from './types'

// Props définies par le contrôleur
const props = defineProps<{
  game: any // Ancien format, gardé pour compatibilité
  players: PlayerDto[]
  rounds: RoundDto[]
  secondaryScores: SecondaryScoreDto[]
  stats: any
  user: any
  meta: GameMetaDto
}>()

// Conversion des données pour le nouveau composant
const gameDetailData = computed(
  (): GameDetailDto => ({
    id: props.game.id,
    userId: props.game.userId,
    gameType: props.game.gameType,
    pointsLimit: props.game.pointsLimit,
    status: props.game.status,
    mission: props.game.mission,
    deployment: props.game.deployment,
    primaryScoringMethod: props.game.primaryScoringMethod,
    notes: props.game.notes,
    winner: props.game.winner,
    createdAt: props.game.createdAt,
    startedAt: props.game.startedAt,
    completedAt: props.game.completedAt,
  })
)

// État local (conservation pour compatibilité avec l'ancien code)
const isLoading = ref(false)

// Classes CSS dynamiques selon le statut
const statusClasses = computed(() => {
  const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium'
  const statusMap = {
    PLANNED: 'bg-blue-900/50 border border-blue-800 text-blue-200',
    IN_PROGRESS: 'bg-yellow-900/50 border border-yellow-800 text-yellow-200',
    COMPLETED: 'bg-green-900/50 border border-green-800 text-green-200',
    CANCELLED: 'bg-gray-900/50 border border-gray-800 text-gray-200',
  }
  return statusMap[props.game?.status] || statusMap.PLANNED
})

// Classes CSS pour le gagnant
const winnerClasses = computed(() => {
  if (!props.game?.winner) return 'text-slate-400'

  const isMainPlayerWin =
    (props.game.winner === 'PLAYER' && getPlayer1().isMainPlayer) ||
    (props.game.winner === 'OPPONENT' && !getPlayer1().isMainPlayer)

  return isMainPlayerWin ? 'text-green-400 font-bold' : 'text-red-400 font-bold'
})

// Helpers pour les joueurs
function getPlayer1() {
  return props.players?.[0] || { pseudo: 'Joueur 1', isMainPlayer: false, totalScore: 0, id: 0 }
}

function getPlayer2() {
  return props.players?.[1] || null
}

// Helper pour les scores secondaires
function getSecondaryScoresForPlayer(playerId) {
  return props.secondaryScores?.filter((score) => score.playerId === playerId) || []
}

// Helper pour obtenir le numéro de round
function getRoundNumber(roundId) {
  const round = props.rounds?.find((r) => r.id === roundId)
  return round?.roundNumber || '?'
}

// Helper pour formater les dates
function formatDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Helper pour le texte du gagnant
function getWinnerText() {
  if (!props.game?.winner) return ''

  switch (props.game.winner) {
    case 'DRAW':
      return 'Égalité'
    case 'PLAYER':
      return getPlayer1().isMainPlayer ? 'Vous' : getPlayer1().pseudo
    case 'OPPONENT':
      return getPlayer1().isMainPlayer ? getPlayer2()?.pseudo || 'Adversaire' : 'Vous'
    default:
      return ''
  }
}

// Fonctions utilitaires conservées pour l'affichage des métadonnées

// Actions
function editGame() {
  // TODO: Rediriger vers la page d'édition
  console.log('Édition de la partie', props.game?.id)
}
</script>
