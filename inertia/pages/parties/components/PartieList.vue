<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PartieUI } from '../types'
import PartieCard from './PartieCard.vue'
import EmptyState from './EmptyState.vue'

interface Props {
  parties: PartieUI[]
  loading?: boolean
  canLoadMore?: boolean
  empty?: boolean
}

interface Emits {
  (e: 'view-details', partieId: string): void
  (e: 'load-more'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isLoadingMore = ref(false)

const groupedParties = computed(() => {
  const groups: Record<string, PartieUI[]> = {
    'EN_COURS': [],
    'PLANIFIEES': [],
    'TERMINEES': [],
    'ANNULEES': [],
  }

  props.parties.forEach(partie => {
    switch (partie.status) {
      case 'IN_PROGRESS':
        groups.EN_COURS.push(partie)
        break
      case 'PLANNED':
        groups.PLANIFIEES.push(partie)
        break
      case 'COMPLETED':
        groups.TERMINEES.push(partie)
        break
      case 'CANCELLED':
        groups.ANNULEES.push(partie)
        break
    }
  })

  return groups
})

const hasPartiesInGroups = computed(() => {
  return Object.values(groupedParties.value).some(group => group.length > 0)
})

const handleViewDetails = (partieId: string) => {
  emit('view-details', partieId)
}

const handleLoadMore = async () => {
  if (!props.canLoadMore || isLoadingMore.value) return
  
  isLoadingMore.value = true
  emit('load-more')
  
  // Reset loading state after a short delay
  setTimeout(() => {
    isLoadingMore.value = false
  }, 1000)
}
</script>

<template>
  <div class="partie-list">
    <!-- État vide -->
    <EmptyState v-if="empty && !loading" />

    <!-- Liste des parties groupées -->
    <div v-else-if="hasPartiesInGroups" class="space-y-8">
      <!-- Parties en cours -->
      <section v-if="groupedParties.EN_COURS.length > 0" class="partie-group">
        <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
          <div class="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
          Parties en cours
          <span class="ml-2 text-sm text-blue-400">({{ groupedParties.EN_COURS.length }})</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <PartieCard
            v-for="partie in groupedParties.EN_COURS"
            :key="partie.id"
            :partie="partie"
            @view-details="handleViewDetails"
          />
        </div>
      </section>

      <!-- Parties planifiées -->
      <section v-if="groupedParties.PLANIFIEES.length > 0" class="partie-group">
        <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
          <div class="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
          Parties planifiées
          <span class="ml-2 text-sm text-gray-400">({{ groupedParties.PLANIFIEES.length }})</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <PartieCard
            v-for="partie in groupedParties.PLANIFIEES"
            :key="partie.id"
            :partie="partie"
            @view-details="handleViewDetails"
          />
        </div>
      </section>

      <!-- Parties terminées -->
      <section v-if="groupedParties.TERMINEES.length > 0" class="partie-group">
        <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
          <div class="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
          Parties terminées
          <span class="ml-2 text-sm text-green-400">({{ groupedParties.TERMINEES.length }})</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <PartieCard
            v-for="partie in groupedParties.TERMINEES"
            :key="partie.id"
            :partie="partie"
            @view-details="handleViewDetails"
          />
        </div>
      </section>

      <!-- Parties annulées -->
      <section v-if="groupedParties.ANNULEES.length > 0" class="partie-group">
        <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
          <div class="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
          Parties annulées
          <span class="ml-2 text-sm text-red-400">({{ groupedParties.ANNULEES.length }})</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <PartieCard
            v-for="partie in groupedParties.ANNULEES"
            :key="partie.id"
            :partie="partie"
            @view-details="handleViewDetails"
          />
        </div>
      </section>
    </div>

    <!-- Bouton "Charger plus" -->
    <div v-if="canLoadMore && hasPartiesInGroups" class="mt-8 text-center">
      <button
        @click="handleLoadMore"
        :disabled="loading || isLoadingMore"
        class="inline-flex items-center px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black"
      >
        <svg 
          v-if="loading || isLoadingMore" 
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-300" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg 
          v-else 
          class="w-5 h-5 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        {{ loading || isLoadingMore ? 'Chargement...' : 'Charger plus de parties' }}
      </button>
    </div>

    <!-- Loading skeleton pour le chargement initial -->
    <div v-if="loading && !hasPartiesInGroups" class="space-y-6">
      <div v-for="i in 6" :key="i" class="animate-pulse">
        <div class="bg-gray-800 rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="h-4 bg-gray-700 rounded w-1/4"></div>
            <div class="h-6 bg-gray-700 rounded w-20"></div>
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-700 rounded w-3/4"></div>
            <div class="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
          <div class="flex justify-between mt-4">
            <div class="h-8 bg-gray-700 rounded w-24"></div>
            <div class="h-8 bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.partie-group {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger animation pour les cartes */
.partie-group .grid > * {
  animation: slideInUp 0.3s ease-out;
}

.partie-group .grid > :nth-child(1) { animation-delay: 0.1s; }
.partie-group .grid > :nth-child(2) { animation-delay: 0.2s; }
.partie-group .grid > :nth-child(3) { animation-delay: 0.3s; }
.partie-group .grid > :nth-child(4) { animation-delay: 0.4s; }
.partie-group .grid > :nth-child(5) { animation-delay: 0.5s; }
.partie-group .grid > :nth-child(6) { animation-delay: 0.6s; }
</style>