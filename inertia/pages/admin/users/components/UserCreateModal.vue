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
          <h3 class="text-xl font-bold text-red-400">Créer un nouvel utilisateur</h3>
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

        <!-- Formulaire -->
        <form @submit.prevent="createUser" class="space-y-4">
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
              placeholder="ex: john_doe"
              :class="{ 'border-red-500': errors.username }"
            />
            <p v-if="errors.username" class="text-red-400 text-sm mt-1">
              {{ errors.username }}
            </p>
            <p class="text-slate-500 text-xs mt-1">
              Lettres, chiffres, tirets et underscores uniquement. Sera converti en minuscules.
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
              placeholder="ex: john.doe@example.com"
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
              placeholder="ex: John Doe"
              :class="{ 'border-red-500': errors.fullName }"
            />
            <p v-if="errors.fullName" class="text-red-400 text-sm mt-1">
              {{ errors.fullName }}
            </p>
          </div>

          <!-- Rôle -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"> Rôle * </label>
            <select
              v-model="form.roleId"
              required
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              :class="{ 'border-red-500': errors.roleId }"
            >
              <option value="">Sélectionner un rôle</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }} (Niveau {{ role.permissionLevel }})
              </option>
            </select>
            <p v-if="errors.roleId" class="text-red-400 text-sm mt-1">
              {{ errors.roleId }}
            </p>
            <div class="text-slate-500 text-xs mt-1 space-y-1">
              <p>• <strong>USER (1)</strong> : Accès basique à l'application</p>
              <p>• <strong>MODERATOR (2)</strong> : Peut voir les utilisateurs</p>
              <p>• <strong>ADMIN (3)</strong> : Accès complet au panel admin</p>
            </div>
          </div>

          <!-- Options -->
          <div>
            <label class="flex items-center">
              <input
                v-model="form.sendWelcomeEmail"
                type="checkbox"
                class="rounded bg-slate-700 border-slate-600 text-red-600 focus:ring-red-500 focus:ring-offset-slate-800"
              />
              <span class="ml-2 text-sm text-slate-300">
                Envoyer un email de bienvenue avec le mot de passe temporaire
              </span>
            </label>
          </div>

          <!-- Message d'information -->
          <div class="bg-blue-900/50 border border-blue-800/50 rounded-lg p-4">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="ml-3 text-sm">
                <p class="text-blue-300 font-medium">Mot de passe temporaire</p>
                <p class="text-blue-200 mt-1">
                  Un mot de passe temporaire sera généré automatiquement. L'utilisateur devra le
                  changer lors de sa première connexion.
                </p>
              </div>
            </div>
          </div>

          <!-- Erreur générale -->
          <div v-if="errors.general" class="bg-red-900/50 border border-red-800/50 rounded-lg p-4">
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
              :disabled="submitting"
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
              {{ submitting ? 'Création...' : "Créer l'utilisateur" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { router } from '@inertiajs/vue3'

// Props
interface Props {
  roles: Array<{
    id: number
    name: string
    permissionLevel: number
  }>
}

defineProps<Props>()

// Émissions
const emit = defineEmits<{
  close: []
  created: []
}>()

// État du formulaire
const submitting = ref(false)
const form = reactive({
  username: '',
  email: '',
  fullName: '',
  roleId: '',
  sendWelcomeEmail: true,
})

const errors = reactive({
  username: '',
  email: '',
  fullName: '',
  roleId: '',
  general: '',
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

  // Nom d'utilisateur
  if (!form.username.trim()) {
    errors.username = "Le nom d'utilisateur est requis"
    isValid = false
  } else if (!/^[a-zA-Z0-9_-]+$/.test(form.username)) {
    errors.username = 'Seuls les lettres, chiffres, tirets et underscores sont autorisés'
    isValid = false
  } else if (form.username.length < 3) {
    errors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères"
    isValid = false
  }

  // Email
  if (!form.email.trim()) {
    errors.email = "L'adresse email est requise"
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Format d'email invalide"
    isValid = false
  }

  // Rôle
  if (!form.roleId) {
    errors.roleId = 'Veuillez sélectionner un rôle'
    isValid = false
  }

  return isValid
}

// Création de l'utilisateur
const createUser = () => {
  if (!validateForm() || submitting.value) return

  submitting.value = true
  clearErrors()

  router.post(
    '/admin/users',
    {
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      fullName: form.fullName.trim() || null,
      roleId: Number(form.roleId),
      sendWelcomeEmail: form.sendWelcomeEmail,
    },
    {
      onSuccess: () => {
        emit('created')
      },
      onError: (responseErrors) => {
        // Gestion des erreurs de validation côté serveur
        if (responseErrors.username) {
          errors.username = responseErrors.username
        }
        if (responseErrors.email) {
          errors.email = responseErrors.email
        }
        if (responseErrors.fullName) {
          errors.fullName = responseErrors.fullName
        }
        if (responseErrors.roleId) {
          errors.roleId = responseErrors.roleId
        }
        if (responseErrors.general) {
          errors.general = responseErrors.general
        }

        // Erreur générique si pas d'erreur spécifique
        if (!Object.keys(responseErrors).some((key) => key !== 'message')) {
          errors.general = responseErrors.message || 'Une erreur est survenue lors de la création'
        }
      },
      onFinish: () => {
        submitting.value = false
      },
    }
  )
}
</script>
