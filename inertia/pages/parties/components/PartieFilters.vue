<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { PartiesFilters } from '../types'

interface Props {
  filters: PartiesFilters
  availableFilters: {
    statuses: string[]
    gameTypes: string[]
  }
  loading?: boolean
}

interface Emits {
  (e: 'update:filters', filters: PartiesFilters): void
  (e: 'filter-change', filters: PartiesFilters): void
  (e: 'clear-filters'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// État local pour les filtres avec optimisation
const localFilters = ref<PartiesFilters>({ ...props.filters })
const searchDebounce = ref<NodeJS.Timeout>()
const isUpdating = ref(false)

// Labels pour les filtres
const statusLabels: Record<string, string> = {
  PLANNED: 'Planifiées',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminées',
  CANCELLED: 'Annulées',
}

const gameTypeLabels: Record<string, string> = {
  MATCHED_PLAY: 'Jeu Équilibré',
  NARRATIVE: 'Narratif',
  OPEN_PLAY: 'Jeu Libre',
}

// Watchers optimisés pour éviter les cycles de rerender
watch(
  () => props.filters,
  (newFilters) => {
    if (!isUpdating.value) {
      localFilters.value = { ...newFilters }
    }
  },
  { deep: true }
)

watch(
  localFilters,
  async (newFilters, oldFilters) => {
    // Éviter les cycles de mise à jour
    isUpdating.value = true

    // Émettre immédiatement la mise à jour des filtres
    emit('update:filters', newFilters)

    // Débounce optimisé selon le type de changement
    if (searchDebounce.value) {
      clearTimeout(searchDebounce.value)
    }

    // Si c'est un changement de recherche, debounce plus long
    const isSearchChange = newFilters.search !== oldFilters?.search
    const debounceTime = isSearchChange ? 400 : 100

    searchDebounce.value = setTimeout(async () => {
      emit('filter-change', newFilters)
      await nextTick()
      isUpdating.value = false
    }, debounceTime)
  },
  { deep: true }
)

// Handlers optimisés
const handleStatusChange = (status: string) => {
  const newStatus = localFilters.value.status === status ? undefined : status

  // Mise à jour atomique pour éviter les rerenders multiples
  localFilters.value = {
    ...localFilters.value,
    status: newStatus,
  }

  // Émission immédiate pour les filtres dropdown (pas de debounce)
  if (searchDebounce.value) {
    clearTimeout(searchDebounce.value)
  }

  // Émission directe sans passer par le watcher
  nextTick(() => {
    emit('filter-change', localFilters.value)
  })
}

const handleGameTypeChange = (gameType: string) => {
  const newGameType = localFilters.value.gameType === gameType ? undefined : gameType

  // Mise à jour atomique
  localFilters.value = {
    ...localFilters.value,
    gameType: newGameType,
  }

  // Émission immédiate pour les filtres dropdown
  if (searchDebounce.value) {
    clearTimeout(searchDebounce.value)
  }

  // Émission directe
  nextTick(() => {
    emit('filter-change', localFilters.value)
  })
}

const handleClearAll = () => {
  // Clear avec mise à jour atomique
  const clearedFilters = { status: undefined, gameType: undefined, search: '' }
  localFilters.value = clearedFilters

  // Nettoyer le debounce et émettre immédiatement
  if (searchDebounce.value) {
    clearTimeout(searchDebounce.value)
  }

  emit('clear-filters')
}

const hasActiveFilters = () => {
  return !!(
    localFilters.value.status ||
    localFilters.value.gameType ||
    localFilters.value.search?.trim()
  )
}
</script>

<template>
  <div class="bg-black/40 rounded-lg border border-gray-700 p-4 mb-6">
    <div class="flex flex-col lg:flex-row lg:items-center gap-4">
      <!-- Recherche textuelle -->
      <div class="flex-1">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              class="h-5 w-5 text-gray-400"
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
          <input
            v-model="localFilters.search"
            type="text"
            placeholder="Rechercher par mission, notes..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            :disabled="loading"
          />
          <!-- Indicateur de chargement dans la recherche -->
          <div v-if="loading" class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg class="animate-spin h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24">
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
          </div>
        </div>
      </div>

      <!-- Filtres par statut -->
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-gray-300">Statut :</span>
        <div class="flex space-x-1">
          <button
            v-for="status in availableFilters.statuses"
            :key="status"
            @click="handleStatusChange(status)"
            :class="[
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              localFilters.status === status
                ? 'bg-blue-600 text-white border border-blue-500'
                : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600',
            ]"
            :disabled="loading"
          >
            {{ statusLabels[status] || status }}
          </button>
        </div>
      </div>

      <!-- Filtres par type de jeu -->
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-gray-300">Type :</span>
        <div class="flex space-x-1">
          <button
            v-for="gameType in availableFilters.gameTypes"
            :key="gameType"
            @click="handleGameTypeChange(gameType)"
            :class="[
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              localFilters.gameType === gameType
                ? 'bg-red-600 text-white border border-red-500'
                : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600',
            ]"
            :disabled="loading"
          >
            {{ gameTypeLabels[gameType] || gameType }}
          </button>
        </div>
      </div>

      <!-- Bouton effacer tous les filtres -->
      <button
        v-if="hasActiveFilters()"
        @click="handleClearAll"
        class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
        :disabled="loading"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        Effacer
      </button>
    </div>

    <!-- Indicateur de filtres actifs -->
    <div v-if="hasActiveFilters()" class="mt-3 flex items-center space-x-2">
      <span class="text-xs text-gray-400">Filtres actifs :</span>

      <div class="flex flex-wrap gap-2">
        <span
          v-if="localFilters.status"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-600/20 text-blue-300 border border-blue-500/30"
        >
          {{ statusLabels[localFilters.status] }}
          <button @click="localFilters.status = undefined" class="ml-1 hover:text-blue-100">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </span>

        <span
          v-if="localFilters.gameType"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-600/20 text-red-300 border border-red-500/30"
        >
          {{ gameTypeLabels[localFilters.gameType] }}
          <button @click="localFilters.gameType = undefined" class="ml-1 hover:text-red-100">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </span>

        <span
          v-if="localFilters.search?.trim()"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-600/20 text-yellow-300 border border-yellow-500/30"
        >
          "{{ localFilters.search.trim() }}"
          <button @click="localFilters.search = ''" class="ml-1 hover:text-yellow-100">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animation pour les filtres actifs */
.filter-tag-enter-active,
.filter-tag-leave-active {
  transition: all 0.2s ease;
}

.filter-tag-enter-from,
.filter-tag-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
