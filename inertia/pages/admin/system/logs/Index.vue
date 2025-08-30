<template>
  <div class="min-h-screen bg-stone-900 text-stone-100">
    <!-- Header -->
    <div class="border-b border-red-800/50 bg-stone-800 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-red-500">Logs Système</h1>
          <p class="text-stone-300 text-sm mt-1">
            Monitoring et analyse des logs - Accès Super Administrateur
          </p>
        </div>

        <div class="flex items-center gap-4">
          <!-- Quick stats -->
          <div class="flex items-center gap-6 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-red-500 rounded-full"></div>
              <span class="text-stone-300">{{ stats.errorCount }} erreurs</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span class="text-stone-300">{{ stats.warningCount }} avertissements</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span class="text-stone-300">{{ stats.totalLogs }} logs (7j)</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              @click="exportLogs"
              :disabled="exporting"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg text-sm font-medium"
            >
              {{ exporting ? 'Export...' : 'Export CSV' }}
            </button>

            <button
              @click="showCleanupModal = true"
              class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium"
            >
              Nettoyage
            </button>

            <button
              @click="showTestLogModal = true"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
            >
              Test Log
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-stone-800/50 px-6 py-4 border-b border-stone-700">
      <div class="flex flex-wrap gap-4 items-end">
        <!-- Search -->
        <div class="flex-1 min-w-64">
          <label class="block text-stone-300 text-sm font-medium mb-2">Recherche</label>
          <input
            v-model="searchFilters.search"
            @keyup.enter="applyFilters"
            type="text"
            placeholder="Rechercher dans les messages..."
            class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
          />
        </div>

        <!-- Level filter -->
        <div>
          <label class="block text-stone-300 text-sm font-medium mb-2">Niveau</label>
          <select
            v-model="searchFilters.level"
            @change="applyFilters"
            class="bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
          >
            <option value="">Tous les niveaux</option>
            <option value="ERROR">Erreur</option>
            <option value="WARNING">Avertissement</option>
            <option value="INFO">Information</option>
            <option value="DEBUG">Debug</option>
          </select>
        </div>

        <!-- Category filter -->
        <div>
          <label class="block text-stone-300 text-sm font-medium mb-2">Catégorie</label>
          <select
            v-model="searchFilters.category"
            @change="applyFilters"
            class="bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
          >
            <option value="">Toutes les catégories</option>
            <option value="SYSTEM">Système</option>
            <option value="SECURITY">Sécurité</option>
            <option value="USER_ACTION">Action utilisateur</option>
            <option value="PERFORMANCE">Performance</option>
          </select>
        </div>

        <!-- User filter -->
        <div>
          <label class="block text-stone-300 text-sm font-medium mb-2">Utilisateur</label>
          <select
            v-model="searchFilters.user_id"
            @change="applyFilters"
            class="bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
          >
            <option value="">Tous les utilisateurs</option>
            <option v-for="user in logUsers" :key="user.id" :value="user.id">
              {{ user.username }}
            </option>
          </select>
        </div>

        <!-- Date range -->
        <div>
          <label class="block text-stone-300 text-sm font-medium mb-2">Date début</label>
          <input
            v-model="searchFilters.start_date"
            @change="applyFilters"
            type="date"
            class="bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
          />
        </div>

        <div>
          <label class="block text-stone-300 text-sm font-medium mb-2">Date fin</label>
          <input
            v-model="searchFilters.end_date"
            @change="applyFilters"
            type="date"
            class="bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
          />
        </div>

        <!-- Clear filters -->
        <button
          @click="clearFilters"
          class="px-4 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded-lg text-sm font-medium"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div class="p-6">
      <!-- Statistics cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-stone-800 border border-red-800/50 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-stone-300 text-sm">Erreurs critiques</p>
              <p class="text-2xl font-bold text-red-400 mt-1">{{ stats.criticalCount }}</p>
            </div>
            <div class="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center">
              <svg
                class="w-4 h-4 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-stone-800 border border-red-800/50 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-stone-300 text-sm">Erreurs (7j)</p>
              <p class="text-2xl font-bold text-red-400 mt-1">{{ stats.errorCount }}</p>
            </div>
            <div class="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center">
              <svg
                class="w-4 h-4 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-stone-800 border border-red-800/50 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-stone-300 text-sm">Avertissements (7j)</p>
              <p class="text-2xl font-bold text-yellow-400 mt-1">{{ stats.warningCount }}</p>
            </div>
            <div class="w-8 h-8 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <svg
                class="w-4 h-4 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-stone-800 border border-red-800/50 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-stone-300 text-sm">Total logs (7j)</p>
              <p class="text-2xl font-bold text-blue-400 mt-1">
                {{ stats.totalLogs.toLocaleString() }}
              </p>
            </div>
            <div class="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg
                class="w-4 h-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent errors -->
      <div v-if="stats.recentErrors && stats.recentErrors.length > 0" class="mb-6">
        <h3 class="text-lg font-medium text-stone-100 mb-3">Erreurs récentes</h3>
        <div class="space-y-2">
          <div
            v-for="error in stats.recentErrors.slice(0, 5)"
            :key="error.id"
            class="bg-red-900/20 border border-red-800/50 rounded-lg p-3"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-red-400 text-xs font-medium">{{ error.level }}</span>
                  <span class="text-stone-400 text-xs">{{ error.category }}</span>
                  <span class="text-stone-500 text-xs">{{ formatDate(error.createdAt) }}</span>
                </div>
                <p class="text-stone-200 text-sm">{{ error.message }}</p>
                <p v-if="error.user" class="text-stone-400 text-xs mt-1">
                  Utilisateur: {{ error.user.username }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Logs table -->
      <div class="bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-stone-700">
              <tr>
                <th class="px-4 py-3 text-left text-stone-300 text-sm font-medium">Niveau</th>
                <th class="px-4 py-3 text-left text-stone-300 text-sm font-medium">Catégorie</th>
                <th class="px-4 py-3 text-left text-stone-300 text-sm font-medium">Message</th>
                <th class="px-4 py-3 text-left text-stone-300 text-sm font-medium">Utilisateur</th>
                <th class="px-4 py-3 text-left text-stone-300 text-sm font-medium">Date</th>
                <th class="px-4 py-3 text-left text-stone-300 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="log in logs"
                :key="log.id"
                class="border-t border-stone-700 hover:bg-stone-700/50"
                :class="getLogRowClass(log.level)"
              >
                <td class="px-4 py-3">
                  <span
                    :class="getLevelBadgeClass(log.level)"
                    class="px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ log.levelDisplayName }}
                  </span>
                </td>

                <td class="px-4 py-3">
                  <span class="text-stone-300 text-sm">{{ log.categoryDisplayName }}</span>
                </td>

                <td class="px-4 py-3">
                  <p class="text-stone-200 text-sm truncate max-w-md">{{ log.message }}</p>
                  <p v-if="log.eventType" class="text-stone-400 text-xs">{{ log.eventType }}</p>
                </td>

                <td class="px-4 py-3">
                  <span v-if="log.user" class="text-stone-300 text-sm">{{
                    log.user.username
                  }}</span>
                  <span v-else class="text-stone-500 text-sm">Système</span>
                </td>

                <td class="px-4 py-3">
                  <span class="text-stone-300 text-sm">{{ formatDate(log.createdAt) }}</span>
                  <p v-if="log.clientIp" class="text-stone-500 text-xs">{{ log.clientIp }}</p>
                </td>

                <td class="px-4 py-3">
                  <button
                    @click="viewLogDetails(log)"
                    class="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Détails
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="hasMoreLogs" class="bg-stone-700 px-4 py-3 flex justify-center">
          <button
            @click="loadMoreLogs"
            :disabled="loadingMore"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg text-sm font-medium"
          >
            {{ loadingMore ? 'Chargement...' : 'Charger plus' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cleanup Modal -->
    <div
      v-if="showCleanupModal"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <div class="bg-stone-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-xl font-semibold text-stone-100 mb-4">Nettoyage des logs</h3>

        <div class="mb-4">
          <label class="block text-stone-300 text-sm font-medium mb-2">
            Conserver les logs des derniers (jours)
          </label>
          <input
            v-model.number="cleanupForm.retention_days"
            type="number"
            min="1"
            max="365"
            class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
          />
          <p class="text-stone-400 text-xs mt-1">
            Les logs antérieurs à cette période seront supprimés définitivement.
          </p>
        </div>

        <div class="flex gap-4">
          <button
            @click="cleanupLogs"
            :disabled="saving"
            class="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white px-4 py-2 rounded-lg font-medium"
          >
            {{ saving ? 'Nettoyage...' : 'Confirmer' }}
          </button>
          <button
            @click="showCleanupModal = false"
            class="flex-1 bg-stone-600 hover:bg-stone-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Test Log Modal -->
    <div
      v-if="showTestLogModal"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <div class="bg-stone-800 rounded-lg p-6 w-full max-w-lg mx-4">
        <h3 class="text-xl font-semibold text-stone-100 mb-4">Créer un log de test</h3>

        <form @submit.prevent="createTestLog" class="space-y-4">
          <div>
            <label class="block text-stone-300 text-sm font-medium mb-2">Niveau</label>
            <select
              v-model="testLogForm.level"
              class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
            >
              <option value="ERROR">Erreur</option>
              <option value="WARNING">Avertissement</option>
              <option value="INFO">Information</option>
              <option value="DEBUG">Debug</option>
            </select>
          </div>

          <div>
            <label class="block text-stone-300 text-sm font-medium mb-2">Catégorie</label>
            <select
              v-model="testLogForm.category"
              class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
            >
              <option value="SYSTEM">Système</option>
              <option value="SECURITY">Sécurité</option>
              <option value="USER_ACTION">Action utilisateur</option>
              <option value="PERFORMANCE">Performance</option>
            </select>
          </div>

          <div>
            <label class="block text-stone-300 text-sm font-medium mb-2">Type d'événement</label>
            <input
              v-model="testLogForm.event_type"
              type="text"
              required
              class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
              placeholder="TEST_EVENT"
            />
          </div>

          <div>
            <label class="block text-stone-300 text-sm font-medium mb-2">Message</label>
            <textarea
              v-model="testLogForm.message"
              required
              class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
              rows="3"
              placeholder="Message du log de test..."
            ></textarea>
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-4 py-2 rounded-lg font-medium"
            >
              {{ saving ? 'Création...' : 'Créer log' }}
            </button>
            <button
              type="button"
              @click="showTestLogModal = false"
              class="flex-1 bg-stone-600 hover:bg-stone-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { router } from '@inertiajs/vue3'

interface User {
  id: number
  username: string
  fullName: string | null
}

interface SystemLog {
  id: number
  level: string
  levelDisplayName: string
  category: string
  categoryDisplayName: string
  eventType: string
  message: string
  context?: any
  metadata?: any
  userId?: number
  user?: User
  sessionId?: string
  clientIp?: string
  userAgent?: string
  requestId?: string
  responseTimeMs?: number
  memoryUsageMb?: number
  createdAt: string
}

interface LogStats {
  totalLogs: number
  errorCount: number
  warningCount: number
  infoCount: number
  debugCount: number
  criticalCount: number
  recentErrors: SystemLog[]
  topEventTypes: Array<{ eventType: string; count: number }>
  logsByCategory: Array<{ category: string; count: number }>
  logsByHour: Array<{ hour: number; count: number }>
}

// Props
const props = defineProps<{
  logs: SystemLog[]
  totalLogs: number
  hasMoreLogs: boolean
  stats: LogStats
  eventTypes: string[]
  logUsers: Array<{ id: number; username: string; fullName: string | null }>
  filters: any
  user: User
}>()

// Reactive state
const searchFilters = reactive({
  search: props.filters.search || '',
  level: props.filters.level || '',
  category: props.filters.category || '',
  user_id: props.filters.userId || '',
  start_date: props.filters.startDate || '',
  end_date: props.filters.endDate || '',
})

const showCleanupModal = ref(false)
const showTestLogModal = ref(false)
const saving = ref(false)
const loadingMore = ref(false)
const exporting = ref(false)

const cleanupForm = reactive({
  retention_days: 90,
})

const testLogForm = reactive({
  level: 'INFO',
  category: 'SYSTEM',
  event_type: 'TEST_EVENT',
  message: "Ceci est un log de test créé depuis l'interface admin.",
})

// Methods
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getLevelBadgeClass = (level: string) => {
  const classes = {
    ERROR: 'bg-red-600 text-white',
    WARNING: 'bg-yellow-600 text-white',
    INFO: 'bg-blue-600 text-white',
    DEBUG: 'bg-gray-600 text-white',
  }
  return classes[level as keyof typeof classes] || 'bg-gray-600 text-white'
}

const getLogRowClass = (level: string) => {
  const classes = {
    ERROR: 'border-l-4 border-l-red-500',
    WARNING: 'border-l-4 border-l-yellow-500',
    INFO: '',
    DEBUG: 'opacity-75',
  }
  return classes[level as keyof typeof classes] || ''
}

const applyFilters = () => {
  const params = new URLSearchParams()

  Object.entries(searchFilters).forEach(([key, value]) => {
    if (value) {
      params.set(key, String(value))
    }
  })

  router.get(
    `/admin/system/logs?${params.toString()}`,
    {},
    {
      preserveState: true,
      replace: true,
    }
  )
}

const clearFilters = () => {
  Object.assign(searchFilters, {
    search: '',
    level: '',
    category: '',
    user_id: '',
    start_date: '',
    end_date: '',
  })

  router.get(
    '/admin/system/logs',
    {},
    {
      preserveState: true,
      replace: true,
    }
  )
}

const loadMoreLogs = () => {
  loadingMore.value = true

  const params = new URLSearchParams(window.location.search)
  const currentOffset = parseInt(params.get('offset') || '0')
  const limit = parseInt(params.get('limit') || '50')

  params.set('offset', String(currentOffset + limit))

  router.get(
    `/admin/system/logs?${params.toString()}`,
    {},
    {
      preserveState: true,
      only: ['logs', 'hasMoreLogs'],
      onFinish: () => {
        loadingMore.value = false
      },
    }
  )
}

const exportLogs = () => {
  exporting.value = true

  const params = new URLSearchParams()
  Object.entries(searchFilters).forEach(([key, value]) => {
    if (value) {
      params.set(key, String(value))
    }
  })

  // Create a temporary link to download the CSV
  const link = document.createElement('a')
  link.href = `/admin/system/logs/export?${params.toString()}`
  link.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => {
    exporting.value = false
  }, 1000)
}

const cleanupLogs = () => {
  if (
    !confirm(
      `Êtes-vous sûr de vouloir supprimer les logs antérieurs à ${cleanupForm.retention_days} jours ?`
    )
  ) {
    return
  }

  saving.value = true

  router.post(
    '/admin/system/logs/cleanup',
    {
      retention_days: cleanupForm.retention_days,
      confirm: true,
    },
    {
      onFinish: () => {
        saving.value = false
        showCleanupModal.value = false
      },
    }
  )
}

const createTestLog = () => {
  saving.value = true

  router.post('/admin/system/logs/test', testLogForm, {
    onFinish: () => {
      saving.value = false
      showTestLogModal.value = false
    },
  })
}

const viewLogDetails = (log: SystemLog) => {
  // TODO: Implement log details modal
  const details = {
    'ID': log.id,
    'Niveau': log.levelDisplayName,
    'Catégorie': log.categoryDisplayName,
    'Type': log.eventType,
    'Message': log.message,
    'Utilisateur': log.user?.username || 'Système',
    'IP': log.clientIp || 'N/A',
    'Session': log.sessionId || 'N/A',
    'Temps de réponse': log.responseTimeMs ? `${log.responseTimeMs}ms` : 'N/A',
    'Mémoire': log.memoryUsageMb ? `${log.memoryUsageMb}MB` : 'N/A',
    'Date': formatDate(log.createdAt),
    'Contexte': log.context ? JSON.stringify(log.context, null, 2) : 'N/A',
    'Métadonnées': log.metadata ? JSON.stringify(log.metadata, null, 2) : 'N/A',
  }

  let detailsText = 'Détails du log:\n\n'
  Object.entries(details).forEach(([key, value]) => {
    detailsText += `${key}: ${value}\n`
  })

  alert(detailsText)
}
</script>

<style scoped>
/* Custom styles for better UX */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
