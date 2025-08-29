<template>
  <AdminLayout :user="user" :breadcrumb-items="breadcrumbItems">
    <div class="space-y-6">
      <!-- En-tête avec actions -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-red-400">Partie #{{ game.id }}</h1>
          <p class="text-slate-300 mt-2">
            {{ game.user.username }}
            vs
            {{ game.opponent ? game.opponent.username : 'IA/Bot' }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <Link
            href="/admin/parties"
            class="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour à la liste
          </Link>

          <StatusChangeModal
            v-if="showStatusModal"
            :game="game"
            @confirm="handleStatusChange"
            @cancel="showStatusModal = false"
          />

          <button
            v-if="game.status !== 'CANCELLED'"
            @click="showStatusModal = true"
            class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Modifier le statut
          </button>
        </div>
      </div>

      <!-- Informations principales -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Détails de la partie -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Statut et informations générales -->
          <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Informations générales</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-slate-300">Statut</label>
                <div class="mt-1">
                  <span :class="getStatusClasses(game.status)">
                    {{ formatStatus(game.status) }}
                  </span>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-300">Type de partie</label>
                <div class="mt-1 text-white">{{ formatGameType(game.gameType) }}</div>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-300">Points limite</label>
                <div class="mt-1 text-white">{{ game.pointsLimit }} points</div>
              </div>

              <div v-if="game.mission">
                <label class="text-sm font-medium text-slate-300">Mission</label>
                <div class="mt-1 text-white">{{ game.mission }}</div>
              </div>

              <div v-if="game.deployment">
                <label class="text-sm font-medium text-slate-300">Déploiement</label>
                <div class="mt-1 text-white">{{ game.deployment }}</div>
              </div>

              <div v-if="game.primaryScoringMethod">
                <label class="text-sm font-medium text-slate-300">Méthode de score</label>
                <div class="mt-1 text-white">{{ game.primaryScoringMethod }}</div>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-300">Créée le</label>
                <div class="mt-1 text-white">{{ game.createdAt }}</div>
              </div>

              <div v-if="game.startedAt">
                <label class="text-sm font-medium text-slate-300">Démarrée le</label>
                <div class="mt-1 text-white">{{ game.startedAt }}</div>
              </div>

              <div v-if="game.completedAt">
                <label class="text-sm font-medium text-slate-300">Terminée le</label>
                <div class="mt-1 text-white">{{ game.completedAt }}</div>
              </div>
            </div>

            <div v-if="game.notes" class="mt-4">
              <label class="text-sm font-medium text-slate-300">Notes</label>
              <div class="mt-1 p-3 bg-slate-700 rounded-lg text-white">
                {{ game.notes }}
              </div>
            </div>
          </div>

          <!-- Scores finaux -->
          <div
            v-if="game.status === 'COMPLETED'"
            class="bg-slate-800 border border-red-800/50 rounded-lg p-6"
          >
            <h3 class="text-lg font-semibold text-white mb-4">Score final</h3>
            <div class="grid grid-cols-2 gap-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-white mb-2">{{ game.playerScore }}</div>
                <div class="text-slate-300">{{ game.user.username }}</div>
                <div class="text-sm text-slate-400">
                  {{ game.user.fullName || game.user.email }}
                </div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-white mb-2">{{ game.opponentScore }}</div>
                <div class="text-slate-300">
                  {{ game.opponent ? game.opponent.username : 'IA/Bot' }}
                </div>
                <div class="text-sm text-slate-400">
                  {{ game.opponent?.fullName || game.opponent?.email || '' }}
                </div>
              </div>
            </div>

            <div class="mt-4 text-center">
              <div class="text-lg font-medium text-white">
                {{ getWinner() }}
              </div>
            </div>
          </div>

          <!-- Rounds détaillés -->
          <div
            v-if="rounds.length > 0"
            class="bg-slate-800 border border-red-800/50 rounded-lg p-6"
          >
            <h3 class="text-lg font-semibold text-white mb-4">Rounds ({{ rounds.length }})</h3>
            <div class="space-y-3">
              <div
                v-for="round in rounds"
                :key="round.id"
                class="bg-slate-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-medium"
                  >
                    {{ round.roundNumber }}
                  </div>
                  <div>
                    <div class="text-sm text-slate-300">Round {{ round.roundNumber }}</div>
                    <div class="text-xs text-slate-400">{{ round.createdAt }}</div>
                  </div>
                </div>

                <div class="text-right">
                  <div class="text-lg font-medium text-white">
                    {{ round.playerScore }} - {{ round.opponentScore }}
                  </div>
                  <div class="text-xs text-slate-400">
                    {{ round.isCompleted ? 'Terminé' : 'En cours' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Joueurs -->
          <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Participants</h3>
            <div class="space-y-4">
              <!-- Joueur principal -->
              <div class="p-3 bg-slate-700 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span class="text-white font-medium text-sm">
                      {{ game.user.username.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div>
                    <div class="text-white font-medium">{{ game.user.username }}</div>
                    <div class="text-xs text-slate-400">
                      {{ game.user.fullName || game.user.email }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Adversaire -->
              <div class="p-3 bg-slate-700 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <span class="text-white font-medium text-sm">
                      {{ game.opponent ? game.opponent.username.charAt(0).toUpperCase() : 'AI' }}
                    </span>
                  </div>
                  <div>
                    <div class="text-white font-medium">
                      {{ game.opponent ? game.opponent.username : 'IA/Bot' }}
                    </div>
                    <div class="text-xs text-slate-400">
                      {{
                        game.opponent?.fullName ||
                        game.opponent?.email ||
                        'Intelligence artificielle'
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistiques rapides -->
          <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Statistiques</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-300">Durée</span>
                <span class="text-white">{{ getGameDuration() }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-300">Rounds joués</span>
                <span class="text-white">{{ rounds.length }}</span>
              </div>
              <div v-if="game.status === 'COMPLETED'" class="flex justify-between text-sm">
                <span class="text-slate-300">Score total</span>
                <span class="text-white">{{
                  (game.playerScore || 0) + (game.opponentScore || 0)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Actions administrateur -->
          <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Actions</h3>
            <div class="space-y-3">
              <button
                v-if="game.status !== 'CANCELLED'"
                @click="showStatusModal = true"
                class="w-full bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
              >
                Modifier le statut
              </button>

              <button
                @click="exportGameData"
                class="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
              >
                Exporter les données
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import AdminLayout from '~/pages/admin/components/AdminLayout.vue'
import StatusChangeModal from './components/StatusChangeModal.vue'

interface Props {
  user: any
  game: any
  rounds: any[]
  breadcrumbItems: Array<{ label: string; href?: string }>
}

const props = defineProps<Props>()

const showStatusModal = ref(false)

const formatGameType = (type: string) => {
  const types = {
    MATCHED_PLAY: 'Jeu Équilibré',
    NARRATIVE: 'Narratif',
    OPEN_PLAY: 'Jeu Libre',
  }
  return types[type as keyof typeof types] || type
}

const formatStatus = (status: string) => {
  const statuses = {
    PLANNED: 'Planifiée',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
  }
  return statuses[status as keyof typeof statuses] || status
}

const getStatusClasses = (status: string) => {
  const base = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium'
  const variants = {
    PLANNED: `${base} bg-blue-100 text-blue-800`,
    IN_PROGRESS: `${base} bg-yellow-100 text-yellow-800`,
    COMPLETED: `${base} bg-green-100 text-green-800`,
    CANCELLED: `${base} bg-red-100 text-red-800`,
  }
  return variants[status as keyof typeof variants] || `${base} bg-gray-100 text-gray-800`
}

const getWinner = () => {
  if (props.game.status !== 'COMPLETED') return ''

  const playerScore = props.game.playerScore || 0
  const opponentScore = props.game.opponentScore || 0

  if (playerScore > opponentScore) {
    return `🏆 Victoire de ${props.game.user.username}`
  } else if (opponentScore > playerScore) {
    return `🏆 Victoire de ${props.game.opponent ? props.game.opponent.username : 'IA/Bot'}`
  } else {
    return `🤝 Match nul`
  }
}

const getGameDuration = () => {
  if (!props.game.startedAt) return 'Non démarrée'
  if (!props.game.completedAt) return 'En cours'

  const start = new Date(props.game.startedAt)
  const end = new Date(props.game.completedAt)
  const diffMs = end.getTime() - start.getTime()

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}min`
  } else {
    return `${minutes}min`
  }
}

const handleStatusChange = async (newStatus: string) => {
  try {
    await router.put(
      `/admin/parties/${props.game.id}/status`,
      {
        status: newStatus,
      },
      {
        onSuccess: () => {
          showStatusModal.value = false
        },
        onError: (errors) => {
          console.error('Erreur lors du changement de statut:', errors)
        },
      }
    )
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error)
  }
}

const exportGameData = () => {
  const gameData = {
    game: props.game,
    rounds: props.rounds,
    exportedAt: new Date().toISOString(),
  }

  const dataStr = JSON.stringify(gameData, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

  const exportFileDefaultName = `partie-${props.game.id}-${new Date().toISOString().split('T')[0]}.json`

  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}
</script>
