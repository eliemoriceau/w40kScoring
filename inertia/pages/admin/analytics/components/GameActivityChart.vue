<template>
  <div class="space-y-6">
    <!-- Métriques rapides -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-white">{{ data.totalGames }}</div>
        <div class="text-xs text-slate-400">Total parties</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-400">{{ completedCount }}</div>
        <div class="text-xs text-slate-400">Terminées</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-yellow-400">{{ inProgressCount }}</div>
        <div class="text-xs text-slate-400">En cours</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-400">{{ data.averageScorePerRound }}</div>
        <div class="text-xs text-slate-400">Score/round moy.</div>
      </div>
    </div>

    <!-- Graphique de statuts -->
    <div class="space-y-4">
      <div class="text-sm font-medium text-slate-300">Répartition par statut</div>
      <div class="space-y-3">
        <div 
          v-for="(count, status) in data.gamesByStatus" 
          :key="status"
          class="flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div :class="getStatusColor(status)" class="w-3 h-3 rounded-full"></div>
            <span class="text-slate-300 text-sm">{{ formatStatus(status) }}</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-white font-medium">{{ count }}</div>
            <div class="flex-1 w-32">
              <div class="bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  :class="getStatusColor(status)"
                  :style="{ width: `${getPercentage(count)}%` }"
                  class="h-full rounded-full transition-all duration-300"
                ></div>
              </div>
            </div>
            <div class="text-slate-400 text-sm w-12 text-right">
              {{ getPercentage(count) }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Durée moyenne -->
    <div class="bg-slate-700 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-slate-300">Durée moyenne des parties</span>
        </div>
        <div class="text-cyan-400 font-bold text-lg">{{ data.averageGameDuration }}</div>
      </div>
    </div>

    <!-- Performance insights -->
    <div class="bg-slate-700 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <div>
          <div class="text-slate-200 font-medium mb-2">Insights d'activité</div>
          <div class="text-sm text-slate-300 space-y-1">
            <div>• {{ getCompletionRate() }}% des parties sont menées à terme</div>
            <div>• Score moyen par round: {{ data.averageScorePerRound }} points</div>
            <div>• Durée moyenne: {{ data.averageGameDuration }}</div>
            <div v-if="getMostActiveStatus()">
              • Statut dominant: {{ formatStatus(getMostActiveStatus()) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Graphique en barres horizontal pour les statuts -->
    <div class="space-y-4">
      <div class="text-sm font-medium text-slate-300">Visualisation des statuts</div>
      <div class="bg-slate-700 rounded-lg p-4">
        <div class="flex items-end gap-2 h-32">
          <div 
            v-for="(count, status) in data.gamesByStatus"
            :key="status"
            class="flex flex-col items-center flex-1"
          >
            <div
              :style="{ height: `${getBarHeight(count)}%` }"
              :class="getStatusBarColor(status)"
              class="w-full rounded-t-sm mb-2 transition-all duration-300 hover:opacity-80"
              :title="`${formatStatus(status)}: ${count} parties`"
            ></div>
            <div class="text-xs text-slate-400 text-center">
              {{ getStatusShortName(status) }}
            </div>
            <div class="text-sm font-medium text-white">{{ count }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: {
    totalGames: number
    averageGameDuration: string
    gamesByStatus: Record<string, number>
    averageScorePerRound: number
  }
}

const props = defineProps<Props>()

const completedCount = computed(() => props.data.gamesByStatus.COMPLETED || 0)
const inProgressCount = computed(() => props.data.gamesByStatus.IN_PROGRESS || 0)

const getStatusColor = (status: string) => {
  const colors = {
    PLANNED: 'bg-blue-400',
    IN_PROGRESS: 'bg-yellow-400',
    COMPLETED: 'bg-green-400',
    CANCELLED: 'bg-red-400'
  }
  return colors[status as keyof typeof colors] || 'bg-slate-400'
}

const getStatusBarColor = (status: string) => {
  const colors = {
    PLANNED: 'bg-blue-500',
    IN_PROGRESS: 'bg-yellow-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-500'
  }
  return colors[status as keyof typeof colors] || 'bg-slate-500'
}

const formatStatus = (status: string) => {
  const statuses = {
    PLANNED: 'Planifiées',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminées',
    CANCELLED: 'Annulées'
  }
  return statuses[status as keyof typeof statuses] || status
}

const getStatusShortName = (status: string) => {
  const shortNames = {
    PLANNED: 'Plan.',
    IN_PROGRESS: 'Cours',
    COMPLETED: 'Term.',
    CANCELLED: 'Ann.'
  }
  return shortNames[status as keyof typeof shortNames] || status
}

const getPercentage = (count: number) => {
  if (props.data.totalGames === 0) return 0
  return Math.round((count / props.data.totalGames) * 100)
}

const getBarHeight = (count: number) => {
  if (props.data.totalGames === 0) return 10
  const maxCount = Math.max(...Object.values(props.data.gamesByStatus))
  if (maxCount === 0) return 10
  return Math.max(10, (count / maxCount) * 100)
}

const getCompletionRate = () => {
  return getPercentage(completedCount.value)
}

const getMostActiveStatus = () => {
  let maxCount = 0
  let mostActiveStatus = ''
  
  for (const [status, count] of Object.entries(props.data.gamesByStatus)) {
    if (count > maxCount) {
      maxCount = count
      mostActiveStatus = status
    }
  }
  
  return mostActiveStatus
}
</script>