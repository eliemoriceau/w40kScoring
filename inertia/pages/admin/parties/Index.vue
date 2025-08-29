<template>
  <AdminLayout :user="user" :breadcrumb-items="breadcrumbItems">
    <div class="space-y-6">
      <!-- En-tête avec actions principales -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-red-400">Gestion des Parties</h1>
          <p class="text-slate-300 mt-2">Gérez toutes les parties W40K de la plateforme</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="refreshStats"
            class="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            :disabled="loading"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      <!-- Statistiques des parties -->
      <PartieStatsCards :stats="stats" />

      <!-- Barre de recherche et filtres -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <!-- Recherche -->
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Rechercher des parties
            </label>
            <div class="relative">
              <input
                v-model="searchForm.search"
                @input="debounceSearch"
                type="text"
                placeholder="Nom de joueur, mission, déploiement..."
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <svg
                class="absolute right-3 top-2.5 w-5 h-5 text-slate-400"
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
          </div>

          <!-- Filtre par statut -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"> Statut </label>
            <select
              v-model="searchForm.status"
              @change="applyFilters"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Tous les statuts</option>
              <option value="PLANNED">Planifiée</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Terminée</option>
              <option value="CANCELLED">Annulée</option>
            </select>
          </div>

          <!-- Filtre par type -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"> Type de partie </label>
            <select
              v-model="searchForm.gameType"
              @change="applyFilters"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Tous les types</option>
              <option value="MATCHED_PLAY">Jeu Équilibré</option>
              <option value="NARRATIVE">Narratif</option>
              <option value="OPEN_PLAY">Jeu Libre</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Liste des parties -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg overflow-hidden">
        <div class="px-6 py-4 bg-slate-900 border-b border-red-800/50">
          <h3 class="text-lg font-semibold text-white">
            Parties ({{ games.meta.total }} résultats)
          </h3>
        </div>

        <!-- Table header -->
        <div
          class="hidden lg:grid lg:grid-cols-8 gap-4 px-6 py-3 bg-slate-750 border-b border-slate-600 text-sm font-medium text-slate-300"
        >
          <div>ID</div>
          <div>Joueurs</div>
          <div>Type / Points</div>
          <div>Statut</div>
          <div>Score</div>
          <div>Mission</div>
          <div>Créée le</div>
          <div class="text-right">Actions</div>
        </div>

        <!-- Table body -->
        <div v-if="loading" class="p-8 text-center">
          <div class="inline-flex items-center px-4 py-2 text-slate-400">
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Chargement des parties...
          </div>
        </div>

        <div v-else-if="games.data.length === 0" class="p-8 text-center text-slate-400">
          <svg
            class="mx-auto h-12 w-12 text-slate-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-4-7.972M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0118 28v-3m-4.287 15.714a9.971 9.971 0 01-5.426 0m2.856-15.714A9.968 9.968 0 0118 25m-8.287 5.714c-.778-.324-1.513-.78-2.193-1.33M18 25a9.968 9.968 0 012.287.714M18 25c2.485 0 4.751.923 6.287 2.5M18 25a9.971 9.971 0 014 7.972"
            />
          </svg>
          <p class="text-lg font-medium text-slate-300 mb-2">Aucune partie trouvée</p>
          <p class="text-slate-400">
            {{
              searchForm.search
                ? 'Essayez de modifier vos critères de recherche.'
                : "Aucune partie n'a encore été créée."
            }}
          </p>
        </div>

        <div v-else class="divide-y divide-slate-600">
          <div
            v-for="game in games.data"
            :key="game.id"
            class="lg:grid lg:grid-cols-8 gap-4 px-6 py-4 hover:bg-slate-750 transition-colors group"
          >
            <!-- ID -->
            <div class="flex items-center">
              <span class="text-sm font-medium text-slate-300">#{{ game.id }}</span>
            </div>

            <!-- Joueurs -->
            <div class="lg:mt-0 mt-2">
              <div class="text-sm text-white font-medium">{{ game.user.username }}</div>
              <div class="text-xs text-slate-400">
                vs {{ game.opponent ? game.opponent.username : 'IA/Bot' }}
              </div>
            </div>

            <!-- Type / Points -->
            <div class="lg:mt-0 mt-2">
              <div class="text-sm text-white">{{ formatGameType(game.gameType) }}</div>
              <div class="text-xs text-slate-400">{{ game.pointsLimit }} pts</div>
            </div>

            <!-- Statut -->
            <div class="lg:mt-0 mt-2">
              <span :class="getStatusClasses(game.status)">
                {{ formatStatus(game.status) }}
              </span>
            </div>

            <!-- Score -->
            <div class="lg:mt-0 mt-2">
              <div v-if="game.status === 'COMPLETED'" class="text-sm text-white">
                {{ game.playerScore }} - {{ game.opponentScore }}
              </div>
              <div v-else class="text-sm text-slate-400">-</div>
            </div>

            <!-- Mission -->
            <div class="lg:mt-0 mt-2">
              <div class="text-sm text-slate-300">{{ game.mission || 'Non définie' }}</div>
              <div class="text-xs text-slate-400">{{ game.deployment || '' }}</div>
            </div>

            <!-- Date création -->
            <div class="lg:mt-0 mt-2">
              <div class="text-sm text-slate-300">{{ game.createdAt }}</div>
            </div>

            <!-- Actions -->
            <div class="lg:mt-0 mt-2 lg:text-right">
              <div class="flex lg:justify-end gap-2">
                <Link
                  :href="`/admin/parties/${game.id}`"
                  class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-slate-600 text-white hover:bg-slate-500 transition-colors"
                >
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Voir
                </Link>

                <button
                  v-if="game.status !== 'CANCELLED'"
                  @click="cancelGame(game)"
                  class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="games.meta.lastPage > 1"
          class="px-6 py-4 bg-slate-750 border-t border-slate-600"
        >
          <div class="flex items-center justify-between">
            <div class="text-sm text-slate-400">
              Affichage {{ games.meta.from || 0 }}-{{ games.meta.to || 0 }} de
              {{ games.meta.total }} résultats
            </div>
            <div class="flex items-center gap-2">
              <Link
                v-if="games.meta.currentPage > 1"
                :href="games.meta.prevPageUrl || '#'"
                class="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-500 rounded-lg text-white transition-colors"
              >
                Précédent
              </Link>
              <span class="px-3 py-2 text-sm text-slate-300">
                Page {{ games.meta.currentPage }} sur {{ games.meta.lastPage }}
              </span>
              <Link
                v-if="games.meta.currentPage < games.meta.lastPage"
                :href="games.meta.nextPageUrl || '#'"
                class="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-500 rounded-lg text-white transition-colors"
              >
                Suivant
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modale de confirmation d'annulation -->
    <ConfirmCancelModal
      v-if="showCancelModal"
      :game="selectedGame"
      @confirm="handleCancelConfirm"
      @cancel="showCancelModal = false"
    />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import AdminLayout from '~/pages/admin/components/AdminLayout.vue'
