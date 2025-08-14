<script setup lang="ts">
interface Props {
  partiesCount: number
  totalCount?: number
  activeFiltersCount: number
}

interface Emits {
  (e: 'create-new'): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleCreateNew = () => emit('create-new')
const handleRefresh = () => emit('refresh')
</script>

<template>
  <header class="bg-gradient-to-r from-red-900/20 to-yellow-900/20 border-b border-red-500/30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <!-- Titre et statistiques -->
        <div class="mb-4 sm:mb-0">
          <h1 class="text-3xl font-bold text-white flex items-center">
            <span class="text-red-400">Mes</span>
            <span class="text-yellow-400 ml-2">Parties</span>

            <!-- Badge compteur -->
            <span
              class="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600/20 text-red-300 border border-red-500/30"
            >
              {{ partiesCount }}
              {{ partiesCount > 1 ? 'parties' : 'partie' }}
            </span>

            <!-- Badge filtres actifs -->
            <Transition name="filter-badge">
              <span
                v-if="activeFiltersCount > 0"
                class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30"
              >
                {{ activeFiltersCount }} filtre{{ activeFiltersCount > 1 ? 's' : '' }}
              </span>
            </Transition>
          </h1>

          <p class="mt-2 text-gray-300">
            Gérez vos parties de Warhammer 40,000 et suivez vos performances
            <span v-if="totalCount && totalCount !== partiesCount" class="text-yellow-400">
              ({{ partiesCount }} sur {{ totalCount }})
            </span>
          </p>
        </div>

        <!-- Actions principales -->
        <div class="flex items-center space-x-3">
          <!-- Bouton Rafraîchir -->
          <button
            @click="handleRefresh"
            class="inline-flex items-center px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black"
            title="Rafraîchir la liste"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Rafraîchir
          </button>

          <!-- Bouton Nouvelle Partie -->
          <button
            @click="handleCreateNew"
            class="inline-flex items-center px-6 py-2 bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black shadow-lg"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Nouvelle Partie
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Animations pour les badges */
.filter-badge-enter-active,
.filter-badge-leave-active {
  transition: all 0.2s ease;
}

.filter-badge-enter-from,
.filter-badge-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Animation hover sur le bouton principal */
.hover\:scale-105:hover {
  transform: scale(1.05);
}
</style>
