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
        <h1 class="text-3xl font-bold text-red-100 mb-2">Accès au Commandement</h1>
        <p class="text-slate-400">Authentifiez-vous pour accéder aux opérations de la Croisade</p>
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

      <!-- Rate Limit Warning -->
      <div
        v-if="rateLimitWarning"
        class="mb-4 p-4 bg-amber-900/50 border border-amber-800 rounded-lg text-amber-200"
      >
        ⚠️ {{ rateLimitWarning }}
      </div>

      <!-- Login Form -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg shadow-2xl p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Login Field (Email or Username) -->
          <div>
            <label for="login" class="block text-sm font-medium text-red-300 mb-2">
              Email ou Nom de Guerre *
            </label>
            <input
              id="login"
              v-model="form.login"
              type="text"
              required
              class="w-full px-3 py-2 bg-slate-700 border border-red-800/30 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              placeholder="email@exemple.com ou nom_de_guerre"
              :class="{ 'border-red-500': form.errors.login }"
              :disabled="form.processing || backoffSeconds > 0"
            />
            <div v-if="form.errors.login" class="mt-1 text-sm text-red-400">
              {{ form.errors.login }}
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
              placeholder="Votre mot de passe"
              :class="{ 'border-red-500': form.errors.password }"
              :disabled="form.processing || backoffSeconds > 0"
            />
            <div v-if="form.errors.password" class="mt-1 text-sm text-red-400">
              {{ form.errors.password }}
            </div>
          </div>

          <!-- Remember Me -->
          <div class="flex items-start">
            <input
              id="rememberMe"
              v-model="form.rememberMe"
              type="checkbox"
              class="mt-1 h-4 w-4 text-red-600 bg-slate-700 border-red-800/30 rounded focus:ring-red-600 focus:ring-2"
              :disabled="form.processing || backoffSeconds > 0"
            />
            <label for="rememberMe" class="ml-2 text-sm text-slate-300">
              Maintenir la connexion (30 jours)
              <span class="text-slate-500 text-xs block">
                Option sécurisée avec rotation automatique des tokens
              </span>
            </label>
          </div>

          <!-- Backoff indicator -->
          <div v-if="backoffSeconds > 0" class="text-amber-400 text-sm flex items-center">
            <span class="animate-pulse mr-2">⏳</span>
            Veuillez patienter {{ backoffSeconds }}s avant de réessayer...
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="form.processing || backoffSeconds > 0"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-100 bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="form.processing" class="mr-2">⚡</span>
            <span v-else-if="backoffSeconds > 0" class="mr-2">⏳</span>
            {{ getButtonText() }}
          </button>

          <!-- Failed Attempts Indicator -->
          <div
            v-if="failureCount > 0 && failureCount < 5"
            class="text-amber-400 text-xs text-center"
          >
            {{ failureCount }} tentative{{ failureCount > 1 ? 's' : '' }} échouée{{
              failureCount > 1 ? 's' : ''
            }}
            ({{ 5 - failureCount }} restante{{ 5 - failureCount > 1 ? 's' : '' }} avant limitation)
          </div>
        </form>

        <!-- Registration Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-slate-400">
            Pas encore enrôlé dans nos forces ?
            <a href="/register" class="text-red-400 hover:text-red-300 underline">
              Rejoindre la Croisade
            </a>
          </p>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="mt-4 text-center text-xs text-slate-500">
        <p>🔒 Connexion sécurisée avec protection anti-brute force</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Head, useForm } from '@inertiajs/vue3'

defineProps({
  title: String,
})

const failureCount = ref(0)
const backoffSeconds = ref(0)
const rateLimitWarning = ref('')

// Utiliser l'API useForm d'Inertia.js pour gérer automatiquement CSRF et validation
const form = useForm({
  login: '',
  password: '',
  rememberMe: false,
})

const getButtonText = computed(() => {
  if (form.processing) return 'Authentification...'
  if (backoffSeconds.value > 0) return `Attente ${backoffSeconds.value}s`
  return 'Accéder au Commandement'
})

const handleSubmit = async () => {
  if (backoffSeconds.value > 0) return

  try {
    form.post('/login', {
      onSuccess: () => {
        // Succès - reset les compteurs
        failureCount.value = 0
        backoffSeconds.value = 0
        rateLimitWarning.value = ''
      },
      onError: (errors) => {
        console.error('❌ Login errors:', errors)

        // Incrémenter le compteur d'échecs
        if (!errors.login && !errors.password) {
          failureCount.value++
        }

        // Gérer les différents types d'erreurs
        if (errors.retryAfter) {
          // Rate limiting par IP
          rateLimitWarning.value = `Trop de tentatives depuis cette adresse IP. Réessayez dans ${Math.ceil(errors.retryAfter / 60)} minutes.`
          startBackoff(errors.retryAfter * 1000)
        } else if (errors.lockDuration) {
          // Compte verrouillé
          rateLimitWarning.value = `Compte temporairement verrouillé. Réessayez dans ${Math.ceil(errors.lockDuration / 60)} minutes.`
        } else if (failureCount.value > 0) {
          // Backoff progressif pour échecs normaux
          const delay = Math.min(500 * Math.pow(2, failureCount.value - 1), 2000)
          startBackoff(delay)
        }
      },
      onFinish: () => {
        // Effacer le mot de passe en cas d'erreur pour sécurité
        if (form.hasErrors) {
          form.password = ''
        }
      },
    })
  } catch (error) {
    console.error('💥 Login error:', error)
  }
}

const startBackoff = (milliseconds) => {
  backoffSeconds.value = Math.ceil(milliseconds / 1000)

  const interval = setInterval(() => {
    backoffSeconds.value--
    if (backoffSeconds.value <= 0) {
      clearInterval(interval)
      rateLimitWarning.value = ''
    }
  }, 1000)
}
</script>
