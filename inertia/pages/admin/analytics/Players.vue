<template>
  <AdminLayout :user="user" :breadcrumb-items="breadcrumbItems">
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-red-400">Analytics Joueurs</h1>
          <p class="text-slate-300 mt-2">
            Analyses des performances et comportements des joueurs
          </p>
        </div>
        <div class="flex items-center gap-3">
          <select
            v-model="selectedPeriod"
            @change="updatePeriod"
            class="bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="all">Historique complet</option>
          </select>
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
      </div>

      <!-- Vue d'ensemble des joueurs -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6 text-center">
          <div class="text-3xl font-bold text-blue-400">{{ totalActivePlayers }}</div>
          <div class="text-slate-400 text-sm mt-2">Joueurs actifs</div>
          <div class="text-xs text-slate-500 mt-1">{{ period === 'week' ? 'Cette semaine' : period === 'month' ? 'Ce mois' : 'Au total' }}</div>
        </div>
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6 text-center">
          <div class="text-3xl font-bold text-green-400">{{ averageGamesPerPlayer }}</div>
          <div class="text-slate-400 text-sm mt-2">Parties/joueur</div>
          <div class="text-xs text-slate-500 mt-1">Moyenne</div>
        </div>
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6 text-center">
          <div class="text-3xl font-bold text-yellow-400">{{ averageWinRate }}%</div>
          <div class="text-slate-400 text-sm mt-2">Taux de victoire</div>
          <div class="text-xs text-slate-500 mt-1">Moyenne globale</div>
        </div>
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6 text-center">
          <div class="text-3xl font-bold text-purple-400">{{ mostActiveHour }}</div>
          <div class="text-slate-400 text-sm mt-2">Heure de pic</div>
          <div class="text-xs text-slate-500 mt-1">Activité maximale</div>
        </div>
      </div>

      <!-- Message si pas de données -->
      <div v-if="!hasPlayerData" class="bg-slate-800 border border-red-800/50 rounded-lg p-12 text-center">
        <svg class="w-16 h-16 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 class="text-xl font-semibold text-white mb-2">Aucune donnée joueur disponible</h3>
        <p class="text-slate-400 mb-4">
          Les statistiques détaillées des joueurs apparaîtront ici une fois que des parties seront créées et jouées.
        </p>
        <Link
          href="/admin/parties"
          class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Voir les parties
        </Link>
      </div>

      <!-- Contenu si on a des données -->
      <template v-else>
        <!-- Insights comportementaux -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Patterns de jeu -->
          <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Patterns de Jeu</h3>
            <div class="space-y-4">
              <div class="p-4 bg-slate-700 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-blue-400 font-medium text-sm">Activité temporelle</span>
                </div>
                <p class="text-slate-300 text-sm">
                  Les joueurs sont les plus actifs vers {{ mostActiveHour }}. 
                  Les sessions durent en moyenne {{ averageSessionDuration }}.
                </p>
              </div>

              <div class="p-4 bg-slate-700 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span class="text-green-400 font-medium text-sm">Engagement</span>
                </div>
                <p class="text-slate-300 text-sm">
                  En moyenne {{ averageGamesPerPlayer }} parties par joueur actif.
                  Le taux de complétion des parties est de {{ getCompletionRate() }}%.
                </p>
              </div>

              <div class="p-4 bg-slate-700 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span class="text-purple-400 font-medium text-sm">Performance</span>
                </div>
                <p class="text-slate-300 text-sm">
                  Taux de victoire moyen équilibré à {{ averageWinRate }}%.
                  {{ getPerformanceInsight() }}
                </p>
              </div>
            </div>
          </div>

          <!-- Recommandations -->
          <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Recommandations</h3>
            <div class="space-y-4">
              <div class="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-green-400 font-medium text-sm">Rétention</span>
                </div>
                <p class="text-green-200 text-sm">
                  {{ getRetentionRecommendation() }}
                </p>
              </div>

              <div class="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span class="text-blue-400 font-medium text-sm">Engagement</span>
                </div>
                <p class="text-blue-200 text-sm">
                  {{ getEngagementRecommendation() }}
                </p>
              </div>

              <div class="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.992-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span class="text-yellow-400 font-medium text-sm">Expérience</span>
                </div>
                <p class="text-yellow-200 text-sm">
                  {{ getExperienceRecommendation() }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Métriques avancées -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-white mb-6">Métriques Comportementales</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-4xl font-bold text-cyan-400 mb-2">{{ averageSessionDuration }}</div>
              <div class="text-slate-400 text-sm">Durée moyenne session</div>
              <div class="text-xs text-slate-500 mt-1">Temps d'engagement typique</div>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-orange-400 mb-2">{{ getRetentionRate() }}%</div>
              <div class="text-slate-400 text-sm">Rétention estimée</div>
              <div class="text-xs text-slate-500 mt-1">Joueurs qui reviennent</div>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-pink-400 mb-2">{{ getBalanceScore() }}</div>
              <div class="text-slate-400 text-sm">Score d'équilibre</div>
              <div class="text-xs text-slate-500 mt-1">Distribution des victoires</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import AdminLayout from '~/pages/admin/components/AdminLayout.vue'

interface Props {
  user: any
  period: 'week' | 'month' | 'all'
  breadcrumbItems: Array<{ label: string; href?: string }>
}

const props = defineProps<Props>()

const selectedPeriod = ref(props.period)

// Données simulées pour la démonstration
// Dans une vraie implémentation, ces données viendraient du serveur
const totalActivePlayers = 45
const averageGamesPerPlayer = 3.2
const averageWinRate = 47
const mostActiveHour = '20h-21h'
const averageSessionDuration = '1h 15min'
const hasPlayerData = totalActivePlayers > 0

const updatePeriod = () => {
  router.get('/admin/analytics/players', { period: selectedPeriod.value })
}

const getCompletionRate = () => {
  // Estimation basée sur les données simulées
  return 78
}

const getPerformanceInsight = () => {
  if (averageWinRate > 55) return 'Certains joueurs dominent, équilibrage nécessaire.'
  if (averageWinRate < 45) return 'Distribution très équilibrée des victoires.'
  return 'Équilibre sain entre tous les joueurs.'
}

const getRetentionRecommendation = () => {
  const retention = getRetentionRate()
  if (retention > 75) {
    return 'Excellente rétention ! Maintenir la qualité de l\'expérience utilisateur.'
  } else if (retention > 50) {
    return 'Bonne rétention. Considérer des événements pour fidéliser davantage.'
  } else {
    return 'Améliorer l\'onboarding et ajouter des mécaniques d\'engagement.'
  }
}

const getEngagementRecommendation = () => {
  if (averageGamesPerPlayer > 5) {
    return 'Engagement élevé. Introduire des défis et des récompenses avancées.'
  } else if (averageGamesPerPlayer > 2) {
    return 'Bon engagement. Optimiser l\'expérience pour encourager plus de parties.'
  } else {
    return 'Engagement faible. Simplifier l\'interface et réduire les frictions.'
  }
}

const getExperienceRecommendation = () => {
  const completion = getCompletionRate()
  if (completion < 60) {
    return 'Taux d\'abandon élevé. Améliorer la fluidité du gameplay.'
  } else if (completion < 80) {
    return 'Expérience correcte. Identifier et résoudre les points de friction.'
  } else {
    return 'Excellente expérience utilisateur. Continuer sur cette voie.'
  }
}

const getRetentionRate = () => {
  // Calcul simulé basé sur l'activité
  if (averageGamesPerPlayer > 4) return 85
  if (averageGamesPerPlayer > 2) return 65
  return 45
}

const getBalanceScore = () => {
  // Score d'équilibre basé sur le taux de victoire moyen
  const deviation = Math.abs(50 - averageWinRate)
  if (deviation < 3) return 'Excellent'
  if (deviation < 7) return 'Bon'
  if (deviation < 12) return 'Correct'
  return 'À améliorer'
}
</script>