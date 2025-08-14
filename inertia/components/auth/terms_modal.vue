<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div
      class="bg-slate-900 border border-red-800 rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden"
    >
      <!-- Header -->
      <div class="bg-red-900 px-6 py-4 border-b border-red-800">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold text-red-100 flex items-center">
            <span class="mr-2">⚔️</span>
            Codex de la Croisade - Conditions d'Utilisation
          </h2>
          <button
            @click="$emit('close')"
            class="text-red-300 hover:text-red-100 text-2xl font-bold"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[70vh]">
        <div class="text-slate-200 space-y-4">
          <div class="bg-amber-900/20 border border-amber-800/50 rounded p-4 mb-6">
            <h3 class="text-amber-300 font-bold mb-2">🏛️ Par l'Empereur de l'Humanité</h3>
            <p class="text-sm">
              En acceptant ces conditions, vous vous engagez à servir l'Imperium avec honneur et à
              respecter le Codex Astartes dans tous vos tournois.
            </p>
          </div>

          <section>
            <h4 class="text-red-300 font-bold mb-2">Article I - Engagement dans la Croisade</h4>
            <p class="mb-3">
              Tout utilisateur s'inscrivant sur cette plateforme s'engage à participer aux tournois
              de Warhammer 40,000 dans le respect des règles officielles et de l'esprit du jeu.
            </p>
          </section>

          <section>
            <h4 class="text-red-300 font-bold mb-2">Article II - Données Personnelles</h4>
            <p class="mb-3">
              Vos données sont protégées selon les directives du Codex Astartes concernant la
              confidentialité. Elles ne seront utilisées que pour la gestion des tournois et
              l'amélioration de l'expérience utilisateur.
            </p>
          </section>

          <section>
            <h4 class="text-red-300 font-bold mb-2">Article III - Conduite Honorable</h4>
            <ul class="list-disc list-inside space-y-1 mb-3">
              <li>Respecter les adversaires et organisateurs</li>
              <li>Jouer selon les règles officielles</li>
              <li>Maintenir un comportement sportif</li>
              <li>Ne pas utiliser de tactiques déloyales</li>
            </ul>
          </section>

          <section>
            <h4 class="text-red-300 font-bold mb-2">Article IV - Responsabilités</h4>
            <p class="mb-3">
              L'utilisateur est responsable de la précision des scores saisis et de la bonne tenue
              de ses parties. Toute fraude sera sanctionnée par l'Inquisition.
            </p>
          </section>

          <section>
            <h4 class="text-red-300 font-bold mb-2">Article V - Newsletter Impériale</h4>
            <p class="mb-3">
              L'inscription à la newsletter est optionnelle et permet de recevoir les dernières
              nouvelles de la Croisade, les annonces de tournois et les mises à jour importantes.
            </p>
          </section>

          <div class="bg-red-900/20 border border-red-800/50 rounded p-4 mt-6">
            <p class="text-red-200 text-sm text-center">
              <strong>Memento Mori</strong> - En cas de non-respect de ces conditions, l'utilisateur
              s'expose à la purge définitive de ses données.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-slate-800 px-6 py-4 border-t border-red-800 flex justify-end space-x-4">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition-colors"
        >
          Fermer
        </button>
        <button
          @click="$emit('accept')"
          class="px-6 py-2 bg-red-700 text-red-100 rounded hover:bg-red-600 transition-colors font-medium"
        >
          J'accepte les Conditions
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
})

defineEmits(['close', 'accept'])
</script>
