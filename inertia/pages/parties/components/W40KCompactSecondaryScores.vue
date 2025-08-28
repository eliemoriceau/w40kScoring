<template>
  <div class="space-y-4">
    <!-- Tableau compact pour les scores secondaires avec sélection inline -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-red-300 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Objectifs Secondaires
        </h4>
        
        <button
          @click="addNewRow(players[0])"
          class="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-all duration-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter Objectif
        </button>
      </div>

      <!-- Grid côte à côte pour les deux joueurs -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Tableau joueur 1 -->
        <div class="space-y-2">
          <h5 class="text-sm font-medium text-red-300 border-b border-slate-600 pb-1">
            {{ players[0]?.pseudo || 'Joueur 1' }}
            <span class="text-xs text-slate-400">(Total: {{ getPlayerSecondaryTotal(players[0]) }})</span>
          </h5>
          
          <!-- Tableau avec sélection inline -->
          <div class="border border-slate-600 rounded-lg overflow-hidden">
            <!-- En-têtes -->
            <div class="grid grid-cols-12 bg-slate-700/50 text-xs font-medium text-red-300">
              <div class="col-span-9 p-2 border-r border-slate-600">Objectif</div>
              <div class="col-span-2 p-2 text-center border-r border-slate-600">Score</div>
              <div class="col-span-1 p-2 text-center">Action</div>
            </div>
            
            <!-- Lignes de données -->
            <div class="text-xs">
              <!-- Lignes existantes et nouvelles -->
              <template v-for="(row, index) in getPlayerRows(players[0])" :key="row.id">
                <div class="grid grid-cols-12 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors items-center">
                  <!-- Colonne Objectif avec select -->
                  <div class="col-span-9 p-2 border-r border-slate-600">
                    <select
                      v-if="row.isNew || row.isEditing"
                      v-model="row.objectiveId"
                      @change="updateObjective(players[0], row)"
                      class="w-full bg-slate-600 border border-slate-500 rounded text-white text-xs py-1 px-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Sélectionner un objectif...</option>
                      <optgroup label="🔥 Tactiques">
                        <option v-for="obj in tacticalObjectives" :key="obj.value" :value="obj.value">
                          {{ obj.label }} ({{ obj.maxPoints }}pts)
                        </option>
                      </optgroup>
                      <optgroup label="🧠 Stratégiques">
                        <option v-for="obj in strategicObjectives" :key="obj.value" :value="obj.value">
                          {{ obj.label }} ({{ obj.maxPoints }}pts)
                        </option>
                      </optgroup>
                      <optgroup label="🛡️ Gardiens">
                        <option v-for="obj in wardenObjectives" :key="obj.value" :value="obj.value">
                          {{ obj.label }} ({{ obj.maxPoints }}pts)
                        </option>
                      </optgroup>
                      <optgroup label="✏️ Personnalisé">
                        <option value="custom">Objectif personnalisé...</option>
                      </optgroup>
                    </select>
                    
                    <!-- Input personnalisé si "custom" est sélectionné -->
                    <input
                      v-else-if="row.objectiveId === 'custom'"
                      v-model="row.objectiveName"
                      @blur="saveCustomObjective(players[0], row)"
                      @keyup.enter="saveCustomObjective(players[0], row)"
                      placeholder="Nom de l'objectif personnalisé..."
                      class="w-full bg-slate-600 border border-slate-500 rounded text-white text-xs py-1 px-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    
                    <!-- Affichage normal -->
                    <div v-else class="text-slate-300" @dblclick="editRow(players[0], row)">
                      {{ row.objectiveName }}
                    </div>
                  </div>
                  
                  <!-- Colonne Score -->
                  <div class="col-span-2 p-2 text-center border-r border-slate-600">
                    <input
                      v-if="row.isNew || row.isEditing || row.objectiveName"
                      v-model.number="row.score"
                      @blur="saveScore(players[0], row)"
                      @keyup.enter="saveScore(players[0], row)"
                      type="number"
                      min="0"
                      max="15"
                      class="w-full bg-slate-600 border border-slate-500 rounded text-white text-xs py-1 px-1 text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <div v-else class="text-slate-500">0</div>
                  </div>
                  
                  <!-- Colonne Action -->
                  <div class="col-span-1 p-2 text-center">
                    <button
                      v-if="row.objectiveName"
                      @click="removeRow(players[0], row.id)"
                      class="w-5 h-5 flex items-center justify-center rounded bg-red-600 hover:bg-red-500 text-white transition-all duration-200"
                      title="Supprimer"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    <!-- Indicateur de sauvegarde -->
                    <div v-else-if="row.isSaving" class="w-5 h-5 flex items-center justify-center">
                      <div class="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Tableau joueur 2 -->
        <div v-if="players[1]" class="space-y-2">
          <h5 class="text-sm font-medium text-red-300 border-b border-slate-600 pb-1">
            {{ players[1].pseudo }}
            <span class="text-xs text-slate-400">(Total: {{ getPlayerSecondaryTotal(players[1]) }})</span>
          </h5>
          
          <!-- Tableau avec sélection inline -->
          <div class="border border-slate-600 rounded-lg overflow-hidden">
            <!-- En-têtes -->
            <div class="grid grid-cols-12 bg-slate-700/50 text-xs font-medium text-red-300">
              <div class="col-span-9 p-2 border-r border-slate-600">Objectif</div>
              <div class="col-span-2 p-2 text-center border-r border-slate-600">Score</div>
              <div class="col-span-1 p-2 text-center">Action</div>
            </div>
            
            <!-- Lignes de données -->
            <div class="text-xs">
              <!-- Lignes existantes et nouvelles -->
              <template v-for="(row, index) in getPlayerRows(players[1])" :key="row.id">
                <div class="grid grid-cols-12 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors items-center">
                  <!-- Colonne Objectif avec select -->
                  <div class="col-span-9 p-2 border-r border-slate-600">
                    <select
                      v-if="row.isNew || row.isEditing"
                      v-model="row.objectiveId"
                      @change="updateObjective(players[1], row)"
                      class="w-full bg-slate-600 border border-slate-500 rounded text-white text-xs py-1 px-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Sélectionner un objectif...</option>
                      <optgroup label="🔥 Tactiques">
                        <option v-for="obj in tacticalObjectives" :key="obj.value" :value="obj.value">
                          {{ obj.label }} ({{ obj.maxPoints }}pts)
                        </option>
                      </optgroup>
                      <optgroup label="🧠 Stratégiques">
                        <option v-for="obj in strategicObjectives" :key="obj.value" :value="obj.value">
                          {{ obj.label }} ({{ obj.maxPoints }}pts)
                        </option>
                      </optgroup>
                      <optgroup label="🛡️ Gardiens">
                        <option v-for="obj in wardenObjectives" :key="obj.value" :value="obj.value">
                          {{ obj.label }} ({{ obj.maxPoints }}pts)
                        </option>
                      </optgroup>
                      <optgroup label="✏️ Personnalisé">
                        <option value="custom">Objectif personnalisé...</option>
                      </optgroup>
                    </select>
                    
                    <!-- Input personnalisé si "custom" est sélectionné -->
                    <input
                      v-else-if="row.objectiveId === 'custom'"
                      v-model="row.objectiveName"
                      @blur="saveCustomObjective(players[1], row)"
                      @keyup.enter="saveCustomObjective(players[1], row)"
                      placeholder="Nom de l'objectif personnalisé..."
                      class="w-full bg-slate-600 border border-slate-500 rounded text-white text-xs py-1 px-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    
                    <!-- Affichage normal -->
                    <div v-else class="text-slate-300" @dblclick="editRow(players[1], row)">
                      {{ row.objectiveName }}
                    </div>
                  </div>
                  
                  <!-- Colonne Score -->
                  <div class="col-span-2 p-2 text-center border-r border-slate-600">
                    <input
                      v-if="row.isNew || row.isEditing || row.objectiveName"
                      v-model.number="row.score"
                      @blur="saveScore(players[1], row)"
                      @keyup.enter="saveScore(players[1], row)"
                      type="number"
                      min="0"
                      max="15"
                      class="w-full bg-slate-600 border border-slate-500 rounded text-white text-xs py-1 px-1 text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <div v-else class="text-slate-500">0</div>
                  </div>
                  
                  <!-- Colonne Action -->
                  <div class="col-span-1 p-2 text-center">
                    <button
                      v-if="row.objectiveName"
                      @click="removeRow(players[1], row.id)"
                      class="w-5 h-5 flex items-center justify-center rounded bg-red-600 hover:bg-red-500 text-white transition-all duration-200"
                      title="Supprimer"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    <!-- Indicateur de sauvegarde -->
                    <div v-else-if="row.isSaving" class="w-5 h-5 flex items-center justify-center">
                      <div class="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Placeholder si pas de joueur 2 -->
        <div v-else class="flex items-center justify-center p-4 border border-slate-600 rounded-lg">
          <span class="text-slate-400 text-sm">En attente d'adversaire</span>
        </div>
      </div>

      <!-- Message si aucun score secondaire -->
      <div v-if="allSecondaryScores.length === 0" class="text-center py-4 text-slate-400 text-sm">
        <svg class="w-8 h-8 mx-auto mb-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Aucun objectif secondaire enregistré</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { PlayerDto, SecondaryScoreDto, SecondaryObjectiveOption, SecondaryScoreRow } from '../types'

