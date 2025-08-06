<script setup lang="ts">
import { Head } from '@inertiajs/vue3'

interface Props {
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'w40kScoring',
  description: 'Application de scoring pour Warhammer 40,000',
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 text-white">
    <Head>
      <title>{{ props.title }}</title>
      <meta name="description" :content="props.description" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Head>

    <!-- Navigation Header -->
    <header class="bg-black/20 backdrop-blur-sm border-b border-red-500/20">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo / Brand -->
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-red-400">
              w40k<span class="text-yellow-400">Scoring</span>
            </h1>
          </div>

          <!-- Navigation Menu -->
          <div class="hidden md:block">
            <div class="flex items-baseline space-x-8">
              <a
                href="/"
                class="text-white hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Accueil
              </a>
              <a
                href="/games"
                class="text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Parties
              </a>
              <a
                href="/players"
                class="text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Joueurs
              </a>
              <a
                href="/armies"
                class="text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Armées
              </a>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="md:hidden">
            <button class="text-gray-300 hover:text-white focus:outline-none focus:text-white">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-black/40 border-t border-red-500/20 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Brand Section -->
          <div>
            <h3 class="text-lg font-bold text-red-400 mb-4">w40kScoring</h3>
            <p class="text-gray-300 text-sm">
              Application de gestion et scoring pour les parties de Warhammer 40,000. Suivez vos
              victoires, analysez vos performances.
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="text-white font-semibold mb-4">Liens rapides</h4>
            <ul class="space-y-2">
              <li>
                <a href="/" class="text-gray-300 hover:text-red-400 text-sm transition-colors"
                  >Accueil</a
                >
              </li>
              <li>
                <a href="/games" class="text-gray-300 hover:text-red-400 text-sm transition-colors"
                  >Mes parties</a
                >
              </li>
              <li>
                <a href="/stats" class="text-gray-300 hover:text-red-400 text-sm transition-colors"
                  >Statistiques</a
                >
              </li>
            </ul>
          </div>

          <!-- Warhammer 40K Theme -->
          <div>
            <h4 class="text-white font-semibold mb-4">Pour l'Empereur !</h4>
            <p class="text-gray-300 text-sm">
              "Dans les sombres ténèbres du lointain futur, il n'y a que la guerre..."
            </p>
            <div class="mt-4 flex space-x-4">
              <div class="w-8 h-8 bg-red-600 rounded border border-yellow-400"></div>
              <div class="w-8 h-8 bg-blue-600 rounded border border-yellow-400"></div>
              <div class="w-8 h-8 bg-green-600 rounded border border-yellow-400"></div>
            </div>
          </div>
        </div>

        <div class="border-t border-red-500/20 mt-8 pt-8 text-center">
          <p class="text-gray-400 text-sm">
            &copy; 2025 w40kScoring. Warhammer 40,000 © Games Workshop Ltd.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Custom scrollbar for dark theme */
:global(html) {
  scrollbar-width: thin;
  scrollbar-color: #dc2626 #1f2937;
}

:global(body::-webkit-scrollbar) {
  width: 8px;
}

:global(body::-webkit-scrollbar-track) {
  background: #1f2937;
}

:global(body::-webkit-scrollbar-thumb) {
  background-color: #dc2626;
  border-radius: 4px;
}

:global(body::-webkit-scrollbar-thumb:hover) {
  background-color: #ef4444;
}
</style>
