<template>
  <div class="space-y-6">
    <!-- Graphique en secteurs simplifié avec des barres -->
    <div class="space-y-4">
      <div
        v-for="(count, gameType) in data"
        :key="gameType"
        class="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
      >
        <div class="flex items-center gap-3">
          <div :class="getTypeColor(gameType)" class="w-4 h-4 rounded-full"></div>
          <div>
            <div class="text-white font-medium">{{ formatGameType(gameType) }}</div>
            <div class="text-slate-400 text-xs">{{ getTypeDescription(gameType) }}</div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex-1 w-32">
            <div class="bg-slate-600 rounded-full h-3 overflow-hidden">
              <div
                :class="getTypeColor(gameType)"
                :style="{ width: `${getPercentage(count)}%` }"
                class="h-full rounded-full transition-all duration-500 ease-out"
              ></div>
            </div>
          </div>
          <div class="text-white font-bold text-lg w-8 text-center">{{ count }}</div>
          <div class="text-slate-400 text-sm w-12 text-right">{{ getPercentage(count) }}%</div>
        </div>
      </div>
    </div>

    <!-- Statistiques générales -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-slate-700 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-white">{{ getTotalGames() }}</div>
        <div class="text-slate-400 text-sm">Total parties</div>
      </div>
      <div class="bg-slate-700 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-yellow-400">{{ getMostPopularType() }}</div>
        <div class="text-slate-400 text-sm">Type populaire</div>
      </div>
      <div class="bg-slate-700 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-blue-400">{{ getTypeVariety() }}</div>
        <div class="text-slate-400 text-sm">Variété des types</div>
      </div>
    </div>

    <!-- Graphique en barres horizontal -->
    <div class="space-y-3">
      <div class="text-sm font-medium text-slate-300">Répartition visuelle</div>
      <div class="bg-slate-700 rounded-lg p-4">
        <div class="flex items-end gap-3 h-24">
          <div
            v-for="(count, gameType) in data"
            :key="gameType"
            class="flex flex-col items-center flex-1"
          >
            <div
              :style="{ height: `${getBarHeight(count)}%` }"
              :class="getTypeBarColor(gameType)"
              class="w-full rounded-t-lg mb-2 transition-all duration-500 ease-out hover:opacity-80 cursor-pointer"
              :title="`${formatGameType(gameType)}: ${count} parties (${getPercentage(count)}%)`"
            ></div>
            <div class="text-xs text-slate-400 text-center">
              {{ getTypeShortName(gameType) }}
            </div>
            <div class="text-sm font-medium text-white">{{ count }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Insights -->
    <div class="bg-slate-700 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <svg
          class="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0"
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
        <div>
          <div class="text-slate-200 font-medium mb-2">Analyse des types de parties</div>
          <div class="text-sm text-slate-300 space-y-1">
            <div>• Le type le plus populaire est {{ formatGameType(getMostPopularType()) }}</div>
            <div>• {{ getTypeVariety() }} types différents sont joués</div>
            <div>• Le type dominant représente {{ getDominantPercentage() }}% des parties</div>
            <div v-if="hasGoodDiversity()">• Bonne diversité dans les types de parties joués</div>
            <div v-else>• Les joueurs se concentrent sur quelques types de parties</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Légende détaillée -->
    <div class="space-y-2">
      <div class="text-sm font-medium text-slate-300">Légende des types</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div
          v-for="(count, gameType) in data"
          :key="gameType"
          class="flex items-center gap-2 text-sm"
        >
          <div :class="getTypeColor(gameType)" class="w-3 h-3 rounded-full flex-shrink-0"></div>
          <span class="text-slate-300">{{ formatGameType(gameType) }}</span>
          <span class="text-slate-400">- {{ getTypeDescription(gameType) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: Record<string, number>
}

const props = defineProps<Props>()

const getTotalGames = () => {
  return Object.values(props.data).reduce((sum, count) => sum + count, 0)
}

const getPercentage = (count: number) => {
  const total = getTotalGames()
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

const getBarHeight = (count: number) => {
  const maxCount = Math.max(...Object.values(props.data))
  if (maxCount === 0) return 10
  return Math.max(10, (count / maxCount) * 100)
}

const getTypeColor = (gameType: string) => {
  const colors = {
    MATCHED_PLAY: 'bg-red-400',
    NARRATIVE: 'bg-blue-400',
    OPEN_PLAY: 'bg-green-400',
    CRUSADE: 'bg-purple-400',
    TOURNAMENT: 'bg-yellow-400',
  }
  return colors[gameType as keyof typeof colors] || 'bg-slate-400'
}

const getTypeBarColor = (gameType: string) => {
  const colors = {
    MATCHED_PLAY: 'bg-red-500',
    NARRATIVE: 'bg-blue-500',
    OPEN_PLAY: 'bg-green-500',
    CRUSADE: 'bg-purple-500',
    TOURNAMENT: 'bg-yellow-500',
  }
  return colors[gameType as keyof typeof colors] || 'bg-slate-500'
}

const formatGameType = (gameType: string) => {
  const types = {
    MATCHED_PLAY: 'Jeu Équilibré',
    NARRATIVE: 'Narratif',
    OPEN_PLAY: 'Jeu Libre',
    CRUSADE: 'Croisade',
    TOURNAMENT: 'Tournoi',
  }
  return types[gameType as keyof typeof types] || gameType
}

const getTypeShortName = (gameType: string) => {
  const shortNames = {
    MATCHED_PLAY: 'Équil.',
    NARRATIVE: 'Narr.',
    OPEN_PLAY: 'Libre',
    CRUSADE: 'Crois.',
    TOURNAMENT: 'Tour.',
  }
  return shortNames[gameType as keyof typeof shortNames] || gameType
}

const getTypeDescription = (gameType: string) => {
  const descriptions = {
    MATCHED_PLAY: 'Parties équilibrées et compétitives',
    NARRATIVE: 'Jeux orientés histoire et scénario',
    OPEN_PLAY: 'Parties libres et décontractées',
    CRUSADE: 'Campagnes évolutives',
    TOURNAMENT: 'Compétitions officielles',
  }
  return descriptions[gameType as keyof typeof descriptions] || 'Type de partie'
}

const getMostPopularType = () => {
  let maxCount = 0
  let popularType = ''

  for (const [type, count] of Object.entries(props.data)) {
    if (count > maxCount) {
      maxCount = count
      popularType = type
    }
  }

  return formatGameType(popularType)
}

const getTypeVariety = () => {
  return Object.keys(props.data).length
}

const getDominantPercentage = () => {
  const maxCount = Math.max(...Object.values(props.data))
  return getPercentage(maxCount)
}

const hasGoodDiversity = () => {
  const total = getTotalGames()
  const typeCount = getTypeVariety()

  if (typeCount < 2) return false

  // Si le type dominant représente moins de 60% et qu'il y a au moins 3 types
  const dominantPercentage = getDominantPercentage()
  return dominantPercentage < 60 && typeCount >= 3
}
</script>