interface Props {
  players: PlayerDto[]
  secondaryScores: SecondaryScoreDto[]
}

const props = defineProps<Props>()

// État des lignes par joueur
const playerRows = reactive<Record<number, SecondaryScoreRow[]>>({})

// Objectifs prédéfinis organisés par catégorie
const tacticalObjectives: SecondaryObjectiveOption[] = [
  { value: 'engage-all-fronts', label: 'Engagement Sur Tous Les Fronts', category: 'tactical', maxPoints: 15 },
  { value: 'linebreaker', label: 'Briseur de Ligne', category: 'tactical', maxPoints: 15 },
  { value: 'behind-enemy-lines', label: 'Derrière les Lignes Ennemies', category: 'tactical', maxPoints: 15 },
  { value: 'teleport-homer', label: 'Balise de Téléportation', category: 'tactical', maxPoints: 15 }
]

const strategicObjectives: SecondaryObjectiveOption[] = [
  { value: 'raise-banners', label: 'Hisser les Bannières', category: 'strategic', maxPoints: 15 },
  { value: 'investigate-sites', label: 'Enquêter Sur Les Sites', category: 'strategic', maxPoints: 15 },
  { value: 'priority-targets', label: 'Cibles Prioritaires', category: 'strategic', maxPoints: 15 },
  { value: 'domination', label: 'Domination', category: 'strategic', maxPoints: 15 }
]