import PartieStatsCards from './components/PartieStatsCards.vue'
import ConfirmCancelModal from './components/ConfirmCancelModal.vue'

interface Props {
  user: any
  games: {
    data: any[]
    meta: any
  }
  filters: {
    status: string
    gameType: string
    search: string
  }
  stats: {
    total: number
    active: number
    completed: number
    cancelled: number
  }
  breadcrumbItems: Array<{ label: string; href?: string }>
}

const props = defineProps<Props>()

const loading = ref(false)
const showCancelModal = ref(false)
const selectedGame = ref<any>(null)

const searchForm = reactive({
  search: props.filters.search || '',
  status: props.filters.status || '',
  gameType: props.filters.gameType || '',
})

let debounceTimeout: NodeJS.Timeout | null = null

const debounceSearch = () => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  debounceTimeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

const applyFilters = () => {
  loading.value = true
  router.get('/admin/parties', searchForm, {
    preserveState: true,
    preserveScroll: true,
    onFinish: () => {
      loading.value = false
    },
  })
}

const refreshStats = async () => {
  loading.value = true
  router.reload({
    onFinish: () => {
      loading.value = false
    },
  })
}

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
  const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium'
  const variants = {
    PLANNED: `${base} bg-blue-100 text-blue-800`,
    IN_PROGRESS: `${base} bg-yellow-100 text-yellow-800`,
    COMPLETED: `${base} bg-green-100 text-green-800`,
    CANCELLED: `${base} bg-red-100 text-red-800`,
  }
  return variants[status as keyof typeof variants] || `${base} bg-gray-100 text-gray-800`
}

const cancelGame = (game: any) => {
  selectedGame.value = game
  showCancelModal.value = true
}

const handleCancelConfirm = async () => {
  if (!selectedGame.value) return

  try {
    await router.delete(`/admin/parties/${selectedGame.value.id}`, {
      onSuccess: () => {
        showCancelModal.value = false
        selectedGame.value = null
      },
      onError: (errors) => {
        console.error("Erreur lors de l'annulation:", errors)
      },
    })
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error)
  }
}
</script>
