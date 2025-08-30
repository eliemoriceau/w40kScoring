<template>
  <AdminLayout :user="user" :breadcrumb-items="breadcrumbItems">
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-red-400">Analytics Plateforme</h1>
          <p class="text-slate-300 mt-2">
            Métriques détaillées de la plateforme et engagement utilisateurs
          </p>
        </div>
        <Link
          href="/admin/analytics"
          class="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour au Dashboard
        </Link>
      </div>

      <!-- Métriques principales -->
      <PlatformMetricsCards :metrics="platformMetrics" />

      <!-- Comparaison détaillée -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-white mb-6">Évolution Détaillée</h2>
        <PeriodComparisonChart :data="periodComparison" />
      </div>

      <!-- Heures d'activité détaillées -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-white mb-6">Analyse Temporelle Complète</h2>
        <PeakHoursChart :data="platformMetrics.peakHours" />
      </div>

      <!-- Statistiques avancées -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Engagement utilisateur -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Engagement Utilisateur</h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
              <span class="text-slate-300">Taux d'utilisateurs actifs (24h)</span>
              <span class="text-blue-400 font-bold"> {{ calculateEngagementRate('daily') }}% </span>
            </div>
            <div class="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
              <span class="text-slate-300">Taux d'utilisateurs actifs (semaine)</span>
              <span class="text-green-400 font-bold">
                {{ calculateEngagementRate('weekly') }}%
              </span>
            </div>
            <div class="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
              <span class="text-slate-300">Durée moyenne de session</span>
              <span class="text-yellow-400 font-bold">
                {{ platformMetrics.averageSessionDuration }}
              </span>
            </div>
            <div class="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
              <span class="text-slate-300">Taux de croissance mensuel</span>
              <span :class="getGrowthRateColor()" class="font-bold">
                {{ formatGrowthRate() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Insights plateforme -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Insights Plateforme</h3>
          <div class="space-y-4">
            <div class="p-4 bg-slate-700 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-blue-400 font-medium text-sm">Pic d'activité</span>
              </div>
              <p class="text-slate-300 text-sm">
                L'heure de pointe est {{ getMostActiveHour() }} avec
                {{ getMostActiveCount() }} activités enregistrées.
              </p>
            </div>

            <div class="p-4 bg-slate-700 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <svg
                  class="w-4 h-4 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-green-400 font-medium text-sm">Activité quotidienne</span>
              </div>
              <p class="text-slate-300 text-sm">
                {{ platformMetrics.gamesCreatedToday }} nouvelles parties créées aujourd'hui, dont
                {{ platformMetrics.gamesCompletedToday }} terminées.
              </p>
            </div>

            <div class="p-4 bg-slate-700 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <svg
                  class="w-4 h-4 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span class="text-purple-400 font-medium text-sm">Tendance générale</span>
              </div>
              <p class="text-slate-300 text-sm">
                {{ getTrendDescription() }}
              </p>
            </div>

            <div class="p-4 bg-slate-700 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-yellow-400 font-medium text-sm">Recommandation</span>
              </div>
              <p class="text-slate-300 text-sm">
                {{ getRecommendation() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tableau de bord en temps réel -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-white">Surveillance Temps Réel</h2>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span class="text-slate-300 text-sm">En ligne</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-slate-700 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-400">{{ platformMetrics.activeUsers24h }}</div>
            <div class="text-slate-400 text-sm">Utilisateurs actifs</div>
            <div class="text-xs text-slate-500 mt-1">Dernières 24h</div>
          </div>
          <div class="bg-slate-700 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-400">
              {{ platformMetrics.gamesCreatedToday }}
            </div>
            <div class="text-slate-400 text-sm">Parties créées</div>
            <div class="text-xs text-slate-500 mt-1">Aujourd'hui</div>
          </div>
          <div class="bg-slate-700 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-yellow-400">{{ getCompletionRate() }}%</div>
            <div class="text-slate-400 text-sm">Taux de complétion</div>
            <div class="text-xs text-slate-500 mt-1">Parties terminées</div>
          </div>
          <div class="bg-slate-700 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-purple-400">
              {{ platformMetrics.totalRegisteredUsers }}
            </div>
            <div class="text-slate-400 text-sm">Total utilisateurs</div>
            <div class="text-xs text-slate-500 mt-1">Inscrits</div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import AdminLayout from '~/pages/admin/components/AdminLayout.vue'
import PlatformMetricsCards from './components/PlatformMetricsCards.vue'
import PeriodComparisonChart from './components/PeriodComparisonChart.vue'
import PeakHoursChart from './components/PeakHoursChart.vue'

interface Props {
  user: any
  platformMetrics: any
  periodComparison: any
  breadcrumbItems: Array<{ label: string; href?: string }>
}

const props = defineProps<Props>()

const calculateEngagementRate = (period: 'daily' | 'weekly') => {
  if (props.platformMetrics.totalRegisteredUsers === 0) return 0

  const activeUsers =
    period === 'daily'
      ? props.platformMetrics.activeUsers24h
      : props.platformMetrics.activeUsersThisWeek

  return Math.round((activeUsers / props.platformMetrics.totalRegisteredUsers) * 100)
}

const getGrowthRateColor = () => {
  if (props.platformMetrics.growthRate > 0) return 'text-green-400'
  if (props.platformMetrics.growthRate < 0) return 'text-red-400'
  return 'text-slate-400'
}

const formatGrowthRate = () => {
  const rate = props.platformMetrics.growthRate
  if (rate === 0) return '0%'
  return `${rate > 0 ? '+' : ''}${rate}%`
}

const getMostActiveHour = () => {
  if (props.platformMetrics.peakHours.length === 0) return '20h'
  const mostActive = props.platformMetrics.peakHours[0]
  return `${mostActive.hour.toString().padStart(2, '0')}h`
}

const getMostActiveCount = () => {
  if (props.platformMetrics.peakHours.length === 0) return 0
  return props.platformMetrics.peakHours[0].count
}

const getCompletionRate = () => {
  if (props.platformMetrics.gamesCreatedToday === 0) return 0
  return Math.round(
    (props.platformMetrics.gamesCompletedToday / props.platformMetrics.gamesCreatedToday) * 100
  )
}

const getTrendDescription = () => {
  const growth = props.platformMetrics.growthRate
  if (growth > 10) return 'La plateforme connaît une forte croissance avec une adoption accélérée.'
  if (growth > 0) return 'La plateforme grandit de manière stable avec un engagement constant.'
  if (growth === 0) return 'La plateforme maintient sa base utilisateur de manière stable.'
  return 'La plateforme nécessite des initiatives pour stimuler la croissance.'
}

const getRecommendation = () => {
  const engagement = calculateEngagementRate('daily')
  const completion = getCompletionRate()

  if (engagement < 20) {
    return "Considérer l'ajout de notifications ou de fonctionnalités d'engagement."
  } else if (completion < 60) {
    return "Améliorer l'expérience utilisateur pour augmenter le taux de complétion."
  } else if (props.platformMetrics.growthRate < 0) {
    return "Analyser les causes de la baisse d'activité et déployer des mesures correctives."
  }
  return 'Les métriques sont saines. Continuer le développement des fonctionnalités.'
}
</script>
