<template>
  <div class="space-y-6">
    <!-- Métriques comparatives -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Total des parties -->
      <div class="text-center">
        <div class="text-sm text-slate-400 mb-2">Total des parties</div>
        <div class="flex items-center justify-center gap-4">
          <div class="text-right">
            <div class="text-slate-300 text-xs">Période précédente</div>
            <div class="text-2xl font-bold text-slate-400">{{ data.previous.totalGames }}</div>
          </div>
          <div class="flex items-center">
            <svg
              :class="getChangeIconClass(data.changes.gamesChange)"
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="getChangeIconPath(data.changes.gamesChange)"
              />
            </svg>
            <span
              :class="getChangeTextClass(data.changes.gamesChange)"
              class="text-sm font-medium ml-1"
            >
              {{ formatChange(data.changes.gamesChange) }}
            </span>
          </div>
          <div class="text-left">
            <div class="text-slate-300 text-xs">Période actuelle</div>
            <div class="text-2xl font-bold text-white">{{ data.current.totalGames }}</div>
          </div>
        </div>
      </div>

      <!-- Utilisateurs actifs -->
      <div class="text-center">
        <div class="text-sm text-slate-400 mb-2">Utilisateurs actifs</div>
        <div class="flex items-center justify-center gap-4">
          <div class="text-right">
            <div class="text-slate-300 text-xs">Période précédente</div>
            <div class="text-2xl font-bold text-slate-400">{{ data.previous.activeUsers }}</div>
          </div>
          <div class="flex items-center">
            <svg
              :class="getChangeIconClass(data.changes.usersChange)"
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="getChangeIconPath(data.changes.usersChange)"
              />
            </svg>
            <span
              :class="getChangeTextClass(data.changes.usersChange)"
              class="text-sm font-medium ml-1"
            >
              {{ formatChange(data.changes.usersChange) }}
            </span>
          </div>
          <div class="text-left">
            <div class="text-slate-300 text-xs">Période actuelle</div>
            <div class="text-2xl font-bold text-white">{{ data.current.activeUsers }}</div>
          </div>
        </div>
      </div>

      <!-- Score moyen -->
      <div class="text-center">
        <div class="text-sm text-slate-400 mb-2">Score moyen</div>
        <div class="flex items-center justify-center gap-4">
          <div class="text-right">
            <div class="text-slate-300 text-xs">Période précédente</div>
            <div class="text-2xl font-bold text-slate-400">{{ data.previous.averageScore }}</div>
          </div>
          <div class="flex items-center">
            <svg
              :class="getChangeIconClass(data.changes.scoreChange)"
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="getChangeIconPath(data.changes.scoreChange)"
              />
            </svg>
            <span
              :class="getChangeTextClass(data.changes.scoreChange)"
              class="text-sm font-medium ml-1"
            >
              {{ formatChange(data.changes.scoreChange) }}
            </span>
          </div>
          <div class="text-left">
            <div class="text-slate-300 text-xs">Période actuelle</div>
            <div class="text-2xl font-bold text-white">{{ data.current.averageScore }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Graphique en barres simplifié -->
    <div class="mt-8">
      <div class="text-sm text-slate-400 mb-4">Évolution comparative</div>
      <div class="grid grid-cols-3 gap-8">
        <!-- Parties -->
        <div class="space-y-2">
          <div class="text-center text-sm text-slate-300">Parties</div>
          <div class="flex items-end justify-center gap-2 h-24">
            <div class="flex flex-col items-center">
              <div
                :style="{
                  height: getBarHeight(
                    data.previous.totalGames,
                    Math.max(data.previous.totalGames, data.current.totalGames)
                  ),
                }"
                class="w-8 bg-slate-600 rounded-t-sm mb-1"
              ></div>
              <div class="text-xs text-slate-400">Avant</div>
            </div>
            <div class="flex flex-col items-center">
              <div
                :style="{
                  height: getBarHeight(
                    data.current.totalGames,
                    Math.max(data.previous.totalGames, data.current.totalGames)
                  ),
                }"
                class="w-8 bg-red-500 rounded-t-sm mb-1"
              ></div>
              <div class="text-xs text-white">Actuel</div>
            </div>
          </div>
        </div>

        <!-- Utilisateurs -->
        <div class="space-y-2">
          <div class="text-center text-sm text-slate-300">Utilisateurs</div>
          <div class="flex items-end justify-center gap-2 h-24">
            <div class="flex flex-col items-center">
              <div
                :style="{
                  height: getBarHeight(
                    data.previous.activeUsers,
                    Math.max(data.previous.activeUsers, data.current.activeUsers)
                  ),
                }"
                class="w-8 bg-slate-600 rounded-t-sm mb-1"
              ></div>
              <div class="text-xs text-slate-400">Avant</div>
            </div>
            <div class="flex flex-col items-center">
              <div
                :style="{
                  height: getBarHeight(
                    data.current.activeUsers,
                    Math.max(data.previous.activeUsers, data.current.activeUsers)
                  ),
                }"
                class="w-8 bg-blue-500 rounded-t-sm mb-1"
              ></div>
              <div class="text-xs text-white">Actuel</div>
            </div>
          </div>
        </div>

        <!-- Scores -->
        <div class="space-y-2">
          <div class="text-center text-sm text-slate-300">Score moyen</div>
          <div class="flex items-end justify-center gap-2 h-24">
            <div class="flex flex-col items-center">
              <div
                :style="{
                  height: getBarHeight(
                    data.previous.averageScore,
                    Math.max(data.previous.averageScore, data.current.averageScore)
                  ),
                }"
                class="w-8 bg-slate-600 rounded-t-sm mb-1"
              ></div>
              <div class="text-xs text-slate-400">Avant</div>
            </div>
            <div class="flex flex-col items-center">
              <div
                :style="{
                  height: getBarHeight(
                    data.current.averageScore,
                    Math.max(data.previous.averageScore, data.current.averageScore)
                  ),
                }"
                class="w-8 bg-yellow-500 rounded-t-sm mb-1"
              ></div>
              <div class="text-xs text-white">Actuel</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Résumé des insights -->
    <div class="bg-slate-700 rounded-lg p-4">
      <div class="text-sm text-slate-300">
        <div class="flex items-start gap-2">
          <svg
            class="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
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
          <div>
            <div class="font-medium text-white mb-1">Insights de la période</div>
            <div class="space-y-1">
              <div v-if="data.changes.gamesChange !== 0">
                Les parties ont {{ data.changes.gamesChange > 0 ? 'augmenté' : 'diminué' }} de
                <span :class="getChangeTextClass(data.changes.gamesChange)" class="font-medium">
                  {{ Math.abs(data.changes.gamesChange) }}%
                </span>
              </div>
              <div v-if="data.changes.usersChange !== 0">
                L'engagement utilisateur a
                {{ data.changes.usersChange > 0 ? 'progressé' : 'reculé' }} de
                <span :class="getChangeTextClass(data.changes.usersChange)" class="font-medium">
                  {{ Math.abs(data.changes.usersChange) }}%
                </span>
              </div>
              <div v-if="data.changes.scoreChange !== 0">
                Le niveau de jeu moyen a
                {{ data.changes.scoreChange > 0 ? 'augmenté' : 'diminué' }} de
                <span :class="getChangeTextClass(data.changes.scoreChange)" class="font-medium">
                  {{ Math.abs(data.changes.scoreChange) }}%
                </span>
              </div>
              <div
                v-if="
                  data.changes.gamesChange === 0 &&
                  data.changes.usersChange === 0 &&
                  data.changes.scoreChange === 0
                "
              >
                Les métriques sont restées stables par rapport à la période précédente.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: {
    current: {
      totalGames: number
      activeUsers: number
      averageScore: number
    }
    previous: {
      totalGames: number
      activeUsers: number
      averageScore: number
    }
    changes: {
      gamesChange: number
      usersChange: number
      scoreChange: number
    }
  }
}

const props = defineProps<Props>()

const getChangeIconClass = (change: number) => {
  if (change > 0) return 'text-green-400'
  if (change < 0) return 'text-red-400'
  return 'text-slate-400'
}

const getChangeTextClass = (change: number) => {
  if (change > 0) return 'text-green-400'
  if (change < 0) return 'text-red-400'
  return 'text-slate-400'
}

const getChangeIconPath = (change: number) => {
  if (change > 0) return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
  if (change < 0) return 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
  return 'M8 12h8'
}

const formatChange = (change: number) => {
  if (change === 0) return '0%'
  return `${change > 0 ? '+' : ''}${change}%`
}

const getBarHeight = (value: number, maxValue: number) => {
  if (maxValue === 0) return '4px'
  const percentage = (value / maxValue) * 100
  return `${Math.max(4, (percentage / 100) * 80)}px` // Min 4px, max 80px
}
</script>
