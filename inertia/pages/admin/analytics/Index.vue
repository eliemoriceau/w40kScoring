<template>
  <AdminLayout :user="user" :breadcrumb-items="breadcrumbItems">
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-red-400">Analytics Dashboard</h1>
          <p class="text-slate-300 mt-2">
            Vue d'ensemble des performances et métriques de la plateforme
          </p>
        </div>
        <div class="flex items-center gap-3">
          <select
            v-model="selectedPeriod"
            @change="refreshData"
            class="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
          >
            <option value="24h">Dernières 24h</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="all">Historique complet</option>
          </select>
          <button
            @click="refreshData"
            :disabled="isLoading"
            class="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            <svg
              :class="{ 'animate-spin': isLoading }"
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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

      <!-- Navigation rapide -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/analytics/platform"
          class="bg-slate-800 hover:bg-slate-700 border border-red-800/50 rounded-lg p-6 transition-colors group"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-white group-hover:text-red-400">
                Métriques Plateforme
              </h3>
              <p class="text-slate-300 text-sm mt-1">Utilisateurs, activité, croissance</p>
            </div>
            <div class="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg
                class="w-6 h-6 text-blue-400"
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
        </Link>

        <Link
          href="/admin/analytics/games"
          class="bg-slate-800 hover:bg-slate-700 border border-red-800/50 rounded-lg p-6 transition-colors group"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-white group-hover:text-red-400">
                Insights Parties
              </h3>
              <p class="text-slate-300 text-sm mt-1">Analyses des jeux et performances</p>
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/analytics/players"
          class="bg-slate-800 hover:bg-slate-700 border border-red-800/50 rounded-lg p-6 transition-colors group"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-white group-hover:text-red-400">
                Analytics Joueurs
              </h3>
              <p class="text-slate-300 text-sm mt-1">Statistiques et performances</p>
            </div>
            <div class="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg
                class="w-6 h-6 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      <!-- Métriques principales -->
      <PlatformMetricsCards :metrics="platformMetrics" :loading="isLoading" />

      <!-- Comparaison de période -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-white mb-6">Comparaison de Période</h2>
        <PeriodComparisonChart :data="periodComparison" />
      </div>

      <!-- Graphiques principaux -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Activité récente -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-6">Activité des Parties</h2>
          <GameActivityChart :data="gameInsights" />
        </div>

        <!-- Distribution des types de jeu -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <h2 class="text-xl font-semibent text-white mb-6">Types de Parties</h2>
          <GameTypesChart :data="gameInsights.gamesByType" />
        </div>
      </div>

      <!-- Heures de pointe -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-white mb-6">Heures d'Activité</h2>
        <PeakHoursChart :data="platformMetrics.peakHours" />
      </div>

      <!-- Parties les plus compétitives -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-white mb-6">Parties les Plus Compétitives</h2>
        <div class="space-y-3">
          <div
            v-for="match in gameInsights.mostCompetitiveMatches"
            :key="match.id"
            class="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
          >
            <div class="flex items-center gap-4">
              <div class="text-lg font-mono text-yellow-400">#{{ match.id }}</div>
              <div>
                <div class="text-white font-medium">{{ match.players }}</div>
                <div class="text-slate-400 text-sm">{{ match.date }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-white font-medium">Écart: {{ match.scoreDifference }} pts</div>
              <div class="text-green-400 text-sm">Match serré</div>
            </div>
          </div>
          <div
            v-if="gameInsights.mostCompetitiveMatches.length === 0"
            class="text-center py-8 text-slate-400"
          >
            Aucune partie compétitive trouvée
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import AdminLayout from '~/pages/admin/components/AdminLayout.vue'
import PlatformMetricsCards from './components/PlatformMetricsCards.vue'
import PeriodComparisonChart from './components/PeriodComparisonChart.vue'
import GameActivityChart from './components/GameActivityChart.vue'
import GameTypesChart from './components/GameTypesChart.vue'
import PeakHoursChart from './components/PeakHoursChart.vue'

interface Props {
  user: any
  platformMetrics: any
  gameInsights: any
  periodComparison: any
  breadcrumbItems: Array<{ label: string; href?: string }>
}

const props = defineProps<Props>()

const selectedPeriod = ref('week')
const isLoading = ref(false)

const refreshData = async () => {
  isLoading.value = true
  try {
    await router.reload({
      data: { period: selectedPeriod.value },
      only: ['platformMetrics', 'gameInsights', 'periodComparison'],
    })
  } catch (error) {
    console.error('Failed to refresh data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Auto-refresh toutes les 5 minutes
  const interval = setInterval(refreshData, 5 * 60 * 1000)

  // Cleanup sur unmount
  return () => clearInterval(interval)
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
