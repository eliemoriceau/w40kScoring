<script setup lang="ts">
import { router } from '@inertiajs/vue3'

const handleCreateNew = () => {
  router.visit(route('partie.create'))
}
</script>

<template>
  <div class="text-center py-16">
    <div class="mx-auto max-w-md">
      <!-- Icône illustrative -->
      <div class="mx-auto w-24 h-24 bg-gradient-to-br from-red-600/20 to-yellow-600/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
        <svg class="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      </div>

      <!-- Titre et message -->
      <h3 class="text-xl font-semibold text-white mb-2">
        Aucune partie trouvée
      </h3>
      
      <p class="text-gray-400 mb-8 leading-relaxed">
        Vous n'avez pas encore de parties enregistrées.<br>
        Commencez votre conquête de la galaxie en créant votre première partie !
      </p>

      <!-- Actions -->
      <div class="space-y-3">
        <button
          @click="handleCreateNew"
          class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black shadow-lg"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Créer ma première partie
        </button>

        <div class="text-sm text-gray-500">
          ou découvrez les fonctionnalités de l'application
        </div>
      </div>
    </div>

    <!-- Conseils/suggestions -->
    <div class="mt-12 bg-black/30 rounded-lg border border-gray-700 p-6 max-w-2xl mx-auto">
      <h4 class="text-lg font-medium text-white mb-4">Pour bien commencer</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div class="text-center">
          <div class="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span class="text-red-400 font-bold text-lg">1</span>
          </div>
          <h5 class="font-medium text-white mb-1">Créer une partie</h5>
          <p class="text-gray-400">Configurez type, points et adversaire</p>
        </div>

        <div class="text-center">
          <div class="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span class="text-yellow-400 font-bold text-lg">2</span>
          </div>
          <h5 class="font-medium text-white mb-1">Jouer et scorer</h5>
          <p class="text-gray-400">Enregistrez rounds et objectifs</p>
        </div>

        <div class="text-center">
          <div class="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span class="text-green-400 font-bold text-lg">3</span>
          </div>
          <h5 class="font-medium text-white mb-1">Analyser</h5>
          <p class="text-gray-400">Suivez vos performances</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hover\:scale-105:hover {
  transform: scale(1.05);
}
</style>