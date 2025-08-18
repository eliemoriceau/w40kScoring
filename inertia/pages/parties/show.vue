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

      <!-- Layout des joueurs et scores - Responsive colonne sur mobile -->
      <div class="flex flex-col lg:grid lg:grid-cols-2 gap-6 mb-8">
        <!-- Joueur 1 -->
        <div class="space-y-6">
          <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
            <h3 class="text-lg font-bold text-red-300 text-center mb-2">
              {{ getPlayer1().pseudo }}
              <span v-if="getPlayer1().isMainPlayer" class="text-slate-500 text-sm">(Vous)</span>
            </h3>
            <div class="text-center">
              <div class="text-3xl font-bold text-slate-200">
                {{ getPlayer1().totalScore || 0 }}
              </div>
              <div class="text-slate-500 text-sm">Score Total</div>
            </div>
          </div>

          <!-- Score primaire par Round - Joueur 1 -->
          <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
            <h4 class="text-md font-semibold text-red-300 text-center mb-4">
              Score primaire par Round
            </h4>
            <div class="space-y-2">
              <div
                v-for="round in rounds"
                :key="round.id"
                class="flex justify-between items-center py-2 px-3 bg-slate-700 rounded"
              >
                <span class="text-slate-300">Round {{ round.roundNumber }}</span>
                <div class="flex items-center gap-2">
                  <span
                    v-if="!isEditingRound(round.id, getPlayer1().id)"
                    class="font-bold text-slate-200 cursor-pointer hover:text-red-300"
                    @click="
                      startEditingRound(
                        round.id,
                        getPlayer1().id,
                        getPlayer1().isMainPlayer ? round.playerScore : round.opponentScore
                      )
                    "
                  >
                    {{ getPlayer1().isMainPlayer ? round.playerScore : round.opponentScore }}
                  </span>
                  <input
                    v-else
                    v-model.number="editingScore"
                    @blur="saveRoundScore(round.id, getPlayer1().id)"
                    @keyup.enter="saveRoundScore(round.id, getPlayer1().id)"
                    @keyup.escape="cancelEditing"
                    class="w-16 px-2 py-1 bg-slate-600 text-slate-200 border border-red-600 rounded text-center font-bold"
                    type="number"
                    min="0"
                    ref="scoreInput"
                  />
                  <button
                    v-if="meta.canEdit && !isEditingRound(round.id, getPlayer1().id)"
                    @click="
                      startEditingRound(
                        round.id,
                        getPlayer1().id,
                        getPlayer1().isMainPlayer ? round.playerScore : round.opponentScore
                      )
                    "
                    class="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div v-if="rounds.length === 0" class="text-slate-500 text-center py-4">
                Aucun round joué
              </div>
            </div>
          </div>
        </div>

        <!-- Joueur 2 -->
        <div class="space-y-6">
          <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
            <h3 class="text-lg font-bold text-red-300 text-center mb-2">
              {{ getPlayer2()?.pseudo || 'Adversaire' }}
              <span v-if="getPlayer2()?.isMainPlayer" class="text-slate-500 text-sm">(Vous)</span>
            </h3>
            <div class="text-center">
              <div class="text-3xl font-bold text-slate-200">
                {{ getPlayer2()?.totalScore || 0 }}
              </div>
              <div class="text-slate-500 text-sm">Score Total</div>
            </div>
          </div>

          <!-- Score primaire par Round - Joueur 2 -->
          <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
            <h4 class="text-md font-semibold text-red-300 text-center mb-4">
              Score primaire par Round
            </h4>
            <div class="space-y-2">
              <div
                v-for="round in rounds"
                :key="round.id"
                class="flex justify-between items-center py-2 px-3 bg-slate-700 rounded"
              >
                <span class="text-slate-300">Round {{ round.roundNumber }}</span>
                <div class="flex items-center gap-2">
                  <span
                    v-if="!isEditingRound(round.id, getPlayer2()?.id)"
                    class="font-bold text-slate-200 cursor-pointer hover:text-red-300"
                    @click="
                      startEditingRound(
                        round.id,
                        getPlayer2()?.id,
                        getPlayer1().isMainPlayer ? round.opponentScore : round.playerScore
                      )
                    "
                  >
                    {{ getPlayer1().isMainPlayer ? round.opponentScore : round.playerScore }}
                  </span>
                  <input
                    v-else
                    v-model.number="editingScore"
                    @blur="saveRoundScore(round.id, getPlayer2()?.id)"
                    @keyup.enter="saveRoundScore(round.id, getPlayer2()?.id)"
                    @keyup.escape="cancelEditing"
                    class="w-16 px-2 py-1 bg-slate-600 text-slate-200 border border-red-600 rounded text-center font-bold"
                    type="number"
                    min="0"
                    ref="scoreInput"
                  />
                  <button
                    v-if="meta.canEdit && !isEditingRound(round.id, getPlayer2()?.id)"
                    @click="
                      startEditingRound(
                        round.id,
                        getPlayer2()?.id,
                        getPlayer1().isMainPlayer ? round.opponentScore : round.playerScore
                      )
                    "
                    class="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div v-if="rounds.length === 0" class="text-slate-500 text-center py-4">
                Aucun round joué
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scores secondaires - Responsive colonne sur mobile -->
      <div class="flex flex-col lg:grid lg:grid-cols-2 gap-6">
        <!-- Scores secondaires Joueur 1 -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <h4 class="text-lg font-bold text-red-300 mb-4 text-center">
            Score secondaire - {{ getPlayer1().pseudo }}
          </h4>
          <div class="space-y-3">
            <div
              v-for="score in getSecondaryScoresForPlayer(getPlayer1().id)"
              :key="score.id"
              class="flex justify-between items-center py-2 px-3 bg-slate-700 rounded"
            >
              <div>
                <div class="text-slate-300 font-medium">{{ score.scoreName }}</div>
                <div class="text-slate-500 text-sm">Round {{ getRoundNumber(score.roundId) }}</div>
              </div>
              <span class="font-bold text-slate-200">{{ score.scoreValue }}</span>
            </div>
            <div
              v-if="getSecondaryScoresForPlayer(getPlayer1().id).length === 0"
              class="text-slate-500 text-center py-8"
            >
              Aucun score secondaire enregistré
            </div>
          </div>
        </div>

        <!-- Scores secondaires Joueur 2 -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <h4 class="text-lg font-bold text-red-300 mb-4 text-center">
            Score secondaire - {{ getPlayer2()?.pseudo || 'Adversaire' }}
          </h4>
          <div class="space-y-3">
            <div
              v-for="score in getSecondaryScoresForPlayer(getPlayer2()?.id || 0)"
              :key="score.id"
              class="flex justify-between items-center py-2 px-3 bg-slate-700 rounded"
            >
              <div>
                <div class="text-slate-300 font-medium">{{ score.scoreName }}</div>
                <div class="text-slate-500 text-sm">Round {{ getRoundNumber(score.roundId) }}</div>
              </div>
              <span class="font-bold text-slate-200">{{ score.scoreValue }}</span>
            </div>
            <div
              v-if="getSecondaryScoresForPlayer(getPlayer2()?.id || 0).length === 0"
              class="text-slate-500 text-center py-8"
            >
              Aucun score secondaire enregistré
            </div>
          </div>
        </div>
      </div>

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

