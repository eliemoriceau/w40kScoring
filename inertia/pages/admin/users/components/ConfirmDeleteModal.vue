<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
      <!-- Overlay -->
      <div
        class="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75"
        @click="$emit('close')"
      ></div>

      <!-- Modal -->
      <div
        class="relative inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-slate-800 border border-red-800/50 shadow-xl rounded-lg"
      >
        <!-- Icône d'avertissement -->
        <div
          class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-600/20 rounded-full"
        >
          <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <!-- En-tête -->
        <div class="text-center mb-6">
          <h3 class="text-lg font-bold text-red-400 mb-2">Supprimer l'utilisateur</h3>
          <p class="text-slate-300">Êtes-vous sûr de vouloir supprimer cet utilisateur ?</p>
        </div>

        <!-- Informations utilisateur -->
        <div class="bg-slate-700/50 rounded-lg p-4 mb-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-10 w-10">
              <div
                class="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold"
              >
                {{ user.username.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-white">{{ user.username }}</p>
              <p class="text-sm text-slate-400">{{ user.email }}</p>
              <p class="text-xs text-slate-500">
                {{ user.role.name }} • Membre depuis {{ user.createdAt }}
              </p>
            </div>
          </div>
        </div>

        <!-- Avertissements -->
        <div class="space-y-4 mb-6">
          <!-- Avertissement général -->
          <div class="bg-red-900/50 border border-red-800/50 rounded-lg p-4">
            <div class="flex items-start">
              <svg
                class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M18.364 5.636l-1.414 1.414L12 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12 5.636 7.05l1.414-1.414L12 10.586l4.95-4.95z"
                />
              </svg>
              <div class="ml-3 text-sm">
                <p class="text-red-300 font-medium">Cette action est irréversible</p>
                <ul class="text-red-200 mt-2 space-y-1 list-disc list-inside">
                  <li>Toutes les données de l'utilisateur seront supprimées</li>
                  <li>L'historique des parties sera conservé mais anonymisé</li>
                  <li>Cette action sera enregistrée dans les logs d'audit</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Avertissement spécial pour les admins -->
          <div
            v-if="user.role.permissionLevel >= 3"
            class="bg-yellow-900/50 border border-yellow-800/50 rounded-lg p-4"
          >
            <div class="flex items-start">
              <svg
                class="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div class="ml-3 text-sm">
                <p class="text-yellow-300 font-medium">Attention - Utilisateur privilégié</p>
                <p class="text-yellow-200 mt-1">
                  Cet utilisateur a des privilèges administrateur. Assurez-vous qu'il reste au moins
                  un autre administrateur sur le système.
                </p>
              </div>
            </div>
          </div>

          <!-- Données associées -->
          <div class="bg-slate-700/50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-slate-300 mb-2">Données qui seront affectées</h4>
            <div class="text-sm text-slate-400 space-y-1">
              <div class="flex justify-between">
                <span>Parties jouées :</span>
                <span class="text-white">{{ user.stats?.totalParties || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span>Scores enregistrés :</span>
                <span class="text-white">Anonymisés</span>
              </div>
              <div class="flex justify-between">
                <span>Compte utilisateur :</span>
                <span class="text-red-400">Supprimé définitivement</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Confirmation -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Pour confirmer, tapez le nom d'utilisateur : <strong>{{ user.username }}</strong>
          </label>
          <input
            v-model="confirmationText"
            type="text"
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            :placeholder="user.username"
            autocomplete="off"
          />
        </div>

        <!-- Erreur -->
        <div v-if="error" class="mb-6 bg-red-900/50 border border-red-800/50 rounded-lg p-4">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M18.364 5.636l-1.414 1.414L12 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12 5.636 7.05l1.414-1.414L12 10.586l4.95-4.95z"
              />
            </svg>
            <div class="ml-3 text-sm">
              <p class="text-red-300">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            :disabled="deleting"
          >
            Annuler
          </button>
          <button
            @click="deleteUser"
            class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            :disabled="!canDelete || deleting"
          >
            <svg v-if="deleting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {{ deleting ? 'Suppression...' : 'Supprimer définitivement' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { router } from '@inertiajs/vue3'

// Props
interface Props {
  user: {
    id: number
    username: string
    email: string
    role: {
      name: string
      permissionLevel: number
    }
    createdAt: string
    stats?: {
      totalParties: number
    }
  }
}

const props = defineProps<Props>()

// Émissions
const emit = defineEmits<{
  close: []
  confirmed: []
}>()

// État du composant
const confirmationText = ref('')
const deleting = ref(false)
const error = ref('')

// Vérifier si la suppression peut être effectuée
const canDelete = computed(() => {
  return confirmationText.value === props.user.username
})

// Supprimer l'utilisateur
const deleteUser = () => {
  if (!canDelete.value || deleting.value) return

  deleting.value = true
  error.value = ''

  router.delete(`/admin/users/${props.user.id}`, {
    onSuccess: () => {
      emit('confirmed')
    },
    onError: (errors) => {
      error.value = errors.message || 'Une erreur est survenue lors de la suppression'
    },
    onFinish: () => {
      deleting.value = false
    },
  })
}
</script>
