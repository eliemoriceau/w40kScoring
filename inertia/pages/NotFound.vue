<script setup lang="ts">
import AppLayout from '~/Layouts/AppLayout.vue'
</script>

<template>
  <AppLayout title="404 - Page introuvable" description="La page que vous cherchez n'existe pas">
    <div class="flex items-center justify-center min-h-[60vh] px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full text-center">
        <!-- Error illustration -->
        <div class="mb-8">
          <div class="mx-auto w-32 h-32 bg-red-600/20 rounded-full flex items-center justify-center">
            <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5C3.312 17.333 4.271 19 5.818 19z"/>
            </svg>
          </div>
        </div>

        <!-- Error content -->
        <div class="mb-8">
          <h1 class="text-6xl font-bold text-red-500 mb-4">404</h1>
          <h2 class="text-2xl font-bold text-white mb-4">
            Page introuvable
          </h2>
          <p class="text-gray-300 mb-6">
            Cette page a été perdue dans le Warp ! 
            Elle n'existe pas ou a été déplacée vers un autre secteur de la galaxie.
          </p>
        </div>

        <!-- Action buttons -->
        <div class="space-y-4">
          <a 
            href="/" 
            class="block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Retour à l'Accueil
          </a>
          
          <button 
            @click="history.back()" 
            class="block w-full border border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Page précédente
          </button>
        </div>

        <!-- Additional help -->
        <div class="mt-12 pt-8 border-t border-red-500/20">
          <p class="text-sm text-gray-400 mb-4">
            Vous cherchez quelque chose de spécifique ?
          </p>
          <div class="flex flex-wrap justify-center gap-4 text-sm">
            <a href="/" class="text-red-400 hover:text-red-300 transition-colors">
              Accueil
            </a>
            <a href="/games" class="text-red-400 hover:text-red-300 transition-colors">
              Parties
            </a>
            <a href="/players" class="text-red-400 hover:text-red-300 transition-colors">
              Joueurs
            </a>
            <a href="/armies" class="text-red-400 hover:text-red-300 transition-colors">
              Armées
            </a>
          </div>
        </div>

        <!-- W40K themed quote -->
        <div class="mt-8 p-4 bg-black/30 rounded-lg border border-red-500/20">
          <p class="text-sm text-gray-400 italic">
            "Dans les sombres ténèbres du lointain futur, 
            il n'y a que des pages perdues..."
          </p>
          <p class="text-xs text-red-400 mt-2">
            — Codex Techmarinus, erreur 404
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* Subtle animation for error illustration */
.bg-red-600\/20 {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.3;
  }
}
</style>