<script setup>
import { computed, ref, nextTick } from 'vue'
import { Head, Link, router } from '@inertiajs/vue3'

// Props définies par le contrôleur
const props = defineProps({
  game: Object,
  players: Array,
  rounds: Array,
  secondaryScores: Array,
  stats: Object,
  user: Object,
  meta: Object,
})

// État pour l'édition inline
const editingRoundId = ref(null)
const editingPlayerId = ref(null)
const editingScore = ref(0)
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

// Logique d'édition inline
function isEditingRound(roundId, playerId) {
  return editingRoundId.value === roundId && editingPlayerId.value === playerId
}

async function startEditingRound(roundId, playerId, currentScore) {
  if (!props.meta?.canEdit) return

  editingRoundId.value = roundId
  editingPlayerId.value = playerId
  editingScore.value = currentScore

  // Focus sur l'input après le prochain tick
  await nextTick()
  const input = document.querySelector('input[ref="scoreInput"]')
  if (input) {
    input.focus()
    input.select()
  }
}

function cancelEditing() {
  editingRoundId.value = null
  editingPlayerId.value = null
  editingScore.value = 0
}

async function saveRoundScore(roundId, playerId) {
  if (isLoading.value) return

  const newScore = editingScore.value
  const currentRound = props.rounds.find((r) => r.id === roundId)

  if (!currentRound || newScore < 0) {
    cancelEditing()
    return
  }

  // Détermine si on modifie le score du joueur principal ou de l'adversaire
  const isMainPlayerScore = getPlayer1().id === playerId
  const isMainPlayerFirst = getPlayer1().isMainPlayer

  let playerScore = currentRound.playerScore
  let opponentScore = currentRound.opponentScore

  if ((isMainPlayerScore && isMainPlayerFirst) || (!isMainPlayerScore && !isMainPlayerFirst)) {
    playerScore = newScore
  } else {
    opponentScore = newScore
  }

  isLoading.value = true

  try {
    // Appel API pour sauvegarder le score
    await router.patch(
      `/parties/${props.game.id}/rounds/${roundId}`,
      {
        playerScore,
        opponentScore,
      },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          cancelEditing()
        },
        onError: (errors) => {
          console.error('Erreur lors de la sauvegarde:', errors)
          // TODO: Afficher un message d'erreur à l'utilisateur
        },
      }
    )
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du score:', error)
  } finally {
    isLoading.value = false
  }
}

// Actions
function editGame() {
  // TODO: Rediriger vers la page d'édition
  console.log('Édition de la partie', props.game?.id)
}
</script>
