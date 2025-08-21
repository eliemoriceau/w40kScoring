<template>
  <div 
    :class="[
      'relative min-h-12 flex items-center justify-center rounded-lg p-3 transition-all duration-300 cursor-pointer group',
      cellStateClasses,
      editable ? 'hover:scale-102' : 'cursor-default'
    ]"
    @click="startEditing"
  >
    <!-- Mode Affichage -->
    <div v-if="!isEditing" class="flex items-center gap-2 w-full justify-center">
      <span :class="scoreDisplayClasses">{{ displayScore }}</span>
      
      <!-- Icône d'édition avec animation -->
      <svg
        v-if="showEditIcon"
        class="w-4 h-4 text-w40k-text-muted opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:text-w40k-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </div>

    <!-- Mode Édition avec Animation -->
    <div v-else class="flex items-center gap-2 w-full">
      <input
        ref="scoreInput"
        v-model.number="editValue"
        :min="minScore"
        :max="maxScore"
        type="number"
        class="w-16 px-2 py-1 text-center font-bold bg-w40k-bg-secondary border-2 border-w40k-red-500 rounded text-w40k-text-primary focus:outline-none focus:ring-2 focus:ring-w40k-red-400 focus:border-w40k-red-300 transition-all duration-200"
        @blur="saveScore"
        @keyup.enter="saveScore"
        @keyup.escape="cancelEdit"
        @keyup.arrow-up="incrementScore"
        @keyup.arrow-down="decrementScore"
        @input="validateInput"
      />
      
      <!-- Boutons d'action avec effets Magic UI -->
      <div class="flex gap-1">
        <button 
          @click="saveScore" 
          :class="[
            'w-7 h-7 flex items-center justify-center rounded transition-all duration-200 font-bold text-xs',
            'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-xl hover:scale-110',
            'border border-green-500 hover:border-green-400'
          ]"
          title="Sauvegarder"
        >
          ✓
        </button>
        <button 
          @click="cancelEdit" 
          :class="[
            'w-7 h-7 flex items-center justify-center rounded transition-all duration-200 font-bold text-xs',
            'bg-w40k-red-600 hover:bg-w40k-red-500 text-white shadow-lg hover:shadow-xl hover:scale-110',
            'border border-w40k-red-500 hover:border-w40k-red-400'
          ]"
          title="Annuler"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Indicateurs de statut avec animations -->
    <div 
      v-if="isSaving" 
      class="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse"
    >
      <svg class="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>

    <div 
      v-if="hasError" 
      class="absolute -top-1 -right-1 w-5 h-5 bg-w40k-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce"
      title="Erreur de sauvegarde"
    >
      <svg class="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>

    <!-- Border Beam Effect pour les scores élevés -->
    <div 
      v-if="isHighScore" 
      class="absolute inset-0 rounded-lg opacity-75 pointer-events-none"
      :class="borderBeamClasses"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import { router } from '@inertiajs/vue3'
import type { ScoreCellProps, ScoreUpdateEvent } from '../types'

const props = withDefaults(defineProps<ScoreCellProps>(), {
  scoreType: 'primary',
  current: false,
})

const emit = defineEmits<{
  'score-updated': [event: ScoreUpdateEvent]
  'editing-started': []
  'editing-ended': []
}>()

// Configuration des scores avec thématique W40K
const SCORE_LIMITS = {
  primary: { min: 0, max: 50 },
  secondary: { min: 0, max: 15 },
} as const

// État local
const isEditing = ref(false)
const editValue = ref(0)
const isSaving = ref(false)
const hasError = ref(false)
const scoreInput = ref<HTMLInputElement>()

// Computed properties
const maxScore = computed(() => SCORE_LIMITS[props.scoreType].max)
const minScore = computed(() => SCORE_LIMITS[props.scoreType].min)

const currentScore = computed(() => {
  if (props.scoreType === 'secondary') {
    return 0
  }

  const score = props.player.isMainPlayer
    ? props.round.playerScore
    : props.round.opponentScore
    
  return score ?? 0
})

const displayScore = computed(() => currentScore.value)
const showEditIcon = computed(() => props.editable && !isEditing.value && !isSaving.value)
const isHighScore = computed(() => currentScore.value > (maxScore.value * 0.8))

