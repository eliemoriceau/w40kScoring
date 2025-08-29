<template>
  <!-- Modal backdrop -->
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-slate-800 border border-red-800/50 rounded-lg shadow-xl w-full max-w-md">
      <!-- Modal header -->
      <div class="px-6 py-4 border-b border-red-800/50">
        <h3 class="text-lg font-semibold text-yellow-400">Modifier le statut de la partie</h3>
      </div>

      <!-- Modal body -->
      <div class="px-6 py-4 space-y-4">
        <div>
          <div class="text-sm text-slate-300 mb-2">
            <span class="font-medium text-slate-200">Partie :</span> #{{ game?.id }}
          </div>
          <div class="text-sm text-slate-300 mb-4">
            <span class="font-medium text-slate-200">Statut actuel :</span>
            <span :class="getStatusClasses(game?.status)" class="ml-2">
              {{ formatStatus(game?.status) }}
            </span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2"> Nouveau statut </label>
          <div class="space-y-2">
            <label
              v-for="statusOption in availableStatuses"
              :key="statusOption.value"
              :class="[
                'flex items-center p-3 border rounded-lg cursor-pointer transition-colors',
                selectedStatus === statusOption.value
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-slate-600 hover:border-slate-500',
              ]"
            >
              <input
                v-model="selectedStatus"
                type="radio"
                :value="statusOption.value"
                class="sr-only"
              />
              <div class="flex items-center justify-between w-full">
                <div>
                  <div class="text-white font-medium">{{ statusOption.label }}</div>
                  <div class="text-sm text-slate-400">{{ statusOption.description }}</div>
                </div>
                <div
                  class="w-4 h-4 border-2 border-slate-400 rounded-full flex items-center justify-center"
                >
                  <div
                    v-if="selectedStatus === statusOption.value"
                    class="w-2 h-2 bg-red-400 rounded-full"
                  ></div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Avertissements selon le statut sélectionné -->
        <div
          v-if="getStatusWarning()"
          class="p-3 border border-yellow-600/30 bg-yellow-900/20 rounded-lg"
        >
          <div class="flex items-start gap-2">
            <svg
              class="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.992-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p class="text-sm text-yellow-300">{{ getStatusWarning() }}</p>
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
          @click="confirmChange"
          :disabled="!selectedStatus || selectedStatus === game?.status"
          class="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Confirmer le changement
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  game: any
}

interface Emits {
  (e: 'confirm', status: string): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedStatus = ref(props.game?.status || '')

const availableStatuses = computed(() => {
  const allStatuses = [
    {
      value: 'PLANNED',
      label: 'Planifiée',
      description: 'La partie est prévue mais pas encore démarrée',
    },
    {
      value: 'IN_PROGRESS',
      label: 'En cours',
      description: 'La partie est actuellement jouée',
    },
    {
      value: 'COMPLETED',
      label: 'Terminée',
      description: 'La partie est terminée avec un résultat final',
    },
    {
      value: 'CANCELLED',
      label: 'Annulée',
      description: 'La partie a été annulée et ne peut plus être jouée',
    },
  ]

  // Filtrer les statuts logiques selon l'état actuel
  const currentStatus = props.game?.status
  return allStatuses.filter((status) => {
    // On peut toujours annuler (sauf si déjà annulé)
    if (status.value === 'CANCELLED') {
      return currentStatus !== 'CANCELLED'
    }

    // Les autres transitions sont possibles selon la logique métier
    return true
  })
})

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
  const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium'
  const variants = {
    PLANNED: `${base} bg-blue-100 text-blue-800`,
    IN_PROGRESS: `${base} bg-yellow-100 text-yellow-800`,
    COMPLETED: `${base} bg-green-100 text-green-800`,
    CANCELLED: `${base} bg-red-100 text-red-800`,
  }
  return variants[status as keyof typeof variants] || `${base} bg-gray-100 text-gray-800`
}

const getStatusWarning = () => {
  const currentStatus = props.game?.status
  const newStatus = selectedStatus.value

  if (newStatus === 'CANCELLED') {
    return 'Une fois annulée, la partie ne pourra plus être modifiée ou reprise.'
  }

  if (currentStatus === 'COMPLETED' && newStatus !== 'COMPLETED') {
    return "Modifier une partie terminée peut affecter les statistiques et l'historique."
  }

  if (newStatus === 'COMPLETED' && !props.game?.playerScore && !props.game?.opponentScore) {
    return 'Cette partie ne semble pas avoir de scores finaux définis.'
  }

  return null
}

const confirmChange = () => {
  if (selectedStatus.value && selectedStatus.value !== props.game?.status) {
    emit('confirm', selectedStatus.value)
  }
}
</script>
