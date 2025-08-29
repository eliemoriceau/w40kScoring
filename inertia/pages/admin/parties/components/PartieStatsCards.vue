<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Total des parties -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-300 text-sm font-medium">Total des parties</p>
          <p class="text-3xl font-bold text-white mt-2">{{ stats.total.toLocaleString() }}</p>
        </div>
        <div class="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
      </div>
      <div class="mt-4">
        <div class="text-xs text-slate-400">Toutes les parties de la plateforme</div>
      </div>
    </div>

    <!-- Parties actives -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-300 text-sm font-medium">En cours</p>
          <p class="text-3xl font-bold text-yellow-400 mt-2">{{ stats.active.toLocaleString() }}</p>
        </div>
        <div class="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
          <svg
            class="w-6 h-6 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
      <div class="mt-4">
        <div class="flex items-center">
          <div class="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
          <div class="text-xs text-slate-400">Parties actuellement jouées</div>
        </div>
      </div>
    </div>

    <!-- Parties terminées -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-300 text-sm font-medium">Terminées</p>
          <p class="text-3xl font-bold text-green-400 mt-2">
            {{ stats.completed.toLocaleString() }}
          </p>
        </div>
        <div class="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
      <div class="mt-4">
        <div class="text-xs text-slate-400">{{ completionRate }}% des parties totales</div>
      </div>
    </div>

    <!-- Parties annulées -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-300 text-sm font-medium">Annulées</p>
          <p class="text-3xl font-bold text-red-400 mt-2">{{ stats.cancelled.toLocaleString() }}</p>
        </div>
        <div class="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>
      <div class="mt-4">
        <div class="text-xs text-slate-400">{{ cancellationRate }}% du total</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  stats: {
    total: number
    active: number
    completed: number
    cancelled: number
  }
}

const props = defineProps<Props>()

const completionRate = computed(() => {
  if (props.stats.total === 0) return 0
  return Math.round((props.stats.completed / props.stats.total) * 100)
})

const cancellationRate = computed(() => {
  if (props.stats.total === 0) return 0
  return Math.round((props.stats.cancelled / props.stats.total) * 100)
})
</script>
