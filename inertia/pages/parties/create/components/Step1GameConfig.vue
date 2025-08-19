<template>
  <div class="step-container step-1">
    <!-- En-tête de l'étape -->
    <div class="step-header">
      <h2 class="step-title">⚔️ Configuration de la Bataille</h2>
      <p class="step-subtitle">Définissez les paramètres de base de votre partie Warhammer 40K</p>
    </div>

    <!-- Contenu principal -->
    <div class="step-content">
      <!-- Type de jeu -->
      <div class="config-section">
        <h3 class="section-title">Type de Jeu</h3>
        <p class="section-description">
          Choisissez le format de votre partie selon les règles officielles
        </p>

        <div class="game-type-grid">
          <div
            v-for="gameType in gameTypes"
            :key="gameType.value"
            class="game-type-card"
            :class="{ selected: data.gameType === gameType.value }"
            @click="selectGameType(gameType.value)"
          >
            <div class="game-type-icon">
              {{ getGameTypeIcon(gameType.value) }}
            </div>
            <div class="game-type-info">
              <h4 class="game-type-name">{{ gameType.displayName }}</h4>
              <p class="game-type-desc">{{ getGameTypeDescription(gameType.value) }}</p>
            </div>
            <div class="selection-indicator">
              <span v-if="data.gameType === gameType.value" class="selected-check">✓</span>
            </div>
          </div>
        </div>

        <div v-if="errors?.gameType" class="error-message">
          {{ errors.gameType[0] }}
        </div>
      </div>

      <!-- Limite de points -->
      <div class="config-section">
        <h3 class="section-title">Limite de Points</h3>
        <p class="section-description">
          Définissez la taille de votre armée (entre 500 et 5000 points, multiples de 50)
        </p>

        <!-- Presets de points populaires -->
        <div class="points-presets">
          <button
            v-for="preset in pointsPresets"
            :key="preset"
            @click="selectPointsPreset(preset)"
            class="preset-btn"
            :class="{ active: data.pointsLimit === preset }"
          >
            {{ preset }} pts
            <span v-if="preset === 2000" class="recommended-badge">Recommandé</span>
          </button>
        </div>

        <!-- Input personnalisé -->
        <div class="points-input-container">
          <label class="input-label">Points personnalisés :</label>
          <div class="points-input-wrapper">
            <input
              v-model.number="customPoints"
              type="number"
              :min="500"
              :max="5000"
              :step="50"
              class="points-input"
              placeholder="2000"
              @input="handleCustomPointsInput"
            />
            <span class="points-unit">pts</span>
          </div>
          <div class="points-info">
            <span class="duration-estimate"> ⏱️ Durée estimée : {{ estimatedDuration }} </span>
          </div>
        </div>

        <div v-if="errors?.pointsLimit" class="error-message">
          {{ errors.pointsLimit[0] }}
        </div>
      </div>

      <!-- Mission (optionnel) -->
      <div class="config-section">
        <h3 class="section-title">Mission <span class="optional-label">(Optionnel)</span></h3>
        <p class="section-description">
          Sélectionnez une mission spécifique ou laissez vide pour une sélection aléatoire
        </p>

        <div class="mission-selector">
          <select v-model="data.mission" class="mission-select" @change="handleMissionChange">
            <option value="">Mission aléatoire</option>
            <option v-for="mission in availableMissions" :key="mission.id" :value="mission.name">
              {{ mission.name }}
            </option>
          </select>

          <!-- Description de la mission sélectionnée -->
          <div v-if="selectedMissionDescription" class="mission-description">
            <h4>Description :</h4>
            <p>{{ selectedMissionDescription }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="step-navigation">
      <button
        @click="$emit('next')"
        :disabled="!isValid || loading"
        class="btn-next"
        :class="{ loading: loading }"
      >
        <span v-if="loading" class="btn-spinner">⏳</span>
        <span v-else>Suivant ⮞</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { GameCreationWizardData, GameType } from '../types/wizard'

interface Props {
  data: GameCreationWizardData
  props: {
    availableMissions: Array<{ id: number; name: string; description: string }>
    gameTypes: Array<{ value: GameType; displayName: string }>
    defaultPointsLimit?: number
  }
  errors?: Record<string, string[]>
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:data': [Partial<GameCreationWizardData>]
  'next': []
  'validate': []
}>()

// État local
const customPoints = ref(props.data.pointsLimit || 2000)
const pointsPresets = [1000, 1500, 2000, 2500, 3000]

// Computed
const isValid = computed(() => {
  return !!(
    props.data.gameType &&
    props.data.pointsLimit >= 500 &&
    props.data.pointsLimit <= 5000 &&
    props.data.pointsLimit % 50 === 0
  )
})

const selectedMissionDescription = computed(() => {
  if (!props.data.mission) return null
  const mission = props.props.availableMissions.find((m) => m.name === props.data.mission)
  return mission?.description || null
})

const estimatedDuration = computed(() => {
  const points = props.data.pointsLimit
  if (points <= 500) return '1h'
  if (points <= 1000) return '1h30'
  if (points <= 1500) return '1h45'
  if (points <= 2000) return '2h'
  return '2h30+'
})

// Méthodes
const selectGameType = (gameType: GameType) => {
  emit('update:data', { gameType })
  emit('validate')
}

const selectPointsPreset = (points: number) => {
  customPoints.value = points
  emit('update:data', { pointsLimit: points })
  emit('validate')
}

const handleCustomPointsInput = () => {
  if (customPoints.value && customPoints.value >= 500 && customPoints.value <= 5000) {
    // Arrondir au multiple de 50 le plus proche
    const rounded = Math.round(customPoints.value / 50) * 50
    customPoints.value = rounded
    emit('update:data', { pointsLimit: rounded })
    emit('validate')
  }
}

const handleMissionChange = () => {
  emit('validate')
}

const getGameTypeIcon = (type: GameType): string => {
  const icons = {
    MATCHED_PLAY: '⚖️',
    NARRATIVE: '📖',
    OPEN_PLAY: '🎲',
  }
  return icons[type] || '⚔️'
}

const getGameTypeDescription = (type: GameType): string => {
  const descriptions = {
    MATCHED_PLAY: 'Parties équilibrées et compétitives avec règles strictes',
    NARRATIVE: 'Parties thématiques avec scénarios et histoires immersives',
    OPEN_PLAY: 'Parties libres et décontractées pour tous les niveaux',
  }
  return descriptions[type] || ''
}

// Lifecycle
onMounted(() => {
  // Initialiser avec les valeurs par défaut
  if (!props.data.gameType) {
    emit('update:data', { gameType: 'MATCHED_PLAY' as GameType })
  }
  if (!props.data.pointsLimit) {
    emit('update:data', { pointsLimit: props.props.defaultPointsLimit || 2000 })
  }
  emit('validate')
})
</script>

<style scoped>
.step-container {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #dc143c;
  border-radius: 16px;
  padding: 2rem;
  box-shadow:
    0 0 30px rgba(220, 20, 60, 0.3),
    inset 0 1px 0 rgba(255, 215, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
}

.step-container::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #dc143c, #ffd700, #dc143c);
  border-radius: 18px;
  z-index: -1;
  opacity: 0.6;
}

/* En-tête */
.step-header {
  text-align: center;
  margin-bottom: 3rem;
}

.step-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 15px rgba(220, 20, 60, 0.5);
  margin: 0 0 1rem 0;
  letter-spacing: 1px;
}

