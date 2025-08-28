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
        <!-- En-tête -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-red-400">Modifier le rôle</h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
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
                Rôle actuel : <span class="text-red-400 font-medium">{{ user.role.name }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="changeRole" class="space-y-4">
          <!-- Sélection du rôle -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"> Nouveau rôle * </label>
            <select
              v-model="selectedRoleId"
              required
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              :class="{ 'border-red-500': error }"
            >
              <option value="">Sélectionner un rôle</option>
              <option
                v-for="role in roles"
                :key="role.id"
                :value="role.id"
                :disabled="role.id === user.role.id"
              >
                {{ role.name }} (Niveau {{ role.permissionLevel }})
                <span v-if="role.id === user.role.id"> - Actuel</span>
              </option>
            </select>
            <div class="text-slate-500 text-xs mt-1 space-y-1">
              <p>• <strong>USER (1)</strong> : Accès basique à l'application</p>
              <p>• <strong>MODERATOR (2)</strong> : Peut voir les utilisateurs</p>
              <p>• <strong>ADMIN (3)</strong> : Accès complet au panel admin</p>
            </div>
          </div>

          <!-- Raison du changement -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Raison du changement
            </label>
            <textarea
              v-model="reason"
              rows="3"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Optionnel : expliquez pourquoi ce changement est nécessaire..."
            ></textarea>
          </div>

          <!-- Avertissement pour les admins -->
          <div
            v-if="
              user.role.permissionLevel >= 3 && selectedRole && selectedRole.permissionLevel < 3
            "
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
                <p class="text-yellow-300 font-medium">Attention - Réduction des privilèges</p>
                <p class="text-yellow-200 mt-1">
                  Vous retirez les privilèges administrateur à cet utilisateur. Assurez-vous qu'il
                  reste au moins un autre administrateur sur le système.
                </p>
              </div>
            </div>
          </div>

          <!-- Avertissement auto-modification -->
          <div
            v-if="user.id === $page.props.auth.user?.id"
            class="bg-red-900/50 border border-red-800/50 rounded-lg p-4"
          >
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
                <p class="text-red-300 font-medium">Modification de votre propre rôle</p>
                <p class="text-red-200 mt-1">
                  Vous ne pouvez pas modifier votre propre rôle pour des raisons de sécurité.
                </p>
              </div>
            </div>
          </div>

          <!-- Erreur -->
          <div v-if="error" class="bg-red-900/50 border border-red-800/50 rounded-lg p-4">
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
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-600">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              :disabled="submitting"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              :disabled="!canSubmit || submitting"
            >
              <svg v-if="submitting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
              {{ submitting ? 'Modification...' : 'Modifier le rôle' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { router, usePage } from '@inertiajs/vue3'

// Props
interface Props {
  user: {
    id: number
    username: string
    email: string
    role: {
      id: number
      name: string
      permissionLevel: number
    }
  }
  roles: Array<{
    id: number
    name: string
    permissionLevel: number
  }>
}

const props = defineProps<Props>()

// Émissions
const emit = defineEmits<{
  close: []
  changed: []
}>()

// État du composant
const selectedRoleId = ref<number | string>('')
const reason = ref('')
const submitting = ref(false)
const error = ref('')

// Page props pour l'utilisateur connecté
const page = usePage()

// Rôle sélectionné complet
const selectedRole = computed(() => {
  if (!selectedRoleId.value) return null
  return props.roles.find((role) => role.id === Number(selectedRoleId.value))
})

// Vérifier si le formulaire peut être soumis
const canSubmit = computed(() => {
  // Ne peut pas modifier son propre rôle
  if (props.user.id === page.props.auth?.user?.id) return false

  // Doit avoir sélectionné un rôle différent
  if (!selectedRoleId.value || Number(selectedRoleId.value) === props.user.role.id) return false

  return true
})

// Modifier le rôle
const changeRole = () => {
  if (!canSubmit.value || submitting.value) return

  submitting.value = true
  error.value = ''

  router.put(
    `/admin/users/${props.user.id}/role`,
    {
      roleId: Number(selectedRoleId.value),
      reason: reason.value.trim() || undefined,
    },
    {
      onSuccess: () => {
        emit('changed')
      },
      onError: (errors) => {
        if (errors.roleId) {
          error.value = errors.roleId
        } else if (errors.general) {
          error.value = errors.general
        } else {
          error.value = errors.message || 'Une erreur est survenue lors de la modification du rôle'
        }
      },
      onFinish: () => {
        submitting.value = false
      },
    }
  )
}
</script>
