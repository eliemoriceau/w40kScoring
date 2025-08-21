<template>
  <div 
    class="relative min-h-12 flex items-center justify-center border-2 border-transparent rounded-lg p-2 transition-all duration-200 cursor-pointer"
    :class="cellClasses"
    @click="startEditing"
  >
    <!-- Mode affichage -->
    <div v-if="!isEditing" class="flex items-center gap-2">
      <span class="text-xl font-bold text-white">{{ displayScore }}</span>
      <svg
        v-if="showEditIcon"
        class="w-4 h-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
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

    <!-- Mode édition -->
    <div v-else class="flex items-center gap-2">
      <input
        ref="scoreInput"
        v-model.number="editValue"
        :min="minScore"
        :max="maxScore"
        type="number"
        class="w-16 px-2 py-1 text-center font-bold bg-slate-700 border border-w40k-red-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-w40k-red-300"
        @blur="saveScore"
        @keyup.enter="saveScore"
        @keyup.escape="cancelEdit"
        @keyup.arrow-up="incrementScore"
        @keyup.arrow-down="decrementScore"
        @input="validateInput"
      />
      <div class="flex gap-1">
        <button 
          @click="saveScore" 
          class="w-6 h-6 flex items-center justify-center rounded bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors"
          title="Sauvegarder"
        >
          ✓
        </button>
        <button 
          @click="cancelEdit" 
          class="w-6 h-6 flex items-center justify-center rounded bg-w40k-red-600 hover:bg-w40k-red-500 text-white text-xs font-bold transition-colors"
          title="Annuler"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Indicateur de sauvegarde -->
    <div v-if="isSaving" class="absolute top-1 right-1 text-blue-400">
      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>

    <!-- Indicateur d'erreur -->
    <div v-if="hasError" class="absolute top-1 right-1 text-w40k-red-400" title="Erreur de sauvegarde">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
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

// Configuration des scores
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

// Score maximum selon le type
const maxScore = computed(() => SCORE_LIMITS[props.scoreType].max)
const minScore = computed(() => SCORE_LIMITS[props.scoreType].min)

// Score actuel à afficher (défaut 0)
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

const cellClasses = computed(() => {
  const score = currentScore.value
  const baseClasses = 'group'
  
  if (!props.editable) return baseClasses
  if (isEditing.value) return `${baseClasses} border-w40k-red-500 bg-w40k-red-900/20 shadow-w40k-lg scale-102`
  if (props.current) return `${baseClasses} border-orange-300 bg-orange-900/20 hover:border-w40k-red-300 hover:bg-w40k-red-900/10`
  if (score > 0) return `${baseClasses} border-green-300 bg-green-900/10 hover:border-w40k-red-300 hover:bg-w40k-red-900/10`
  if (hasError.value) return `${baseClasses} border-w40k-red-600 bg-w40k-red-900/30`
  if (isSaving.value) return `${baseClasses} border-blue-400 bg-blue-900/20`
  
  return `${baseClasses} border-gray-400 bg-gray-800/50 hover:border-w40k-red-300 hover:bg-w40k-red-900/10`
})

// Validation du score
const validateScore = (score: number): boolean => {
  return score >= minScore.value && score <= maxScore.value && Number.isInteger(score)
}

// Démarrer l'édition
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

// Sauvegarder le score
const saveScore = async () => {
  if (!isEditing.value || isSaving.value) return

  const newScore = editValue.value

  // Validation
  if (!validateScore(newScore)) {
    hasError.value = true
    return
  }

  // Pas de changement
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

// Annuler l'édition
const cancelEdit = () => {
  isEditing.value = false
  editValue.value = currentScore.value ?? 0
  hasError.value = false
  emit('editing-ended')
}

// Navigation clavier
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

// Validation en temps réel
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

// Reset de l'erreur quand on commence à éditer
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

/* Responsive */
@media (max-width: 768px) {
  .min-h-12 {
    min-height: 2.5rem;
  }
  
  .text-xl {
    font-size: 1.125rem;
  }
  
  .w-16 {
    width: 3.5rem;
  }
  
  .text-sm {
    font-size: 0.875rem;
  }
  
  .w-6, .h-6 {
    width: 2rem;
    height: 2rem;
  }
}
</style>