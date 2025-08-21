<template>
  <div :class="roundStateClasses" class="animate-in fade-in duration-500">
    <!-- En-tête du round avec design W40K épique -->
    <div class="relative bg-gradient-to-r from-w40k-bg-secondary via-w40k-bg-elevated to-w40k-bg-secondary border-b-2 border-w40k-red-500/30 p-4 rounded-t-lg">
      <!-- Effet de fond animé pour round actuel -->
      <div v-if="isCurrent" class="absolute inset-0 bg-gradient-to-r from-orange-900/30 via-w40k-red-900/20 to-orange-900/30 rounded-t-lg animate-pulse" />
      
      <div class="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div class="flex items-center gap-3">
          <!-- Icône de round avec animation -->
          <div class="w-10 h-10 bg-gradient-to-br from-w40k-red-600 to-w40k-red-800 rounded-full flex items-center justify-center shadow-lg">
            <span class="text-lg font-black text-white">{{ round.roundNumber }}</span>
          </div>
          
          <!-- Titre du round -->
          <h4 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-w40k-red-300 to-w40k-gold-400">
            ⚔️ Round {{ round.roundNumber }}
          </h4>
        </div>
        
        <!-- Badge de statut avec design W40K -->
        <div class="flex justify-center md:justify-end">
          <span :class="statusBadgeClasses">
            {{ statusText }}
          </span>
        </div>
      </div>
      
      <!-- Indicateur de progression pour round actuel -->
      <div v-if="isCurrent && !round.isCompleted" class="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse" />
    </div>

    <!-- Section des scores avec layout W40K -->
    <div class="relative bg-gradient-to-br from-w40k-bg-secondary to-w40k-bg-elevated border-2 border-w40k-red-500/50 rounded-b-lg p-6">
      <!-- Grille de scores responsive -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <!-- Score Joueur 1 avec design W40K -->
        <div class="flex flex-col items-center space-y-3">
          <div class="flex items-center gap-2 text-center">
            <div class="w-3 h-3 bg-w40k-red-500 rounded-full animate-pulse" />
            <span class="text-lg font-bold text-w40k-red-300">
              {{ players[0]?.pseudo || 'Joueur 1' }}
            </span>
            <span v-if="players[0]?.isMainPlayer" class="text-sm text-w40k-text-muted">(Vous)</span>
          </div>
          
          <!-- Container du score avec effets -->
          <div class="relative">
            <W40KScoreCell
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
        </div>

        <!-- Diviseur VS épique -->
        <div class="flex justify-center items-center py-4">
          <div class="relative">
            <!-- VS principal avec design W40K -->
            <div class="bg-gradient-to-br from-w40k-bg-primary to-w40k-bg-secondary border-2 border-w40k-text-subtle rounded-full px-6 py-3 shadow-w40k-lg">
              <span class="text-2xl font-black text-w40k-text-subtle">VS</span>
            </div>
            
            <!-- Effet lumineux autour du VS -->
            <div class="absolute -inset-1 bg-gradient-to-r from-w40k-red-500/20 via-w40k-gold-500/20 to-w40k-red-500/20 rounded-full blur animate-pulse opacity-75" />
            
            <!-- Épées croisées pour décoration -->
            <div class="absolute -top-2 -left-2 text-w40k-red-400 opacity-50">⚔️</div>
            <div class="absolute -bottom-2 -right-2 text-w40k-red-400 opacity-50 rotate-180">⚔️</div>
          </div>
        </div>

        <!-- Score Joueur 2 avec design W40K -->
        <div class="flex flex-col items-center space-y-3">
          <div v-if="players[1]" class="flex items-center gap-2 text-center">
            <div class="w-3 h-3 bg-w40k-red-500 rounded-full animate-pulse" />
            <span class="text-lg font-bold text-w40k-red-300">
              {{ players[1].pseudo }}
            </span>
            <span v-if="players[1].isMainPlayer" class="text-sm text-w40k-text-muted">(Vous)</span>
          </div>
          
          <div class="relative">
            <W40KScoreCell
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
            
            <!-- État d'attente d'adversaire avec design W40K -->
            <div v-else class="relative min-h-12 flex items-center justify-center border-2 border-dashed border-w40k-text-subtle/50 rounded-lg p-4 bg-w40k-bg-primary/50">
              <div class="flex items-center gap-2 text-w40k-text-muted animate-pulse">
                <div class="w-2 h-2 bg-w40k-text-muted rounded-full animate-bounce" />
                <span class="text-sm font-medium">En attente d'adversaire</span>
                <div class="w-2 h-2 bg-w40k-text-muted rounded-full animate-bounce" style="animation-delay: 0.2s" />
              </div>
              
              <!-- Décoration pour l'attente -->
              <div class="absolute top-1 right-1 text-xs text-w40k-text-subtle opacity-50">🛡️</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicateur de complétion automatique avec design W40K -->
    <div v-if="shouldShowCompletionHint" class="animate-in slide-in-from-bottom-2 duration-500 delay-300">
      <div class="relative mt-4 bg-gradient-to-r from-green-900/30 via-green-800/20 to-green-900/30 border border-green-500/50 rounded-lg p-3">
        <!-- Effet de fond pour la réussite -->
        <div class="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg" />
        
        <div class="relative flex items-center justify-center gap-2 text-sm">
          <div class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <span class="text-xs text-white font-bold">✓</span>
          </div>
          <span class="font-medium text-green-300">
            🏆 Round terminé automatiquement (tous les scores sont renseignés)
          </span>
        </div>
      </div>
    </div>

    <!-- Indicateur d'édition en cours -->
    <div v-if="isEditing" class="absolute -top-2 -right-2 z-10">
      <div class="bg-w40k-red-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg animate-pulse">
        ✏️ Édition en cours
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import W40KScoreCell from './W40KScoreCell.vue'
import type { RoundRowProps, ScoreUpdateEvent } from '../types'

