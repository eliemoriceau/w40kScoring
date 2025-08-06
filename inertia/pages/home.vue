<script setup lang="ts">
import AppLayout from '~/Layouts/AppLayout.vue'
</script>

<template>
  <AppLayout title="Accueil - w40kScoring" description="Bienvenue sur votre application de scoring Warhammer 40,000">
    <!-- Hero Section -->
    <section class="relative py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto text-center">
        <div class="relative">
          <!-- Decorative background -->
          <div class="absolute inset-0 bg-gradient-to-r from-red-600/20 to-yellow-500/20 blur-3xl -z-10 rounded-full"></div>
          
          <h1 class="text-4xl md:text-6xl font-bold mb-6">
            <span class="text-red-400">w40k</span><span class="text-yellow-400">Scoring</span>
          </h1>
          
          <p class="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Gérez vos parties de Warhammer 40,000, suivez vos performances 
            et dominez les champs de bataille de la galaxie !
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
              Nouvelle Partie
            </button>
            <button class="border border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-bold py-3 px-8 rounded-lg transition-colors">
              Voir mes Statistiques
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="py-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-bold text-center mb-12 text-white">
          Fonctionnalités principales
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1: Game Tracking -->
          <div class="bg-black/30 rounded-lg p-6 border border-red-500/20 hover:border-red-500/40 transition-colors">
            <div class="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-white">Suivi des Parties</h3>
            <p class="text-gray-300">
              Enregistrez facilement vos parties, scores, objectifs et résultats. 
              Gardez un historique complet de vos batailles.
            </p>
          </div>

          <!-- Feature 2: Army Management -->
          <div class="bg-black/30 rounded-lg p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
            <div class="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-white">Gestion d'Armées</h3>
            <p class="text-gray-300">
              Organisez vos différentes armées, leurs compositions et performances. 
              Optimisez vos listes selon vos statistiques.
            </p>
          </div>

          <!-- Feature 3: Statistics -->
          <div class="bg-black/30 rounded-lg p-6 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-white">Analyse & Stats</h3>
            <p class="text-gray-300">
              Analysez vos performances avec des graphiques détaillés. 
              Identifiez vos points forts et axes d'amélioration.
            </p>
          </div>

          <!-- Feature 4: Mission Tracking -->
          <div class="bg-black/30 rounded-lg p-6 border border-green-500/20 hover:border-green-500/40 transition-colors">
            <div class="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-white">Suivi des Missions</h3>
            <p class="text-gray-300">
              Enregistrez les détails des missions, objectifs primaires et secondaires. 
              Maîtrisez le meta-jeu stratégique.
            </p>
          </div>

          <!-- Feature 5: Tournament Mode -->
          <div class="bg-black/30 rounded-lg p-6 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <div class="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-white">Mode Tournoi</h3>
            <p class="text-gray-300">
              Préparez-vous pour les compétitions officielles. 
              Suivez vos performances en tournoi et votre progression.
            </p>
          </div>

          <!-- Feature 6: Community -->
          <div class="bg-black/30 rounded-lg p-6 border border-orange-500/20 hover:border-orange-500/40 transition-colors">
            <div class="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-white">Communauté</h3>
            <p class="text-gray-300">
              Partagez vos résultats avec d'autres joueurs. 
              Comparez vos performances et progressez ensemble.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Call to Action -->
    <section class="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-600/10 to-yellow-600/10">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl font-bold mb-6 text-white">
          Prêt à dominer la galaxie ?
        </h2>
        <p class="text-xl text-gray-300 mb-8">
          Rejoignez les rangs des généraux les plus redoutables de l'Imperium. 
          Commencez dès maintenant à traquer vos victoires !
        </p>
        <button class="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white font-bold py-4 px-12 rounded-lg text-lg transition-all transform hover:scale-105">
          Commencer maintenant
        </button>
      </div>
    </section>
  </AppLayout>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>