const wardenObjectives: SecondaryObjectiveOption[] = [
  { value: 'defend-stronghold', label: 'Défendre la Forteresse', category: 'warden', maxPoints: 15 },
  { value: 'hold-the-line', label: 'Tenir la Ligne', category: 'warden', maxPoints: 15 },
  { value: 'calculated-retreat', label: 'Retraite Calculée', category: 'warden', maxPoints: 15 }
]

// Tous les objectifs disponibles
const allObjectives = computed(() => [...tacticalObjectives, ...strategicObjectives, ...wardenObjectives])

// Initialiser les lignes pour chaque joueur
const initializePlayerRows = (player: PlayerDto) => {
  if (!playerRows[player.id]) {
    const existingScores = getPlayerSecondaryScores(player)
    const rows: SecondaryScoreRow[] = existingScores.map(score => ({
      id: `existing-${score.id}`,
      objectiveId: findObjectiveIdByName(score.scoreName) || 'custom',
      objectiveName: score.scoreName,
      score: score.scoreValue,
      isNew: false,
      isEditing: false,
      isSaving: false
    }))
    
    // Ajouter des lignes vides pour atteindre 5 lignes minimum
    while (rows.length < 5) {
      rows.push(createEmptyRow())
    }
    
    playerRows[player.id] = rows
  }
}

