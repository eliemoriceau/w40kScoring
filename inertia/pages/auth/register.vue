<template>
  <Head :title="title" />

  <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
    <!-- Background atmosphere -->
    <div
      class="absolute inset-0 bg-gradient-to-b from-red-900/20 to-slate-900 pointer-events-none"
    ></div>

    <div class="w-full max-w-md relative z-10">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-red-900 rounded-full mb-4">
          <span class="text-3xl">⚔️</span>
        </div>
        <h1 class="text-3xl font-bold text-red-100 mb-2">Rejoindre la Croisade</h1>
        <p class="text-slate-400">
          Au nom de l'Empereur, créez votre compte pour participer aux tournois
        </p>
      </div>

      <!-- Flash Messages -->
      <div
        v-if="$page.props.flash?.success"
        class="mb-4 p-4 bg-green-900/50 border border-green-800 rounded-lg text-green-200"
      >
        {{ $page.props.flash.success }}
      </div>

      <div
        v-if="$page.props.flash?.error"
        class="mb-4 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200"
      >
        {{ $page.props.flash.error }}
      </div>

      <!-- Registration Form -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg shadow-2xl p-6">
        <form @submit.prevent="submitForm" class="space-y-6">
          <!-- Username -->
          <div>
            <label for="username" class="block text-sm font-medium text-red-300 mb-2">
              Nom de Guerre *
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              class="w-full px-3 py-2 bg-slate-700 border border-red-800/30 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              placeholder="Votre pseudonyme de bataille"
              :class="{ 'border-red-500': errors.username }"
            />
            <div v-if="errors.username" class="mt-1 text-sm text-red-400">
              {{ errors.username }}
            </div>
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-red-300 mb-2">
              Vox-Channel (Email) *
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="w-full px-3 py-2 bg-slate-700 border border-red-800/30 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              placeholder="votre@email.com"
              :class="{ 'border-red-500': errors.email }"
            />
            <div v-if="errors.email" class="mt-1 text-sm text-red-400">
              {{ errors.email }}
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-red-300 mb-2">
              Code d'Accès *
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="w-full px-3 py-2 bg-slate-700 border border-red-800/30 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              placeholder="Minimum 8 caractères"
              :class="{ 'border-red-500': errors.password }"
            />
            <div v-if="errors.password" class="mt-1 text-sm text-red-400">
              {{ errors.password }}
            </div>
          </div>

          <!-- Password Confirmation -->
          <div>
            <label for="password_confirmation" class="block text-sm font-medium text-red-300 mb-2">
              Confirmation du Code d'Accès *
            </label>
            <input
              id="password_confirmation"
              v-model="form.passwordConfirmation"
              type="password"
              required
              class="w-full px-3 py-2 bg-slate-700 border border-red-800/30 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              placeholder="Répétez votre mot de passe"
              :class="{ 'border-red-500': errors.passwordConfirmation }"
            />
            <div v-if="errors.passwordConfirmation" class="mt-1 text-sm text-red-400">
              {{ errors.passwordConfirmation }}
            </div>
          </div>

          <!-- Newsletter Consent -->
          <div class="flex items-start">
            <input
              id="newsletter"
              v-model="form.newsletterConsent"
              type="checkbox"
              class="mt-1 h-4 w-4 text-red-600 bg-slate-700 border-red-800/30 rounded focus:ring-red-600 focus:ring-2"
            />
            <label for="newsletter" class="ml-2 text-sm text-slate-300">
              Je souhaite recevoir les communiqués de la Flotte Impériale (newsletter)
            </label>
          </div>

          <!-- Terms Acceptance -->
          <div class="flex items-start">
            <input
              id="terms"
              v-model="form.termsAccepted"
              type="checkbox"
              required
              class="mt-1 h-4 w-4 text-red-600 bg-slate-700 border-red-800/30 rounded focus:ring-red-600 focus:ring-2"
              :class="{ 'border-red-500': errors.termsAccepted }"
            />
            <label for="terms" class="ml-2 text-sm text-slate-300">
              J'accepte le
              <button
                type="button"
                @click="showTermsModal = true"
                class="text-red-400 hover:text-red-300 underline"
              >
                Codex de la Croisade
              </button>
              (conditions d'utilisation) *
            </label>
          </div>
          <div v-if="errors.termsAccepted" class="text-sm text-red-400">
            {{ errors.termsAccepted }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="processing"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-100 bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="processing" class="mr-2">⚡</span>
            {{ processing ? 'Initialisation en cours...' : 'Rejoindre la Croisade' }}
          </button>
        </form>

        <!-- Login Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-slate-400">
            Déjà enrôlé dans nos forces ?
            <a href="/login" class="text-red-400 hover:text-red-300 underline">
              Accéder au Commandement
            </a>
          </p>
        </div>
      </div>

      <!-- Terms Modal -->
      <TermsModal :show="showTermsModal" @close="showTermsModal = false" @accept="acceptTerms" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Head, useForm, router } from '@inertiajs/vue3'
import TermsModal from '~/components/auth/terms_modal.vue'

defineProps({
  title: String,
  errors: {
    type: Object,
    default: () => ({}),
  },
})

const showTermsModal = ref(false)
const processing = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  newsletterConsent: false,
  termsAccepted: false,
})

const acceptTerms = () => {
  form.termsAccepted = true
  showTermsModal.value = false
}

const submitForm = () => {
  processing.value = true

  router.post('/register', form, {
    onFinish: () => {
      processing.value = false
    },
    onError: (errors) => {
      processing.value = false
      console.error('Registration errors:', errors)
    },
  })
}
</script>
