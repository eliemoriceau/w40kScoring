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
        class="relative inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-slate-800 border border-red-800/50 shadow-xl rounded-lg"
      >
        <!-- En-tête -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-red-400">Modifier l'utilisateur</h3>
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
              <p class="text-sm text-slate-400">Membre depuis {{ user.createdAt }}</p>
            </div>
          </div>
        </div>

        <!-- Onglets -->
        <div class="border-b border-slate-600 mb-6">
          <nav class="flex space-x-8">
            <button
              @click="activeTab = 'profile'"
              class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
              :class="
                activeTab === 'profile'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
              "
            >
              Profil
            </button>
            <button
              @click="activeTab = 'role'"
              class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
              :class="
                activeTab === 'role'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
              "
            >
              Rôle & Permissions
            </button>
            <button
              @click="activeTab = 'security'"
              class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
              :class="
                activeTab === 'security'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
              "
            >
              Sécurité
            </button>
          </nav>
        </div>

        <!-- Contenu des onglets -->
        <form @submit.prevent="updateUser">
          <!-- Onglet Profil -->
          <div v-show="activeTab === 'profile'" class="space-y-4">
            <!-- Nom d'utilisateur -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Nom d'utilisateur *
              </label>
              <input
                v-model="form.username"
                type="text"
                required
                pattern="[a-zA-Z0-9_-]+"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                :class="{ 'border-red-500': errors.username }"
              />
              <p v-if="errors.username" class="text-red-400 text-sm mt-1">
                {{ errors.username }}
              </p>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2"> Adresse email * </label>
              <input
                v-model="form.email"
                type="email"
                required
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                :class="{ 'border-red-500': errors.email }"
              />
              <p v-if="errors.email" class="text-red-400 text-sm mt-1">
                {{ errors.email }}
              </p>
            </div>

            <!-- Nom complet -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2"> Nom complet </label>
              <input
                v-model="form.fullName"
                type="text"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                :class="{ 'border-red-500': errors.fullName }"
              />
              <p v-if="errors.fullName" class="text-red-400 text-sm mt-1">
                {{ errors.fullName }}
              </p>
            </div>

            <!-- Consentement newsletter -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="form.newsletterConsent"
                  type="checkbox"
                  class="rounded bg-slate-700 border-slate-600 text-red-600 focus:ring-red-500 focus:ring-offset-slate-800"
                />
                <span class="ml-2 text-sm text-slate-300">
                  Consentement à recevoir la newsletter
                </span>
              </label>
            </div>
          </div>

          <!-- Onglet Rôle -->
          <div v-show="activeTab === 'role'" class="space-y-4">
            <!-- Rôle actuel -->
            <div class="bg-slate-700/50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-slate-300 mb-2">Rôle actuel</h4>
              <div class="flex items-center justify-between">
                <div>
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                  >
                    {{ user.role.name }}
                  </span>
                  <p class="text-xs text-slate-400 mt-1">
                    Niveau de permission: {{ user.role.permissionLevel }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Nouveau rôle -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2"> Nouveau rôle </label>
              <select
                v-model="form.roleId"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                :class="{ 'border-red-500': errors.roleId }"
              >
                <option :value="user.role.id">Garder le rôle actuel ({{ user.role.name }})</option>
                <option
                  v-for="role in roles.filter((r) => r.id !== user.role.id)"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ role.name }} (Niveau {{ role.permissionLevel }})
                </option>
              </select>
              <p v-if="errors.roleId" class="text-red-400 text-sm mt-1">
                {{ errors.roleId }}
              </p>
            </div>

            <!-- Avertissement changement de rôle -->
            <div
              v-if="form.roleId !== user.role.id"
              class="bg-yellow-900/50 border border-yellow-800/50 rounded-lg p-4"
            >
              <div class="flex items-start">
                <svg class="w-5 h-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div class="ml-3 text-sm">
                  <p class="text-yellow-300 font-medium">Attention</p>
                  <p class="text-yellow-200 mt-1">
                    Le changement de rôle modifiera immédiatement les permissions de l'utilisateur.
                    Cette action sera enregistrée dans les logs d'audit.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Onglet Sécurité -->
          <div v-show="activeTab === 'security'" class="space-y-4">
            <!-- Réinitialisation mot de passe -->
            <div class="bg-slate-700/50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-slate-300 mb-2">
                Réinitialisation du mot de passe
              </h4>
              <p class="text-sm text-slate-400 mb-4">
                Générer un nouveau mot de passe temporaire pour cet utilisateur.
              </p>
              <button
                type="button"
                @click="resetPassword"
                class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-white text-sm transition-colors"
                :disabled="resettingPassword"
              >
                {{ resettingPassword ? 'Réinitialisation...' : 'Réinitialiser le mot de passe' }}
              </button>
            </div>

            <!-- Options de sécurité -->
            <div>
              <label class="flex items-center">
                <input
                  v-model="form.forcePasswordReset"
                  type="checkbox"
                  class="rounded bg-slate-700 border-slate-600 text-red-600 focus:ring-red-500 focus:ring-offset-slate-800"
                />
                <span class="ml-2 text-sm text-slate-300">
                  Forcer le changement de mot de passe à la prochaine connexion
                </span>
              </label>
            </div>
          </div>

          <!-- Erreur générale -->
          <div
            v-if="errors.general"
            class="mt-4 bg-red-900/50 border border-red-800/50 rounded-lg p-4"
          >
            <div class="flex items-start">
              <svg class="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M18.364 5.636l-1.414 1.414L12 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12 5.636 7.05l1.414-1.414L12 10.586l4.95-4.95z"
                />
              </svg>
              <div class="ml-3 text-sm">
                <p class="text-red-300">{{ errors.general }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-600">
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
              :disabled="submitting || !hasChanges"
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
              {{ submitting ? 'Modification...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { router } from '@inertiajs/vue3'

// Props
interface Props {
  user: {
    id: number
    username: string
    email: string
    fullName: string | null
    role: {
      id: number
      name: string
      permissionLevel: number
    }
    newsletterConsent: boolean
    createdAt: string
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
  updated: []
}>()

// État du composant
const activeTab = ref<'profile' | 'role' | 'security'>('profile')
const submitting = ref(false)
const resettingPassword = ref(false)

// Formulaire
const form = reactive({
  username: props.user.username,
  email: props.user.email,
  fullName: props.user.fullName || '',
  roleId: props.user.role.id,
  newsletterConsent: props.user.newsletterConsent,
  forcePasswordReset: false,
})

// Erreurs
const errors = reactive({
  username: '',
  email: '',
  fullName: '',
  roleId: '',
  general: '',
})

// Vérifier s'il y a des changements
const hasChanges = computed(() => {
  return (
    form.username !== props.user.username ||
    form.email !== props.user.email ||
    (form.fullName || '') !== (props.user.fullName || '') ||
    form.roleId !== props.user.role.id ||
    form.newsletterConsent !== props.user.newsletterConsent ||
    form.forcePasswordReset
  )
})

// Réinitialiser les erreurs
const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = ''
  })
}

// Validation côté client
const validateForm = (): boolean => {
  clearErrors()
  let isValid = true

  if (!form.username.trim()) {
    errors.username = "Le nom d'utilisateur est requis"
    isValid = false
  }

  if (!form.email.trim()) {
    errors.email = "L'adresse email est requise"
    isValid = false
  }

  return isValid
}

// Mise à jour de l'utilisateur
const updateUser = () => {
  if (!validateForm() || submitting.value || !hasChanges.value) return

  submitting.value = true
  clearErrors()

  const updateData: any = {}

  if (form.username !== props.user.username) {
    updateData.username = form.username.trim().toLowerCase()
  }
  if (form.email !== props.user.email) {
    updateData.email = form.email.trim().toLowerCase()
  }
  if ((form.fullName || '') !== (props.user.fullName || '')) {
    updateData.fullName = form.fullName.trim() || null
  }
  if (form.roleId !== props.user.role.id) {
    updateData.roleId = form.roleId
  }
  if (form.newsletterConsent !== props.user.newsletterConsent) {
    updateData.newsletterConsent = form.newsletterConsent
  }
  if (form.forcePasswordReset) {
    updateData.forcePasswordReset = form.forcePasswordReset
  }

  router.put(`/admin/users/${props.user.id}`, updateData, {
    onSuccess: () => {
      emit('updated')
    },
    onError: (responseErrors) => {
      if (responseErrors.username) errors.username = responseErrors.username
      if (responseErrors.email) errors.email = responseErrors.email
      if (responseErrors.fullName) errors.fullName = responseErrors.fullName
      if (responseErrors.roleId) errors.roleId = responseErrors.roleId
      if (responseErrors.general) errors.general = responseErrors.general

      if (!Object.keys(responseErrors).some((key) => key !== 'message')) {
        errors.general = responseErrors.message || 'Une erreur est survenue lors de la modification'
      }
    },
    onFinish: () => {
      submitting.value = false
    },
  })
}

// Réinitialisation du mot de passe
const resetPassword = () => {
  if (resettingPassword.value) return

  resettingPassword.value = true

  router.post(
    `/admin/users/${props.user.id}/reset-password`,
    {},
    {
      onSuccess: () => {
        // Le message de succès sera affiché via la notification flash
      },
      onError: (responseErrors) => {
        errors.general =
          responseErrors.message || 'Erreur lors de la réinitialisation du mot de passe'
      },
      onFinish: () => {
        resettingPassword.value = false
      },
    }
  )
}
</script>
