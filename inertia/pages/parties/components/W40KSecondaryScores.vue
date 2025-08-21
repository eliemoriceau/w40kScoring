<template>
  <div class="animate-in slide-in-from-bottom-4 duration-700">
    <!-- En-tête épique W40K -->
    <div class="relative bg-gradient-to-br from-w40k-bg-secondary to-w40k-bg-elevated border-2 border-w40k-red-500/50 rounded-xl p-6 shadow-w40k-xl overflow-hidden">
      <!-- Effet de fond animé -->
      <div class="absolute inset-0 bg-gradient-to-r from-w40k-red-900/20 via-transparent to-w40k-gold-900/20 opacity-30" />
      
      <div class="relative text-center space-y-3">
        <div class="flex items-center justify-center gap-3">
          <div class="w-8 h-8 bg-gradient-to-br from-w40k-gold-500 to-w40k-gold-700 rounded-full flex items-center justify-center shadow-lg">
            <span class="text-lg font-black text-w40k-bg-primary">🎯</span>
          </div>
          <h3 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-w40k-red-300 to-w40k-gold-400">
            ⚡ Objectifs Secondaires
          </h3>
          <div class="w-8 h-8 bg-gradient-to-br from-w40k-gold-500 to-w40k-gold-700 rounded-full flex items-center justify-center shadow-lg">
            <span class="text-lg font-black text-w40k-bg-primary">🏆</span>
          </div>
        </div>
        <p class="text-sm text-w40k-text-secondary font-medium">
          💀 Missions tactiques par round • Maximum 15 points chacune • Gloire éternelle assurée 💀
        </p>
      </div>
    </div>

    <!-- Grille responsive pour les deux joueurs avec design W40K -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <!-- Joueur 1 -->
      <div class="space-y-6">
        <!-- En-tête joueur avec design W40K -->
        <div class="relative bg-gradient-to-r from-w40k-bg-secondary to-w40k-bg-elevated border border-w40k-red-500/50 rounded-lg p-4 text-center">
          <div class="flex items-center justify-center gap-3">
            <div class="w-4 h-4 bg-w40k-red-500 rounded-full animate-pulse" />
            <h4 class="text-xl font-bold text-w40k-red-300">{{ players[0]?.pseudo || 'Joueur 1' }}</h4>
            <span v-if="players[0]?.isMainPlayer" class="text-sm text-w40k-text-muted font-normal">(Vous)</span>
          </div>
        </div>
        
        <!-- Liste des rounds avec objectifs -->
        <div class="space-y-4">
          <div 
            v-for="round in rounds" 
            :key="`player1-round-${round.id}`" 
            class="bg-gradient-to-br from-w40k-bg-secondary to-w40k-bg-elevated border border-w40k-red-500/30 rounded-lg p-4 hover:border-w40k-red-500/60 transition-all duration-300"
          >
            <!-- En-tête du round -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-gradient-to-br from-w40k-red-600 to-w40k-red-800 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {{ round.roundNumber }}
                </div>
                <span class="text-sm font-bold text-w40k-text-secondary">Round {{ round.roundNumber }}</span>
              </div>
              
              <!-- Bouton d'ajout avec design W40K -->
              <button
                v-if="canEdit && !hasSecondaryScores(round.id, players[0]?.id)"
                @click="addSecondaryScore(round.id, players[0]?.id)"
                :class="[
                  'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200',
                  'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-xl hover:scale-110',
                  'border-2 border-green-500 hover:border-green-400'
                ]"
                title="Ajouter un objectif secondaire"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>

            <!-- Scores secondaires existants avec design W40K -->
            <div class="space-y-2">
              <div
                v-for="score in getSecondaryScoresForRoundAndPlayer(round.id, players[0]?.id)"
                :key="score.id"
                class="relative flex items-center justify-between bg-w40k-bg-primary border border-w40k-text-subtle/30 rounded-lg p-3 hover:border-w40k-gold-500/50 transition-all duration-200 group"
              >
                <!-- Informations du score -->
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-bold text-w40k-text-primary">{{ score.scoreName }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-w40k-gold-400 to-w40k-gold-600">
                      {{ score.scoreValue }}
                    </span>
                    <span class="text-xs text-w40k-text-secondary font-medium">points</span>
                  </div>
                </div>
                
                <!-- Actions avec design W40K -->
                <div v-if="canEdit" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button 
                    @click="editSecondaryScore(score)" 
                    :class="[
                      'w-7 h-7 flex items-center justify-center rounded transition-all duration-200',
                      'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-110',
                      'border border-blue-500 hover:border-blue-400'
                    ]"
                    title="Modifier l'objectif"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="deleteSecondaryScore(score.id)"
                    :class="[
                      'w-7 h-7 flex items-center justify-center rounded transition-all duration-200',
                      'bg-w40k-red-600 hover:bg-w40k-red-500 text-white shadow-lg hover:shadow-xl hover:scale-110',
                      'border border-w40k-red-500 hover:border-w40k-red-400'
                    ]"
                    title="Supprimer l'objectif"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <!-- Effet brillant pour scores élevés -->
                <div v-if="score.scoreValue >= 10" class="absolute inset-0 bg-gradient-to-r from-transparent via-w40k-gold-500/10 to-transparent rounded-lg animate-pulse pointer-events-none" />
              </div>

              <!-- Message vide avec design W40K -->
              <div v-if="!hasSecondaryScores(round.id, players[0]?.id)" class="text-center py-6">
                <div class="space-y-2">
                  <div class="w-12 h-12 mx-auto bg-gradient-to-br from-w40k-text-subtle/20 to-w40k-text-subtle/10 rounded-full flex items-center justify-center">
                    <span class="text-2xl opacity-50">⚡</span>
                  </div>
                  <p class="text-sm text-w40k-text-muted">Aucun objectif secondaire</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Total des scores secondaires avec design W40K épique -->
        <div class="relative bg-gradient-to-br from-w40k-bg-secondary to-w40k-bg-elevated border-2 border-w40k-gold-500/50 rounded-lg p-4 shadow-w40k-lg">
          <!-- Effet de fond pour le total -->
          <div class="absolute inset-0 bg-gradient-to-r from-w40k-gold-900/20 via-transparent to-w40k-gold-900/20 rounded-lg" />
          
          <div class="relative flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-w40k-gold-500 rounded-full flex items-center justify-center animate-pulse">
                <span class="text-xs font-bold text-w40k-bg-primary">🏆</span>
              </div>
              <span class="text-sm font-bold text-w40k-text-secondary">Total Objectifs Secondaires</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-w40k-gold-400 to-w40k-gold-600">
                {{ getTotalSecondaryScore(players[0]?.id) }}
              </span>
              <span class="text-sm text-w40k-text-secondary font-medium">pts</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Joueur 2 avec logique similaire -->
      <div v-if="players[1]" class="space-y-6">
        <!-- En-tête joueur 2 -->
        <div class="relative bg-gradient-to-l from-w40k-bg-secondary to-w40k-bg-elevated border border-w40k-red-500/50 rounded-lg p-4 text-center">
          <div class="flex items-center justify-center gap-3">
            <div class="w-4 h-4 bg-w40k-red-500 rounded-full animate-pulse" />
            <h4 class="text-xl font-bold text-w40k-red-300">{{ players[1].pseudo }}</h4>
            <span v-if="players[1].isMainPlayer" class="text-sm text-w40k-text-muted font-normal">(Vous)</span>
          </div>
        </div>
        
        <!-- Liste des rounds pour joueur 2 -->
        <div class="space-y-4">
          <div 
            v-for="round in rounds" 
            :key="`player2-round-${round.id}`" 
            class="bg-gradient-to-bl from-w40k-bg-secondary to-w40k-bg-elevated border border-w40k-red-500/30 rounded-lg p-4 hover:border-w40k-red-500/60 transition-all duration-300"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-gradient-to-br from-w40k-red-600 to-w40k-red-800 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {{ round.roundNumber }}
                </div>
                <span class="text-sm font-bold text-w40k-text-secondary">Round {{ round.roundNumber }}</span>
              </div>
              
              <button
                v-if="canEdit && !hasSecondaryScores(round.id, players[1].id)"
                @click="addSecondaryScore(round.id, players[1].id)"
                :class="[
                  'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200',
                  'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-xl hover:scale-110',
                  'border-2 border-green-500 hover:border-green-400'
                ]"
                title="Ajouter un objectif secondaire"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>

            <div class="space-y-2">
              <div
                v-for="score in getSecondaryScoresForRoundAndPlayer(round.id, players[1].id)"
                :key="score.id"
                class="relative flex items-center justify-between bg-w40k-bg-primary border border-w40k-text-subtle/30 rounded-lg p-3 hover:border-w40k-gold-500/50 transition-all duration-200 group"
              >
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-bold text-w40k-text-primary">{{ score.scoreName }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-lg font-black text-transparent bg-clip-text bg-gradient-to-l from-w40k-gold-400 to-w40k-gold-600">
                      {{ score.scoreValue }}
                    </span>
                    <span class="text-xs text-w40k-text-secondary font-medium">points</span>
                  </div>
                </div>
                
                <div v-if="canEdit" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button 
                    @click="editSecondaryScore(score)" 
                    :class="[
                      'w-7 h-7 flex items-center justify-center rounded transition-all duration-200',
                      'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-110',
                      'border border-blue-500 hover:border-blue-400'
                    ]"
                    title="Modifier l'objectif"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="deleteSecondaryScore(score.id)"
                    :class="[
                      'w-7 h-7 flex items-center justify-center rounded transition-all duration-200',
                      'bg-w40k-red-600 hover:bg-w40k-red-500 text-white shadow-lg hover:shadow-xl hover:scale-110',
                      'border border-w40k-red-500 hover:border-w40k-red-400'
                    ]"
                    title="Supprimer l'objectif"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div v-if="score.scoreValue >= 10" class="absolute inset-0 bg-gradient-to-l from-transparent via-w40k-gold-500/10 to-transparent rounded-lg animate-pulse pointer-events-none" />
              </div>

              <div v-if="!hasSecondaryScores(round.id, players[1].id)" class="text-center py-6">
                <div class="space-y-2">
                  <div class="w-12 h-12 mx-auto bg-gradient-to-bl from-w40k-text-subtle/20 to-w40k-text-subtle/10 rounded-full flex items-center justify-center">
                    <span class="text-2xl opacity-50">⚡</span>
                  </div>
                  <p class="text-sm text-w40k-text-muted">Aucun objectif secondaire</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Total joueur 2 -->
        <div class="relative bg-gradient-to-bl from-w40k-bg-secondary to-w40k-bg-elevated border-2 border-w40k-gold-500/50 rounded-lg p-4 shadow-w40k-lg">
          <div class="absolute inset-0 bg-gradient-to-l from-w40k-gold-900/20 via-transparent to-w40k-gold-900/20 rounded-lg" />
          
          <div class="relative flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-w40k-gold-500 rounded-full flex items-center justify-center animate-pulse">
                <span class="text-xs font-bold text-w40k-bg-primary">🏆</span>
              </div>
              <span class="text-sm font-bold text-w40k-text-secondary">Total Objectifs Secondaires</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-l from-w40k-gold-400 to-w40k-gold-600">
                {{ getTotalSecondaryScore(players[1].id) }}
              </span>
              <span class="text-sm text-w40k-text-secondary font-medium">pts</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Joueur 2 absent avec design W40K -->
      <div v-else class="space-y-6 opacity-60">
        <div class="bg-gradient-to-l from-w40k-bg-secondary to-w40k-bg-elevated border border-w40k-text-subtle/30 rounded-lg p-4 text-center">
          <div class="flex items-center justify-center gap-3">
            <div class="w-4 h-4 bg-w40k-text-subtle rounded-full animate-pulse" />
            <h4 class="text-xl font-bold text-w40k-text-muted">En attente d'adversaire</h4>
          </div>
        </div>
        
        <div class="bg-gradient-to-bl from-w40k-bg-secondary/50 to-w40k-bg-elevated/50 border border-dashed border-w40k-text-subtle/30 rounded-lg p-8">
          <div class="text-center space-y-4">
            <div class="w-16 h-16 mx-auto bg-gradient-to-br from-w40k-text-subtle/20 to-w40k-text-subtle/10 rounded-full flex items-center justify-center">
              <span class="text-3xl opacity-50">🛡️</span>
            </div>
            <p class="text-w40k-text-muted">Les objectifs secondaires apparaîtront ici une fois l'adversaire rejoint</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal W40K pour ajouter/éditer un objectif secondaire -->
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform scale-95 opacity-0"
    enter-to-class="transform scale-100 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform scale-100 opacity-100"
    leave-to-class="transform scale-95 opacity-0"
  >
    <div v-if="showModal" class="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="closeModal">
      <div class="relative bg-gradient-to-br from-w40k-bg-secondary to-w40k-bg-elevated border-2 border-w40k-red-500/50 rounded-xl p-6 w-full max-w-md shadow-2xl" @click.stop>
        <!-- Effet de fond animé pour la modal -->
        <div class="absolute inset-0 bg-gradient-to-r from-w40k-red-900/10 via-transparent to-w40k-gold-900/10 rounded-xl" />
        
        <div class="relative space-y-6">
          <!-- En-tête de la modal -->
          <div class="text-center">
            <div class="w-12 h-12 mx-auto bg-gradient-to-br from-w40k-red-600 to-w40k-red-800 rounded-full flex items-center justify-center mb-3 shadow-lg">
              <span class="text-xl font-black text-white">{{ editingScore ? '✏️' : '➕' }}</span>
            </div>
            <h3 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-w40k-red-300 to-w40k-gold-400">
              {{ editingScore ? 'Modifier' : 'Ajouter' }} un Objectif Secondaire
            </h3>
          </div>

          <!-- Formulaire avec design W40K -->
          <form @submit.prevent="saveSecondaryScore" class="space-y-4">
            <div class="space-y-2">
              <label for="scoreName" class="block text-sm font-bold text-w40k-text-secondary">
                🎯 Nom de l'objectif
              </label>
              <input
                id="scoreName"
                v-model="formData.scoreName"
                type="text"
                class="w-full px-4 py-3 bg-w40k-bg-primary border-2 border-w40k-text-subtle rounded-lg text-w40k-text-primary placeholder-w40k-text-muted focus:outline-none focus:ring-2 focus:ring-w40k-red-500 focus:border-w40k-red-400 transition-all duration-200"
                placeholder="Ex: Contrôler le point central"
                required
                maxlength="50"
              />
            </div>

            <div class="space-y-2">
              <label for="scoreValue" class="block text-sm font-bold text-w40k-text-secondary">
                ⚡ Points (0-15)
              </label>
              <input
                id="scoreValue"
                v-model.number="formData.scoreValue"
                type="number"
                class="w-full px-4 py-3 bg-w40k-bg-primary border-2 border-w40k-text-subtle rounded-lg text-w40k-text-primary focus:outline-none focus:ring-2 focus:ring-w40k-red-500 focus:border-w40k-red-400 transition-all duration-200"
                min="0"
                max="15"
                required
              />
            </div>

            <!-- Actions de la modal -->
            <div class="flex items-center justify-end gap-3 pt-4">
              <button 
                type="button" 
                @click="closeModal" 
                class="px-6 py-2 text-w40k-text-secondary hover:text-w40k-text-primary font-medium transition-colors duration-200"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                :disabled="isLoading"
                :class="[
                  'px-6 py-2 rounded-lg font-bold transition-all duration-200',
                  'bg-gradient-to-r from-w40k-red-600 to-w40k-red-700 hover:from-w40k-red-500 hover:to-w40k-red-600',
                  'text-white shadow-lg hover:shadow-xl hover:scale-105',
                  'border border-w40k-red-500 hover:border-w40k-red-400',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                ]"
              >
                {{ isLoading ? '🔄 Sauvegarde...' : '💾 Sauvegarder' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { router } from '@inertiajs/vue3'
import type { SecondaryScoresProps, SecondaryScoreDto, SecondaryScoreUpdateEvent } from '../types'

const props = defineProps<SecondaryScoresProps>()

const emit = defineEmits<{
  'secondary-score-updated': [event: SecondaryScoreUpdateEvent]
}>()

// État local
const showModal = ref(false)
const isLoading = ref(false)
const editingScore = ref<SecondaryScoreDto | null>(null)

const formData = reactive({
  roundId: 0,
  playerId: 0,
  scoreName: '',
  scoreValue: 0,
})

// Méthodes utilitaires
const getSecondaryScoresForRoundAndPlayer = (roundId: number, playerId?: number) => {
  if (!playerId) return []
  return props.secondaryScores.filter(
    (score) => score.roundId === roundId && score.playerId === playerId
  )
}

const hasSecondaryScores = (roundId: number, playerId?: number) => {
  return getSecondaryScoresForRoundAndPlayer(roundId, playerId).length > 0
}

const getTotalSecondaryScore = (playerId?: number) => {
  if (!playerId) return 0
  return props.secondaryScores
    .filter((score) => score.playerId === playerId)
    .reduce((total, score) => total + score.scoreValue, 0)
}

// Gestion des objectifs secondaires
const addSecondaryScore = (roundId: number, playerId: number) => {
  editingScore.value = null
  formData.roundId = roundId
  formData.playerId = playerId
  formData.scoreName = ''
  formData.scoreValue = 0
  showModal.value = true
}

const editSecondaryScore = (score: SecondaryScoreDto) => {
  editingScore.value = score
  formData.roundId = score.roundId
  formData.playerId = score.playerId
  formData.scoreName = score.scoreName
  formData.scoreValue = score.scoreValue
  showModal.value = true
}

const saveSecondaryScore = async () => {
  isLoading.value = true

  try {
    const endpoint = editingScore.value
      ? `/scores/${editingScore.value.id}`
      : '/scores'

    const method = editingScore.value ? 'put' : 'post'

    await router[method](
      endpoint,
      {
        roundId: formData.roundId,
        playerId: formData.playerId,
        scoreType: 'SECONDARY',
        scoreName: formData.scoreName,
        scoreValue: formData.scoreValue,
      },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          emit('secondary-score-updated', {
            roundId: formData.roundId,
            playerId: formData.playerId,
            scoreName: formData.scoreName,
            scoreValue: formData.scoreValue,
          })
          closeModal()
        },
        onError: (errors) => {
          console.error('Erreur lors de la sauvegarde:', errors)
        },
      }
    )
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du score secondaire:', error)
  } finally {
    isLoading.value = false
  }
}

const deleteSecondaryScore = async (scoreId: number) => {
  if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer cet objectif secondaire ? Cette action est irréversible !')) {
    return
  }

  try {
    await router.delete(`/scores/${scoreId}`, {
      preserveState: true,
      preserveScroll: true,
    })
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
  }
}

const closeModal = () => {
  showModal.value = false
  editingScore.value = null
  formData.roundId = 0
  formData.playerId = 0
  formData.scoreName = ''
  formData.scoreValue = 0
}
</script>

<style scoped>
/* Animations W40K */
@keyframes animate-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: animate-in 0.6s ease-out forwards;
}

/* Responsive optimisations W40K */
@media (max-width: 768px) {
  .text-2xl { font-size: 1.5rem; }
  .text-xl { font-size: 1.25rem; }
  .text-lg { font-size: 1.125rem; }
  .grid-cols-1.lg\:grid-cols-2 { grid-template-columns: 1fr; }
  .gap-8 { gap: 1.5rem; }
  .px-6 { padding-left: 1rem; padding-right: 1rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
}
</style>