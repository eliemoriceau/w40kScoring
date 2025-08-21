<template>
  <div :class="roundClasses">
    <div class="round-header">
      <span class="round-number">Round {{ round.roundNumber }}</span>
      <div class="round-status">
        <span v-if="round.isCompleted" class="status-badge completed">✅ Terminé</span>
        <span v-else-if="isCurrent" class="status-badge current">🎯 En cours</span>
        <span v-else class="status-badge pending">📋 À venir</span>
      </div>
    </div>

    <div class="scores-row">
      <!-- Score Joueur 1 -->
      <div class="player-score">
        <div class="player-name">{{ players[0]?.pseudo || 'Joueur 1' }}</div>
        <ScoreCell
          :round="round"
          :player="players[0]"
          :game-id="gameId"
          :editable="canEdit && (!round.isCompleted || allowEditCompleted)"
          :current="isCurrent"
          score-type="primary"
          @score-updated="$emit('score-updated', $event)"
          @editing-started="handleEditingStarted"
          @editing-ended="handleEditingEnded"
        />
      </div>

      <!-- VS Divider -->
      <div class="vs-divider">
        <span class="vs-text">VS</span>
      </div>

      <!-- Score Joueur 2 -->
      <div class="player-score">
        <div class="player-name">{{ players[1]?.pseudo || 'Joueur 2' }}</div>
        <ScoreCell
          v-if="players[1]"
          :round="round"
          :player="players[1]"
          :game-id="gameId"
          :editable="canEdit && (!round.isCompleted || allowEditCompleted)"
          :current="isCurrent"
          score-type="primary"
          @score-updated="$emit('score-updated', $event)"
          @editing-started="handleEditingStarted"
          @editing-ended="handleEditingEnded"
        />
        <div v-else class="empty-player">
          <span class="text-gray-500">En attente d'adversaire</span>
        </div>
      </div>
    </div>

    <!-- Indicateur de complétion automatique -->
    <div v-if="shouldShowCompletionHint" class="completion-hint">
      <span class="text-sm text-green-400">
        Round terminé automatiquement (les deux scores sont renseignés)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ScoreCell from './ScoreCell.vue'
import type { RoundRowProps, ScoreUpdateEvent } from '../types'

const props = withDefaults(defineProps<RoundRowProps>(), {
  allowEditCompleted: false,
})

const emit = defineEmits<{
  'score-updated': [event: ScoreUpdateEvent]
  'round-completed': [roundId: number]
}>()

const isEditing = ref(false)

const isCurrent = computed(() => props.round.roundNumber === props.currentRound)

const roundClasses = computed(() => [
  'round-row',
  {
    'round-completed': props.round.isCompleted,
    'round-current': isCurrent.value,
    'round-pending': !props.round.isCompleted && !isCurrent.value,
    'round-editing': isEditing.value,
  },
])

// Vérifie si on doit afficher l'indication de complétion automatique
const shouldShowCompletionHint = computed(() => {
  return (
    props.round.isCompleted &&
    props.round.playerScore !== null &&
    props.round.opponentScore !== null &&
    (props.round.playerScore > 0 || props.round.opponentScore > 0)
  )
})

const handleEditingStarted = () => {
  isEditing.value = true
}

const handleEditingEnded = () => {
  isEditing.value = false

  // Vérifier si le round est maintenant complété
  if (
    !props.round.isCompleted &&
    props.round.playerScore !== null &&
    props.round.opponentScore !== null
  ) {
    emit('round-completed', props.round.id)
  }
}
</script>

<style scoped>
.round-row {
  @apply border-l-4 border-gray-600 bg-slate-800 rounded-lg p-4 mb-3 
         transition-all duration-200;
}

.round-completed {
  @apply border-green-500 bg-green-900/20;
}

.round-current {
  @apply border-orange-500 bg-orange-900/20 shadow-lg;
}

.round-pending {
  @apply border-gray-500 bg-slate-800/50;
}

.round-editing {
  @apply border-red-500 shadow-xl;
}

.round-header {
  @apply flex items-center justify-between mb-4;
}

.round-number {
  @apply text-lg font-bold text-white;
}

.status-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.status-badge.completed {
  @apply bg-green-900/50 border border-green-700 text-green-200;
}

.status-badge.current {
  @apply bg-orange-900/50 border border-orange-700 text-orange-200;
}

.status-badge.pending {
  @apply bg-gray-900/50 border border-gray-700 text-gray-200;
}

.scores-row {
  @apply grid grid-cols-3 gap-4 items-center;
}

.player-score {
  @apply flex flex-col items-center gap-2;
}

.player-name {
  @apply text-sm font-medium text-gray-300 text-center;
}

.vs-divider {
  @apply flex items-center justify-center;
}

.vs-text {
  @apply text-xs font-bold text-gray-500 bg-slate-700 px-2 py-1 rounded;
}

.empty-player {
  @apply min-h-[3rem] flex items-center justify-center
         border-2 border-dashed border-gray-600 rounded-lg p-2;
}

.completion-hint {
  @apply mt-3 pt-3 border-t border-green-800/50 text-center;
}

/* Animation pour l'état d'édition */
.round-editing {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

/* Responsive Mobile */
@media (max-width: 768px) {
  .scores-row {
    @apply grid-cols-1 gap-3;
  }

  .vs-divider {
    @apply order-2;
  }

  .vs-text {
    @apply text-xs px-4 py-1;
  }

  .player-score:first-child {
    @apply order-1;
  }

  .player-score:last-child {
    @apply order-3;
  }

  .round-header {
    @apply flex-col gap-2 text-center;
  }

  .round-number {
    @apply text-base;
  }
}

/* Responsive Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .scores-row {
    @apply gap-3;
  }

  .player-name {
    @apply text-xs;
  }
}
</style>
