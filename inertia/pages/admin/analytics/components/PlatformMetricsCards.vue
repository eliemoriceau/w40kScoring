<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Utilisateurs actifs 24h -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-300 text-sm font-medium">Utilisateurs actifs (24h)</p>
          <p class="text-3xl font-bold text-blue-400 mt-2">
            <span v-if="loading">--</span>
            <span v-else>{{ metrics.activeUsers24h.toLocaleString() }}</span>
          </p>
        </div>
        <div class="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
      </div>
      <div class="mt-4">
        <div class="text-xs text-slate-400">En temps réel</div>
      </div>
    </div>

    <!-- Parties créées aujourd'hui -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-300 text-sm font-medium">Parties créées (aujourd'hui)</p>
          <p class="text-3xl font-bold text-green-400 mt-2">
            <span v-if="loading">--</span>
            <span v-else>{{ metrics.gamesCreatedToday.toLocaleString() }}</span>
          </p>
        </div>
        <div class="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
      </div>
      <div class="mt-4">
        <div class="flex items-center">
          <div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          <div class="text-xs text-slate-400">Nouvelles créations</div>
        </div>
      </div>
    </div>

    <!-- Parties terminées aujourd'hui -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-300 text-sm font-medium">Parties terminées (aujourd'hui)</p>
          <p class="text-3xl font-bold text-yellow-400 mt-2">
            <span v-if="loading">--</span>
            <span v-else>{{ metrics.gamesCompletedToday.toLocaleString() }}</span>
          </p>
        </div>
        <div class="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div class="text-xs text-slate-400">
          {{ calculateCompletionRate() }}% de taux de complétion
        </div>
      </div>
    </div>

    <!-- Utilisateurs totaux avec croissance -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-300 text-sm font-medium">Total utilisateurs</p>
          <p class="text-3xl font-bold text-white mt-2">
            <span v-if="loading">--</span>
            <span v-else>{{ metrics.totalRegisteredUsers.toLocaleString() }}</span>
          </p>
        </div>
        <div class="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
      </div>
      <div class="mt-4">
        <div class="flex items-center">
          <svg
            :class="getGrowthIconClass()"
            class="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              :d="getGrowthIconPath()"
            />
          </svg>
          <div :class="getGrowthTextClass()" class="text-xs">
            {{ getGrowthText() }}
          </div>
        </div>
      </div>
    </div>

    <!-- Durée moyenne des sessions -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-300 text-sm font-medium">Durée moyenne session</p>
          <p class="text-3xl font-bold text-cyan-400 mt-2">
            <span v-if="loading">--</span>
            <span v-else>{{ metrics.averageSessionDuration }}</span>
          </p>
        </div>
        <div class="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div class="text-xs text-slate-400">Engagement utilisateur</div>
      </div>
    </div>

    <!-- Utilisateurs actifs cette semaine -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-300 text-sm font-medium">Utilisateurs actifs (semaine)</p>
          <p class="text-3xl font-bold text-indigo-400 mt-2">
            <span v-if="loading">--</span>
            <span v-else>{{ metrics.activeUsersThisWeek.toLocaleString() }}</span>
          </p>
        </div>
        <div class="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
      <div class="mt-4">
        <div class="text-xs text-slate-400">
          {{ calculateWeeklyEngagement() }}% du total
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  metrics: {
    activeUsers24h: number
    activeUsersThisWeek: number
    totalRegisteredUsers: number
    gamesCreatedToday: number
    gamesCompletedToday: number
    averageSessionDuration: string
    growthRate: number
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const calculateCompletionRate = () => {
  if (props.metrics.gamesCreatedToday === 0) return 0
  return Math.round((props.metrics.gamesCompletedToday / props.metrics.gamesCreatedToday) * 100)
}

const calculateWeeklyEngagement = () => {
  if (props.metrics.totalRegisteredUsers === 0) return 0
  return Math.round((props.metrics.activeUsersThisWeek / props.metrics.totalRegisteredUsers) * 100)
}

const getGrowthIconClass = () => {
  if (props.metrics.growthRate > 0) return 'text-green-400'
  if (props.metrics.growthRate < 0) return 'text-red-400'
  return 'text-slate-400'
}

const getGrowthTextClass = () => {
  if (props.metrics.growthRate > 0) return 'text-green-400'
  if (props.metrics.growthRate < 0) return 'text-red-400'
  return 'text-slate-400'
}

const getGrowthIconPath = () => {
  if (props.metrics.growthRate > 0) return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
  if (props.metrics.growthRate < 0) return 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
  return 'M8 12h8'
}

const getGrowthText = () => {
  const rate = Math.abs(props.metrics.growthRate)
  if (props.metrics.growthRate > 0) return `+${rate}% ce mois`
  if (props.metrics.growthRate < 0) return `-${rate}% ce mois`
  return 'Stable ce mois'
}
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>