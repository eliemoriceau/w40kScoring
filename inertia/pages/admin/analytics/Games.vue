<template>
  <AdminLayout :user="user" :breadcrumb-items="breadcrumbItems">
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-red-400">Analytics Parties</h1>
          <p class="text-slate-300 mt-2">
            Insights détaillés sur les parties et comportements de jeu
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

      <!-- Vue d'ensemble des parties -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-white mb-6">Activité des Parties</h2>
        <GameActivityChart :data="gameInsights" />
      </div>

      <!-- Types de parties -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-white mb-6">Répartition des Types</h2>
        <GameTypesChart :data="gameInsights.gamesByType" />
      </div>

      <!-- Parties les plus compétitives -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-white mb-6">Hall of Fame - Parties Compétitives</h2>
        <div v-if="gameInsights.mostCompetitiveMatches.length > 0" class="space-y-4">
          <div
            v-for="(match, index) in gameInsights.mostCompetitiveMatches"
            :key="match.id"
            class="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <div class="flex items-center gap-4">
              <!-- Rang -->
              <div
                :class="getRankClasses(index)"
                class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              >
                {{ index + 1 }}
              </div>

              <!-- Informations de la partie -->
              <div>
                <div class="text-white font-medium">{{ match.players }}</div>
                <div class="text-slate-400 text-sm">Partie #{{ match.id }} • {{ match.date }}</div>
              </div>
            </div>

            <div class="text-right">
              <div class="text-green-400 font-bold">Écart: {{ match.scoreDifference }} pts</div>
              <div class="text-slate-400 text-xs">
                {{ getCompetitivenessLevel(match.scoreDifference) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-slate-400">
          <svg
            class="w-16 h-16 mx-auto mb-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <p>Aucune partie compétitive trouvée</p>
          <p class="text-sm text-slate-500 mt-1">Les parties terminées apparaîtront ici</p>
        </div>
      </div>

      <!-- Statistiques détaillées -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Métriques de qualité -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Métriques de Qualité</h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
              <div>
                <span class="text-slate-300 font-medium">Score moyen par round</span>
                <div class="text-slate-400 text-sm">Points marqués en moyenne</div>
              </div>
              <span class="text-yellow-400 font-bold text-xl">
                {{ gameInsights.averageScorePerRound }}
              </span>
            </div>

            <div class="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
              <div>
                <span class="text-slate-300 font-medium">Durée moyenne</span>
                <div class="text-slate-400 text-sm">Temps de partie typique</div>
              </div>
              <span class="text-cyan-400 font-bold text-xl">
                {{ gameInsights.averageGameDuration }}
              </span>
            </div>

            <div class="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
              <div>
                <span class="text-slate-300 font-medium">Taux de complétion</span>
                <div class="text-slate-400 text-sm">Parties menées à terme</div>
              </div>
              <span class="text-green-400 font-bold text-xl"> {{ getCompletionRate() }}% </span>
            </div>

            <div class="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
              <div>
                <span class="text-slate-300 font-medium">Niveau de compétition</span>
                <div class="text-slate-400 text-sm">Basé sur les écarts de score</div>
              </div>
              <span class="text-purple-400 font-bold text-xl">
                {{ getOverallCompetitiveness() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Insights et recommandations -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Insights Stratégiques</h3>
          <div class="space-y-4">
            <!-- Type de jeu dominant -->
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span class="text-blue-400 font-medium text-sm">Type dominant</span>
              </div>
              <p class="text-slate-300 text-sm">
                {{ getMostPopularGameType() }} est le format préféré avec
                {{ getMostPopularGameTypeCount() }} parties ({{
                  getMostPopularGameTypePercentage()
                }}% du total).
              </p>
            </div>

            <!-- Niveau d'activité -->
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span class="text-green-400 font-medium text-sm">Activité</span>
              </div>
              <p class="text-slate-300 text-sm">
                {{ getActivityInsight() }}
              </p>
            </div>

            <!-- Équilibre du jeu -->
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span class="text-purple-400 font-medium text-sm">Équilibre</span>
              </div>
              <p class="text-slate-300 text-sm">
                {{ getBalanceInsight() }}
              </p>
            </div>

            <!-- Recommandation -->
            <div class="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.992-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span class="text-yellow-400 font-medium text-sm">Recommandation</span>
              </div>
              <p class="text-yellow-200 text-sm">
                {{ getRecommendation() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import AdminLayout from '~/pages/admin/components/AdminLayout.vue'
import GameActivityChart from './components/GameActivityChart.vue'
import GameTypesChart from './components/GameTypesChart.vue'

interface Props {
  user: any
  gameInsights: any
  breadcrumbItems: Array<{ label: string; href?: string }>
}

const props = defineProps<Props>()

const getRankClasses = (index: number) => {
  const colors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-600', 'bg-blue-500', 'bg-purple-500']
  return colors[index] || 'bg-slate-500'
}

const getCompetitivenessLevel = (scoreDifference: number) => {
  if (scoreDifference <= 5) return 'Très serré'
  if (scoreDifference <= 10) return 'Compétitif'
  if (scoreDifference <= 20) return 'Équilibré'
  return 'Dominant'
}

const getCompletionRate = () => {
  const completed = props.gameInsights.gamesByStatus.COMPLETED || 0
  if (props.gameInsights.totalGames === 0) return 0
  return Math.round((completed / props.gameInsights.totalGames) * 100)
}

const getOverallCompetitiveness = () => {
  const competitiveMatches = props.gameInsights.mostCompetitiveMatches.length
  if (competitiveMatches === 0) return 'N/A'

  const avgDifference =
    props.gameInsights.mostCompetitiveMatches.reduce(
      (sum: number, match: any) => sum + match.scoreDifference,
      0
    ) / competitiveMatches

  if (avgDifference <= 8) return 'Élevé'
  if (avgDifference <= 15) return 'Moyen'
  return 'Faible'
}

const getMostPopularGameType = () => {
  const gameTypes = props.gameInsights.gamesByType
  let maxCount = 0
  let popularType = ''

  for (const [type, count] of Object.entries(gameTypes)) {
    if (count > maxCount) {
      maxCount = count
      popularType = type
    }
  }

  const typeNames = {
    MATCHED_PLAY: 'Jeu Équilibré',
    NARRATIVE: 'Narratif',
    OPEN_PLAY: 'Jeu Libre',
    CRUSADE: 'Croisade',
    TOURNAMENT: 'Tournoi',
  }

  return typeNames[popularType as keyof typeof typeNames] || popularType
}

const getMostPopularGameTypeCount = () => {
  const counts = Object.values(props.gameInsights.gamesByType)
  return Math.max(...(counts as number[]))
}

const getMostPopularGameTypePercentage = () => {
  const maxCount = getMostPopularGameTypeCount()
  if (props.gameInsights.totalGames === 0) return 0
  return Math.round((maxCount / props.gameInsights.totalGames) * 100)
}

const getActivityInsight = () => {
  const total = props.gameInsights.totalGames
  const completed = props.gameInsights.gamesByStatus.COMPLETED || 0
  const inProgress = props.gameInsights.gamesByStatus.IN_PROGRESS || 0

  if (total === 0) return 'Aucune activité enregistrée pour le moment.'
  if (inProgress > completed)
    return `${inProgress} parties en cours montrent une activité soutenue.`
  if (completed > total * 0.8) return 'Excellente conversion avec plus de 80% de parties terminées.'
  return `${total} parties au total avec un bon niveau d'engagement.`
}

const getBalanceInsight = () => {
  const avgScore = props.gameInsights.averageScorePerRound
  const competitiveCount = props.gameInsights.mostCompetitiveMatches.length

  if (avgScore > 20) return 'Scores élevés suggèrent un équilibre offensif du méta-jeu.'
  if (avgScore < 10) return 'Scores faibles peuvent indiquer un jeu plus défensif ou tactique.'
  if (competitiveCount > 3) return 'Bonne diversité de matchs compétitifs, équilibre sain.'
  return 'Équilibre standard avec une variété de résultats de parties.'
}

const getRecommendation = () => {
  const completionRate = getCompletionRate()
  const totalGames = props.gameInsights.totalGames
  const typeVariety = Object.keys(props.gameInsights.gamesByType).length

  if (completionRate < 60) {
    return "Améliorer l'expérience utilisateur pour réduire l'abandon de parties."
  } else if (totalGames < 50) {
    return 'Encourager la création de parties avec des événements ou des défis.'
  } else if (typeVariety < 3) {
    return "Promouvoir la diversité des formats de jeu pour enrichir l'expérience."
  } else if (props.gameInsights.mostCompetitiveMatches.length === 0) {
    return 'Mettre en place un système de classement pour favoriser la compétition.'
  }
  return 'Les métriques sont excellentes ! Continuer sur cette lancée.'
}
</script>