// Créer une ligne vide
const createEmptyRow = (): SecondaryScoreRow => ({
  id: crypto.randomUUID(),
  objectiveId: '',
  objectiveName: '',
  score: 0,
  isNew: true,
  isEditing: true,
  isSaving: false
})

// Trouver l'ID d'un objectif par son nom
const findObjectiveIdByName = (name: string): string | null => {
  const objective = allObjectives.value.find(obj => obj.label === name)
  return objective?.value || null
}

// Obtenir les lignes d'un joueur
const getPlayerRows = (player: PlayerDto | undefined): SecondaryScoreRow[] => {
  if (!player) return []
  initializePlayerRows(player)
  return playerRows[player.id] || []
}

// Tous les scores secondaires
const allSecondaryScores = computed(() => props.secondaryScores || [])

// Obtenir les scores secondaires d'un joueur spécifique
const getPlayerSecondaryScores = (player: PlayerDto | undefined) => {
  if (!player) return []
  return allSecondaryScores.value.filter(score => score.playerId === player.id)
}

// Obtenir le total des scores secondaires d'un joueur
const getPlayerSecondaryTotal = (player: PlayerDto | undefined) => {
  if (!player) return 0
  const rows = getPlayerRows(player)
  return rows.filter(row => row.objectiveName).reduce((total, row) => total + row.score, 0)
}

// Ajouter une nouvelle ligne
const addNewRow = (player: PlayerDto | undefined) => {
  if (!player) return
  initializePlayerRows(player)
  playerRows[player.id].push(createEmptyRow())
}

// Mettre à jour un objectif sélectionné
const updateObjective = (player: PlayerDto, row: SecondaryScoreRow) => {
  if (row.objectiveId && row.objectiveId !== 'custom') {
    const objective = allObjectives.value.find(obj => obj.value === row.objectiveId)
    if (objective) {
      row.objectiveName = objective.label
      row.isNew = false
      row.isEditing = false
      saveRow(player, row)
    }
  } else if (row.objectiveId === 'custom') {
    row.objectiveName = ''
    // L'utilisateur devra saisir le nom dans l'input
  }
}

// Sauvegarder un objectif personnalisé
const saveCustomObjective = (player: PlayerDto, row: SecondaryScoreRow) => {
  if (row.objectiveName.trim()) {
    row.isNew = false
    row.isEditing = false
    saveRow(player, row)
  }
}

// Éditer une ligne existante
const editRow = (player: PlayerDto, row: SecondaryScoreRow) => {
  row.isEditing = true
}

// Sauvegarder le score
const saveScore = (player: PlayerDto, row: SecondaryScoreRow) => {
  if (row.objectiveName && row.score >= 0 && row.score <= 15) {
    saveRow(player, row)
  }
}

// Sauvegarder une ligne complète
const saveRow = async (player: PlayerDto, row: SecondaryScoreRow) => {
  if (!row.objectiveName.trim()) return
  
  row.isSaving = true
  try {
    console.log('Sauvegarde de la ligne:', {
      playerId: player.id,
      objectiveName: row.objectiveName,
      score: row.score
    })
    
    // TODO: Implémenter la logique de sauvegarde via API
    // Pour l'instant, on simule une sauvegarde réussie
    await new Promise(resolve => setTimeout(resolve, 500))
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    // TODO: Afficher une notification d'erreur
  } finally {
    row.isSaving = false
  }
}

// Supprimer une ligne
const removeRow = (player: PlayerDto, rowId: string) => {
  if (!playerRows[player.id]) return
  
  const index = playerRows[player.id].findIndex(row => row.id === rowId)
  if (index !== -1) {
    // TODO: Supprimer côté serveur si c'est une ligne existante
    playerRows[player.id].splice(index, 1)
  }
}

// Initialiser les joueurs au montage
props.players.forEach(player => {
  if (player) {
    initializePlayerRows(player)
  }
})
</script>