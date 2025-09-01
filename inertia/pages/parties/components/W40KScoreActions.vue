<template>
  <div class="w40k-score-actions">
    <!-- Barre d'actions principale -->
    <div class="bg-w40k-bg-card border border-w40k-border/30 rounded-xl p-6 shadow-lg">
      <div class="flex flex-col lg:flex-row items-center justify-between gap-4">
        <!-- État et indicateurs -->
        <div class="flex items-center gap-4">
          <!-- Indicateur d'auto-save -->
          <div v-if="autoSaving" class="flex items-center gap-2 text-sm text-w40k-text-muted">
            <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Sauvegarde automatique...</span>
          </div>

          <!-- Indicateur de modifications -->
          <div v-else-if="canSave" class="flex items-center gap-2 text-sm text-orange-400">
            <div class="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span>Modifications non sauvegardées</span>
          </div>

          <!-- Indicateur sauvegardé -->
          <div v-else class="flex items-center gap-2 text-sm text-green-400">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            <span>Tous les scores sauvegardés</span>
          </div>
        </div>

        <!-- Actions principales -->
        <div class="flex items-center gap-3">
          <!-- Bouton Reset -->
          <button
            v-if="canSave"
            @click="handleReset"
            :disabled="saving"
            class="px-4 py-2 text-sm font-medium text-w40k-text-secondary hover:text-w40k-text-primary border border-w40k-border hover:border-w40k-border-hover rounded-lg transition-all duration-200 hover:bg-w40k-bg-elevated disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            Annuler
          </button>

          <!-- Bouton Sauvegarde manuel -->
          <button
            @click="handleSave"
            :disabled="!canSave || saving"
            :class="[
              'px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg',
              canSave && !saving
                ? 'bg-gradient-to-r from-w40k-gold-500 to-w40k-gold-600 hover:from-w40k-gold-600 hover:to-w40k-gold-700 text-w40k-dark-900 shadow-w40k-gold-500/25'
                : 'bg-w40k-bg-elevated text-w40k-text-muted cursor-not-allowed border border-w40k-border',
            ]"
          >
            <svg
              v-if="saving"
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>

            <svg
              v-else-if="canSave"
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>

            <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>

            <span>
              {{ saving ? 'Sauvegarde...' : canSave ? 'Sauvegarder' : 'Sauvegardé' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Barre de progression pour la sauvegarde -->
      <div v-if="saving" class="mt-4">
        <div class="w-full bg-w40k-bg-secondary rounded-full h-1 overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-w40k-gold-400 to-w40k-gold-600 animate-pulse"
            style="width: 100%"
          ></div>
        </div>
      </div>
    </div>

    <!-- Actions secondaires -->
    <div
      class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-w40k-text-muted"
    >
      <!-- Informations de session -->
      <div class="flex items-center gap-4">
        <div v-if="lastSaved" class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 001.414-1.415L11 9.586V6z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Dernière sauvegarde: {{ formatTime(lastSaved) }}</span>
        </div>

        <div class="flex items-center gap-2">
          <div :class="['w-2 h-2 rounded-full', isOnline ? 'bg-green-400' : 'bg-red-400']"></div>
          <span>{{ isOnline ? 'En ligne' : 'Hors ligne' }}</span>
        </div>
      </div>

      <!-- Raccourcis clavier -->
      <div class="hidden lg:flex items-center gap-4 text-xs">
        <div class="flex items-center gap-1">
          <kbd
            class="px-2 py-1 bg-w40k-bg-elevated rounded border border-w40k-border text-w40k-text-secondary"
            >Ctrl</kbd
          >
          <span>+</span>
          <kbd
            class="px-2 py-1 bg-w40k-bg-elevated rounded border border-w40k-border text-w40k-text-secondary"
            >S</kbd
          >
          <span class="ml-2">Sauvegarder</span>
        </div>

        <div class="flex items-center gap-1">
          <kbd
            class="px-2 py-1 bg-w40k-bg-elevated rounded border border-w40k-border text-w40k-text-secondary"
            >Ctrl</kbd
          >
          <span>+</span>
          <kbd
            class="px-2 py-1 bg-w40k-bg-elevated rounded border border-w40k-border text-w40k-text-secondary"
            >Z</kbd
          >
          <span class="ml-2">Annuler</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  canSave: boolean
  saving: boolean
  autoSaving?: boolean
  lastSaved?: Date
}

interface Emits {
  (e: 'save'): void
  (e: 'reset'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// État local
const isOnline = ref(navigator.onLine)

// Gestionnaires d'événements
const handleSave = () => {
  emit('save')
}

const handleReset = () => {
  if (confirm('Êtes-vous sûr de vouloir annuler toutes les modifications ?')) {
    emit('reset')
  }
}

// Raccourcis clavier
const handleKeyboard = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault()
        if (props.canSave && !props.saving) {
          handleSave()
        }
        break
      case 'z':
        event.preventDefault()
        if (props.canSave) {
          handleReset()
        }
        break
    }
  }
}

// Détection du statut en ligne
const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

// Formatage du temps
const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeyboard)
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboard)
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
.w40k-score-actions {
  /* Animation d'entrée */
  animation: slideInUp 0.4s ease-out;
}

/* Effet de glow pour le bouton de sauvegarde actif */
.shadow-w40k-gold-500\/25 {
  box-shadow: 0 4px 14px 0 rgba(234, 179, 8, 0.25);
}

/* Animation de la barre de progression */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Style des touches de raccourci */
kbd {
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.75rem;
  line-height: 1;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .w40k-score-actions .lg\:flex-row {
    flex-direction: column;
  }

  .w40k-score-actions .lg\:flex {
    display: none;
  }
}
</style>
