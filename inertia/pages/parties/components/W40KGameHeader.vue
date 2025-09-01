<template>
  <div
    class="w40k-game-header bg-gradient-to-r from-w40k-red-900 to-w40k-dark-900 border-b border-w40k-gold-500/30 shadow-xl"
  >
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Titre de la partie avec thématique W40K -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <!-- Titre principal -->
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 bg-gradient-to-br from-w40k-gold-400 to-w40k-gold-600 rounded-lg flex items-center justify-center shadow-lg"
          >
            <svg class="w-6 h-6 text-w40k-dark-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div>
            <h1 class="text-2xl font-bold text-w40k-gold-100 font-w40k tracking-wide">
              {{ game?.title || 'Bataille W40K' }}
            </h1>
            <p class="text-w40k-text-muted">{{ game?.gameType }} • {{ game?.pointsLimit }}pts</p>
          </div>
        </div>

        <!-- Sélecteur de Round -->
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-w40k-text-muted">Round actuel:</span>

          <div class="flex items-center gap-1">
            <button
              v-for="round in totalRounds"
              :key="round"
              @click="handleRoundChange(round)"
              :class="[
                'w-10 h-10 rounded-lg font-bold transition-all duration-200 relative overflow-hidden',
                currentRound === round
                  ? 'bg-gradient-to-br from-w40k-gold-400 to-w40k-gold-600 text-w40k-dark-900 shadow-lg scale-110'
                  : 'bg-w40k-bg-elevated hover:bg-w40k-bg-elevated/80 text-w40k-text-secondary hover:text-w40k-gold-400 border border-w40k-border/30',
              ]"
            >
              {{ round }}

              <!-- Indicateur de round complété -->
              <div
                v-if="isRoundCompleted(round)"
                class="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full animate-pulse"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Barre de progression globale -->
      <div class="mt-6">
        <div class="flex items-center justify-between text-sm text-w40k-text-muted mb-2">
          <span>Progression de la bataille</span>
          <span>{{ currentRound }}/{{ totalRounds }} rounds</span>
        </div>

        <div class="w-full bg-w40k-bg-secondary rounded-full h-2 overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-w40k-red-500 to-w40k-gold-500 transition-all duration-500 ease-out"
            :style="{ width: `${(currentRound / totalRounds) * 100}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GameDetailDto } from '../types'

interface Props {
  game: GameDetailDto
  currentRound: number
}

interface Emits {
  (e: 'round-change', round: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Constantes W40K
const totalRounds = computed(() => 5) // W40K standard

// Actions
const handleRoundChange = (round: number) => {
  emit('round-change', round)
}

// État des rounds
const isRoundCompleted = (round: number): boolean => {
  // Logique pour déterminer si un round est complété
  // À adapter selon la structure des données
  return round < props.currentRound
}
</script>

<style scoped>
.w40k-game-header {
  /* Variables CSS personnalisées pour consistance */
  --w40k-shadow-color: rgba(220, 38, 38, 0.25);
  box-shadow: 0 4px 14px var(--w40k-shadow-color);
}

/* Animation d'entrée pour les boutons de round */
.w40k-round-button {
  position: relative;
  overflow: hidden;
}

.w40k-round-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.w40k-round-button:hover::before {
  left: 100%;
}

/* Animation de la barre de progression */
@keyframes battleProgress {
  0% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}
</style>
