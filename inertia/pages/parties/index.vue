<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { router, usePage } from '@inertiajs/vue3'
import { usePartiesHelpers } from './composables/usePartiesHelpers'
import type { PartiesIndexProps, PartiesFilters, LoadingState } from './types'

// Import des composants
import PartieHeader from './components/PartieHeader.vue'
import PartieFilters from './components/PartieFilters.vue'
import PartieList from './components/PartieList.vue'
import LoadingSpinner from '~/shared/components/LoadingSpinner.vue'

// Props Inertia (typées)
const props = defineProps<PartiesIndexProps>()

// État réactif local
const loading = ref<LoadingState>({
  loading: false,
  error: null,
})

const filters = ref<PartiesFilters>({
  status: props.filters.current.status,
  gameType: props.filters.current.gameType,
  search: '',
})

// Composables et helpers
const { enrichParties, getStatusColor, getStatusLabel, formatPlayersText } = usePartiesHelpers()

// Computed properties
const enrichedParties = computed(() => {
  return enrichParties(props.parties.parties)
})

const hasParties = computed(() => props.parties.parties.length > 0)

const isEmpty = computed(() => !hasParties.value && !loading.value.loading && !loading.value.error)

const canLoadMore = computed(() => props.parties.pagination.hasMore && !loading.value.loading)

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.status) count++
  if (filters.value.gameType) count++
  if (filters.value.search?.trim()) count++
  return count
})

// Event handlers
const handleFilterChange = (newFilters: PartiesFilters) => {
  filters.value = { ...newFilters }
  applyFilters()
}

const handleClearFilters = () => {
  filters.value = { status: undefined, gameType: undefined, search: '' }
  applyFilters()
}

const applyFilters = () => {
  loading.value = { loading: true, error: null, operation: 'filter' }

  // Construire les paramètres pour Inertia
  const params = Object.fromEntries(
    Object.entries(filters.value).filter(([_, value]) => value && value.trim())
  )

  router.get(route('parties.index'), params, {
    preserveState: true,
    preserveScroll: true,
    onFinish: () => {
      loading.value = { loading: false, error: null }
    },
    onError: (errors) => {
      loading.value = {
        loading: false,
        error: 'Erreur lors du filtrage des parties',
      }
      console.error('Filter error:', errors)
    },
  })
}

const handleViewDetails = (partieId: string) => {
  // Navigation vers la page de détails
  router.visit(route('partie.show', { id: partieId }))
}

const handleCreateNew = () => {
  router.visit(route('partie.create'))
}

const handleLoadMore = () => {
  if (!canLoadMore.value) return

  loading.value = { loading: true, error: null, operation: 'pagination' }

  router.get(
    route('parties.index'),
    {
      ...filters.value,
      cursor: props.parties.pagination.nextCursor,
    },
    {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => {
        loading.value = { loading: false, error: null }
      },
      onError: () => {
        loading.value = {
          loading: false,
          error: 'Erreur lors du chargement des parties supplémentaires',
        }
      },
    }
  )
}

const handleRefresh = () => {
  loading.value = { loading: true, error: null, operation: 'refresh' }

  router.reload({
    only: ['parties'],
    onFinish: () => {
      loading.value = { loading: false, error: null }
    },
    onError: () => {
      loading.value = {
        loading: false,
        error: 'Erreur lors du rafraîchissement',
      }
    },
  })
}

const dismissError = () => {
  loading.value.error = null
}

// Watchers pour debug (mode développement)
if (import.meta.env.DEV) {
  watch(
    () => props.parties,
    (newParties) => {
      console.log('Parties data updated:', {
        count: newParties.parties.length,
        hasMore: newParties.pagination.hasMore,
        filters: newParties.filters?.applied,
      })
    },
    { deep: true }
  )
}

// Lifecycle
onMounted(() => {
  console.log('Parties page mounted with', props.parties.parties.length, 'parties')
})
</script>

<script lang="ts">
import AppLayout from '~/Layouts/AppLayout.vue'

export default {
  layout: AppLayout,
}
</script>

<template>
  <div class="parties-page min-h-screen bg-black">
    <!-- Header avec titre et action principale -->
    <PartieHeader
      :parties-count="props.parties.parties.length"
      :total-count="props.parties.pagination.totalCount"
      :active-filters-count="activeFiltersCount"
      @create-new="handleCreateNew"
      @refresh="handleRefresh"
    />

    <!-- Contenu principal -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Barre de filtres -->
      <PartieFilters
        v-model:filters="filters"
        :available-filters="props.filters.available"
        :loading="loading.loading && loading.operation === 'filter'"
        @filter-change="handleFilterChange"
        @clear-filters="handleClearFilters"
      />

      <!-- Alerte d'erreur -->
      <div
        v-if="loading.error"
        class="mb-6 bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-center justify-between"
      >
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-red-200">{{ loading.error }}</span>
        </div>
        <button @click="dismissError" class="text-red-400 hover:text-red-300 transition-colors">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Loading spinner pour opérations globales -->
      <LoadingSpinner
        v-if="loading.loading && loading.operation === 'refresh'"
        class="my-12"
        text="Rafraîchissement des parties..."
      />

      <!-- Liste des parties -->
      <PartieList
        v-else
        :parties="enrichedParties"
        :loading="loading.loading && loading.operation === 'pagination'"
        :can-load-more="canLoadMore"
        :empty="isEmpty"
        @view-details="handleViewDetails"
        @load-more="handleLoadMore"
      />
    </main>
  </div>
</template>

<style scoped>
.parties-page {
  /* Thème W40K avec gradients sombres */
  background: linear-gradient(135deg, #000000 0%, #1a0000 50%, #000000 100%);
  min-height: 100vh;
}

/* Animation d'entrée pour les parties */
.parties-enter-active,
.parties-leave-active {
  transition: all 0.3s ease;
}

.parties-enter-from,
.parties-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Animation pour le compteur de filtres */
.filter-badge-enter-active,
.filter-badge-leave-active {
  transition: all 0.2s ease;
}

.filter-badge-enter-from,
.filter-badge-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
