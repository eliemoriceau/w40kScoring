<template>
  <div class="space-y-6">
    <!-- Graphique en barres pour les heures de pointe -->
    <div class="bg-slate-700 rounded-lg p-4">
      <div class="flex items-end gap-1 h-32">
        <div 
          v-for="hour in 24"
          :key="hour - 1"
          class="flex flex-col items-center flex-1 group"
        >
          <div
            :style="{ height: `${getBarHeight(hour - 1)}%` }"
            :class="getBarColor(hour - 1)"
            class="w-full rounded-t-sm mb-1 transition-all duration-300 group-hover:opacity-80 cursor-pointer"
            :title="`${hour - 1}h: ${getHourCount(hour - 1)} parties`"
          ></div>
          <div class="text-xs text-slate-400 writing-mode-vertical transform rotate-90 origin-bottom">
            {{ formatHour(hour - 1) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Top 5 des heures les plus actives -->
    <div class="space-y-3">
      <div class="text-sm font-medium text-slate-300">Heures les plus actives</div>
      <div class="space-y-2">
        <div 
          v-for="(hourData, index) in sortedPeakHours.slice(0, 5)"
          :key="hourData.hour"
          class="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div 
              :class="getRankColor(index)"
              class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            >
              {{ index + 1 }}
            </div>
            <div>
              <div class="text-white font-medium">{{ formatHourRange(hourData.hour) }}</div>
              <div class="text-slate-400 text-xs">{{ getTimeOfDay(hourData.hour) }}</div>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="flex-1 w-24">
              <div class="bg-slate-600 rounded-full h-2 overflow-hidden">
                <div
                  :class="getIntensityColor(hourData.count)"
                  :style="{ width: `${getIntensityPercentage(hourData.count)}%` }"
                  class="h-full rounded-full transition-all duration-500"
                ></div>
              </div>
            </div>
            <div class="text-white font-bold text-lg w-8 text-center">{{ hourData.count }}</div>
            <div class="text-slate-400 text-sm w-12 text-right">
              {{ getHourPercentage(hourData.count) }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Insights d'activité -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-slate-700 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-yellow-400">{{ getMostActiveHour() }}</div>
        <div class="text-slate-400 text-sm">Heure de pointe</div>
      </div>
      <div class="bg-slate-700 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-blue-400">{{ getActiveHoursCount() }}</div>
        <div class="text-slate-400 text-sm">Heures actives</div>
      </div>
      <div class="bg-slate-700 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-green-400">{{ getTotalActivities() }}</div>
        <div class="text-slate-400 text-sm">Total activités</div>
      </div>
    </div>

    <!-- Analyse temporelle -->
    <div class="bg-slate-700 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <div class="text-slate-200 font-medium mb-2">Analyse des créneaux d'activité</div>
          <div class="text-sm text-slate-300 space-y-1">
            <div>• Pic d'activité: {{ getMostActiveHour() }} ({{ getMostActiveCount() }} parties)</div>
            <div>• Période principale: {{ getPrimaryPeriod() }}</div>
            <div>• {{ getActiveHoursCount() }} créneaux actifs dans la journée</div>
            <div>• Activité la plus faible: {{ getQuietestHour() }} ({{ getQuietestCount() }} parties)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Graphique circulaire des périodes -->
    <div class="space-y-4">
      <div class="text-sm font-medium text-slate-300">Répartition par période de la journée</div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div 
          v-for="period in timePeriods"
          :key="period.name"
          class="bg-slate-700 rounded-lg p-4 text-center"
        >
          <div :class="period.color" class="text-2xl font-bold">{{ period.count }}</div>
          <div class="text-slate-400 text-sm">{{ period.name }}</div>
          <div class="text-xs text-slate-500 mt-1">{{ period.range }}</div>
          <div class="mt-2">
            <div class="bg-slate-600 rounded-full h-2 overflow-hidden">
              <div
                :class="period.color.replace('text-', 'bg-')"
                :style="{ width: `${(period.count / getTotalActivities()) * 100}%` }"
                class="h-full rounded-full transition-all duration-500"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: Array<{ hour: number; count: number }>
}

const props = defineProps<Props>()

const sortedPeakHours = computed(() => {
  return [...props.data].sort((a, b) => b.count - a.count)
})

const timePeriods = computed(() => {
  const periods = [
    { name: 'Matin', range: '6h-12h', hours: [6,7,8,9,10,11], color: 'text-yellow-400' },
    { name: 'Après-midi', range: '12h-18h', hours: [12,13,14,15,16,17], color: 'text-orange-400' },
    { name: 'Soirée', range: '18h-24h', hours: [18,19,20,21,22,23], color: 'text-purple-400' },
    { name: 'Nuit', range: '0h-6h', hours: [0,1,2,3,4,5], color: 'text-blue-400' }
  ]

  return periods.map(period => ({
    ...period,
    count: period.hours.reduce((sum, hour) => sum + getHourCount(hour), 0)
  }))
})

const getHourCount = (hour: number) => {
  const hourData = props.data.find(h => h.hour === hour)
  return hourData ? hourData.count : 0
}

const getBarHeight = (hour: number) => {
  const count = getHourCount(hour)
  const maxCount = Math.max(...props.data.map(h => h.count))
  if (maxCount === 0) return 5
  return Math.max(5, (count / maxCount) * 100)
}

const getBarColor = (hour: number) => {
  const count = getHourCount(hour)
  const maxCount = Math.max(...props.data.map(h => h.count))
  const intensity = count / maxCount
  
  if (intensity > 0.8) return 'bg-red-500'
  if (intensity > 0.6) return 'bg-orange-500'
  if (intensity > 0.4) return 'bg-yellow-500'
  if (intensity > 0.2) return 'bg-green-500'
  if (intensity > 0) return 'bg-blue-500'
  return 'bg-slate-600'
}

const formatHour = (hour: number) => {
  return `${hour.toString().padStart(2, '0')}h`
}

const formatHourRange = (hour: number) => {
  const nextHour = (hour + 1) % 24
  return `${formatHour(hour)} - ${formatHour(nextHour)}`
}

const getTimeOfDay = (hour: number) => {
  if (hour >= 6 && hour < 12) return 'Matinée'
  if (hour >= 12 && hour < 18) return 'Après-midi'
  if (hour >= 18 && hour < 24) return 'Soirée'
  return 'Nuit'
}

const getRankColor = (index: number) => {
  const colors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-600', 'bg-blue-500', 'bg-purple-500']
  return colors[index] || 'bg-slate-500'
}

const getIntensityColor = (count: number) => {
  const maxCount = Math.max(...props.data.map(h => h.count))
  const intensity = count / maxCount
  
  if (intensity > 0.8) return 'bg-red-400'
  if (intensity > 0.6) return 'bg-orange-400'
  if (intensity > 0.4) return 'bg-yellow-400'
  return 'bg-green-400'
}

const getIntensityPercentage = (count: number) => {
  const maxCount = Math.max(...props.data.map(h => h.count))
  if (maxCount === 0) return 0
  return (count / maxCount) * 100
}

const getHourPercentage = (count: number) => {
  const total = getTotalActivities()
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

const getMostActiveHour = () => {
  const mostActive = sortedPeakHours.value[0]
  return mostActive ? formatHour(mostActive.hour) : '20h'
}

const getMostActiveCount = () => {
  const mostActive = sortedPeakHours.value[0]
  return mostActive ? mostActive.count : 0
}

const getActiveHoursCount = () => {
  return props.data.filter(h => h.count > 0).length
}

const getTotalActivities = () => {
  return props.data.reduce((sum, h) => sum + h.count, 0)
}

const getQuietestHour = () => {
  const quietest = [...props.data].sort((a, b) => a.count - b.count)[0]
  return quietest ? formatHour(quietest.hour) : '4h'
}

const getQuietestCount = () => {
  const quietest = [...props.data].sort((a, b) => a.count - b.count)[0]
  return quietest ? quietest.count : 0
}

const getPrimaryPeriod = () => {
  const mostActivePeriod = timePeriods.value.reduce((max, period) => 
    period.count > max.count ? period : max
  )
  return `${mostActivePeriod.name} (${mostActivePeriod.range})`
}
</script>

<style scoped>
.writing-mode-vertical {
  writing-mode: vertical-lr;
  text-orientation: mixed;
}
</style>