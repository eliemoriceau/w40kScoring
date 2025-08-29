<template>
  <!-- Modal backdrop -->
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-slate-800 border border-red-800/50 rounded-lg shadow-xl w-full max-w-md">
      <!-- Modal header -->
      <div class="px-6 py-4 border-b border-red-800/50">
        <h3 class="text-lg font-semibold text-red-400">Confirmer l'annulation</h3>
      </div>

      <!-- Modal body -->
      <div class="px-6 py-4">
        <div class="flex items-start gap-4">
          <div
            class="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.992-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <p class="text-white font-medium mb-2">
              Êtes-vous sûr de vouloir annuler cette partie ?
            </p>
            <div class="space-y-2 text-sm text-slate-300">
              <div><span class="font-medium text-slate-200">Partie :</span> #{{ game?.id }}</div>
              <div>
                <span class="font-medium text-slate-200">Joueurs :</span>
                {{ game?.user?.username }}
                vs
                {{ game?.opponent?.username || 'IA/Bot' }}
              </div>
              <div>
                <span class="font-medium text-slate-200">Type :</span>
                {{ formatGameType(game?.gameType) }} ({{ game?.pointsLimit }} pts)
              </div>
              <div>
                <span class="font-medium text-slate-200">Statut actuel :</span>
                <span :class="getStatusClasses(game?.status)">
                  {{ formatStatus(game?.status) }}
                </span>
              </div>
            </div>
            <div class="mt-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
              <p class="text-sm text-red-300">
                <svg
                  class="w-4 h-4 inline mr-1"
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
                Cette action marquera la partie comme annulée. Elle restera visible dans
                l'historique mais ne pourra plus être modifiée.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal footer -->
      <div class="px-6 py-4 border-t border-red-800/50 flex justify-end gap-3">
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 transition-colors"
        >
          Annuler
        </button>
        <button
          @click="$emit('confirm')"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Confirmer l'annulation
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  game: any
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formatGameType = (type?: string) => {
  if (!type) return 'Inconnu'
  const types = {
    MATCHED_PLAY: 'Jeu Équilibré',
    NARRATIVE: 'Narratif',
    OPEN_PLAY: 'Jeu Libre',
  }
  return types[type as keyof typeof types] || type
}

const formatStatus = (status?: string) => {
  if (!status) return 'Inconnu'
  const statuses = {
    PLANNED: 'Planifiée',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
  }
  return statuses[status as keyof typeof statuses] || status
}

const getStatusClasses = (status?: string) => {
  const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-1'
  const variants = {
    PLANNED: `${base} bg-blue-100 text-blue-800`,
    IN_PROGRESS: `${base} bg-yellow-100 text-yellow-800`,
    COMPLETED: `${base} bg-green-100 text-green-800`,
    CANCELLED: `${base} bg-red-100 text-red-800`,
  }
  return variants[status as keyof typeof variants] || `${base} bg-gray-100 text-gray-800`
}
</script>