const props = withDefaults(defineProps<RoundRowProps>(), {
  allowEditCompleted: false,
})

const emit = defineEmits<{
  'score-updated': [event: ScoreUpdateEvent]
  'round-completed': [roundId: number]
}>()

// État local
const isEditing = ref(false)

// Computed properties avec logique W40K
const isCurrent = computed(() => props.round.roundNumber === props.currentRound)

const statusText = computed(() => {
  if (props.round.isCompleted) return '🏆 Terminé'
  if (isCurrent.value) return '⚔️ En cours'
  return '📋 À venir'
})

const statusBadgeClasses = computed(() => {
  const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all duration-300 shadow-lg'
  
  if (props.round.isCompleted) {
    return `${baseClasses} bg-green-900/40 border-green-500 text-green-300 shadow-green-500/20`
  }
  
  if (isCurrent.value) {
    return `${baseClasses} bg-orange-900/40 border-orange-500 text-orange-300 shadow-orange-500/20 animate-pulse`
  }
  
  return `${baseClasses} bg-w40k-bg-primary border-w40k-text-subtle text-w40k-text-secondary`
})

const roundStateClasses = computed(() => {
  const baseClasses = 'relative transition-all duration-300 group'
  
  if (isEditing.value) {
    return `${baseClasses} scale-102 shadow-2xl shadow-w40k-red-500/20 ring-2 ring-w40k-red-500/50`
  }
  
  if (props.round.isCompleted) {
    return `${baseClasses} hover:shadow-xl hover:shadow-green-500/10`
  }
  
  if (isCurrent.value) {
    return `${baseClasses} shadow-xl shadow-orange-500/20 hover:scale-101`
  }
  
  return `${baseClasses} hover:shadow-lg hover:shadow-w40k-red-500/10`
})

// Logique de complétion automatique
const shouldShowCompletionHint = computed(() => {
  return (
    props.round.isCompleted &&
    props.round.playerScore !== null &&
    props.round.opponentScore !== null &&
    (props.round.playerScore > 0 || props.round.opponentScore > 0)
  )
})

// Gestionnaires d'événements
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
/* Animations W40K */
.scale-101 {
  transform: scale(1.01);
}

.scale-102 {
  transform: scale(1.02);
}

@keyframes animate-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: animate-in 0.6s ease-out forwards;
}

/* Effet de survol sur le groupe */
.group:hover .animate-pulse {
  animation-duration: 1s;
}

/* Responsive optimisations W40K */
@media (max-width: 768px) {
  .text-2xl { font-size: 1.5rem; }
  .text-xl { font-size: 1.25rem; }
  .text-lg { font-size: 1.125rem; }
  .px-6 { padding-left: 1rem; padding-right: 1rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .gap-6 { gap: 1rem; }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .gap-6 { gap: 1.25rem; }
}
</style>