.step-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
}

/* Sections */
.config-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffd700;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.optional-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: normal;
}

.section-description {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
}

/* Types de jeu */
.game-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.game-type-card {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.game-type-card:hover {
  border-color: #dc143c;
  background: rgba(220, 20, 60, 0.1);
  transform: translateY(-2px);
}

.game-type-card.selected {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.game-type-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.game-type-info {
  flex: 1;
}

.game-type-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
}

.game-type-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.3;
}

.selection-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.selected-check {
  display: inline-block;
  width: 24px;
  height: 24px;
  background: #ffd700;
  color: #000;
  border-radius: 50%;
  text-align: center;
  line-height: 24px;
  font-weight: bold;
  font-size: 0.8rem;
}

/* Points */
.points-presets {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
}

.preset-btn:hover {
  border-color: #dc143c;
  background: rgba(220, 20, 60, 0.1);
}

.preset-btn.active {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.2);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.recommended-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #228b22;
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-weight: bold;
}

.points-input-container {
  background: rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.input-label {
  display: block;
  color: #ffd700;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.points-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.points-input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
}

.points-input:focus {
  outline: none;
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.points-unit {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.points-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.duration-estimate {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

/* Mission */
.mission-selector {
  margin-top: 1rem;
}

.mission-select {
  width: 100%;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.mission-select:focus {
  outline: none;
  border-color: #ffd700;
}

.mission-description {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 215, 0, 0.1);
  border-left: 4px solid #ffd700;
  border-radius: 6px;
}

.mission-description h4 {
  margin: 0 0 0.5rem 0;
  color: #ffd700;
}

.mission-description p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
}

/* Navigation */
.step-navigation {
  display: flex;
  justify-content: flex-end;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-next {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #dc143c, #8b0000);
  border: 2px solid #ffd700;
  color: white;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 150px;
  position: relative;
}

.btn-next:hover:not(:disabled) {
  background: linear-gradient(135deg, #8b0000, #dc143c);
  box-shadow: 0 0 25px rgba(220, 20, 60, 0.5);
  transform: translateY(-2px);
}

.btn-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-next.loading {
  pointer-events: none;
}

.btn-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Messages d'erreur */
.error-message {
  color: #ff6b6b;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 107, 107, 0.1);
  border-left: 3px solid #ff6b6b;
  border-radius: 4px;
}

/* Responsive */
@media (max-width: 768px) {
  .step-container {
    padding: 1.5rem;
  }

  .step-title {
    font-size: 2rem;
  }

  .game-type-grid {
    grid-template-columns: 1fr;
  }

  .points-presets {
    justify-content: center;
  }

  .preset-btn {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .points-presets {
    flex-direction: column;
  }

  .step-navigation {
    justify-content: center;
  }
}
</style>