// Classes dynamiques avec thème W40K
const cellStateClasses = computed(() => {
  const score = currentScore.value
  
  if (!props.editable) return 'bg-w40k-bg-elevated border border-w40k-text-subtle opacity-60'
  
  if (isEditing.value) {
    return 'border-2 border-w40k-red-500 bg-w40k-red-900/30 shadow-w40k-lg scale-102 ring-2 ring-w40k-red-500/30'
  }
  
  if (props.current) {
    return 'border-2 border-orange-400 bg-orange-900/20 shadow-lg hover:border-w40k-red-400 hover:bg-w40k-red-900/20'
  }
  
  if (score > 0) {
    return 'border-2 border-green-400 bg-green-900/15 hover:border-w40k-red-400 hover:bg-w40k-red-900/20 hover:shadow-w40k'
  }
  
  if (hasError.value) {
    return 'border-2 border-w40k-red-600 bg-w40k-red-900/40 animate-pulse'
  }
  
  if (isSaving.value) {
    return 'border-2 border-blue-400 bg-blue-900/20'
  }
  
  return 'border-2 border-w40k-text-subtle bg-w40k-bg-secondary hover:border-w40k-red-400 hover:bg-w40k-red-900/10 hover:shadow-w40k'
})

const scoreDisplayClasses = computed(() => {
  const score = currentScore.value
  let baseClasses = 'font-bold transition-all duration-200'
  
  if (score === 0) return `${baseClasses} text-xl text-w40k-text-muted`
  if (score < maxScore.value * 0.3) return `${baseClasses} text-xl text-w40k-text-secondary`
  if (score < maxScore.value * 0.7) return `${baseClasses} text-xl text-w40k-gold-400`
  
  return `${baseClasses} text-2xl text-w40k-red-400 drop-shadow-lg`
})

const borderBeamClasses = computed(() => {
  if (!isHighScore.value) return ''
  
  return [
    'animate-pulse',
    'bg-gradient-to-r from-transparent via-w40k-gold-500/50 to-transparent',
    'border border-w40k-gold-500/50',
  ]
})

// Méthodes
const validateScore = (score: number): boolean => {
  return score >= minScore.value && score <= maxScore.value && Number.isInteger(score)
}

const startEditing = async () => {
  if (!props.editable || isEditing.value || isSaving.value) return

  isEditing.value = true
  editValue.value = currentScore.value ?? 0
  hasError.value = false
  emit('editing-started')

  await nextTick()
  scoreInput.value?.focus()
  scoreInput.value?.select()
}

const saveScore = async () => {
  if (!isEditing.value || isSaving.value) return

  const newScore = editValue.value

  if (!validateScore(newScore)) {
    hasError.value = true
    return
  }

  if (newScore === currentScore.value) {
    cancelEdit()
    return
  }

  isSaving.value = true
  hasError.value = false

  try {
    await router.put(
      `/parties/${props.gameId}/rounds/${props.round.id}/score`,
      {
        playerId: props.player.id,
        score: newScore,
      },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          emit('score-updated', {
            roundId: props.round.id,
            playerId: props.player.id,
            score: newScore,
            scoreType: props.scoreType,
          })

          isEditing.value = false
          emit('editing-ended')
        },
        onError: () => {
          hasError.value = true
        },
      }
    )
  } catch (error) {
    hasError.value = true
    console.error('Erreur lors de la sauvegarde du score:', error)
  } finally {
    isSaving.value = false
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editValue.value = currentScore.value ?? 0
  hasError.value = false
  emit('editing-ended')
}

const incrementScore = () => {
  const newValue = editValue.value + 1
  if (newValue <= maxScore.value) {
    editValue.value = newValue
    hasError.value = false
  }
}

const decrementScore = () => {
  const newValue = editValue.value - 1
  if (newValue >= minScore.value) {
    editValue.value = newValue
    hasError.value = false
  }
}

const validateInput = () => {
  const value = editValue.value
  
  if (value > maxScore.value) {
    editValue.value = maxScore.value
  } else if (value < minScore.value) {
    editValue.value = minScore.value
  }
  
  if (validateScore(editValue.value)) {
    hasError.value = false
  }
}

// Watchers
watch(isEditing, (newValue) => {
  if (newValue) {
    hasError.value = false
  }
})
</script>

<style scoped>
.scale-102 {
  transform: scale(1.02);
}

/* Animations W40K */
@keyframes border-beam {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-border-beam {
  animation: border-beam 2s linear infinite;
}

/* Responsive W40K */
@media (max-width: 768px) {
  .min-h-12 { min-height: 2.5rem; }
  .text-2xl { font-size: 1.25rem; }
  .text-xl { font-size: 1.125rem; }
  .w-16 { width: 3.5rem; }
  .w-7, .h-7 { width: 1.75rem; height: 1.75rem; }
}
</style>