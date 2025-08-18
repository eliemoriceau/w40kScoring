<template>
  <div class="step-container step-4">
    <!-- En-tête de l'étape -->
    <div class="step-header">
      <h2 class="step-title">🎯 Configuration des Rounds</h2>
      <p class="step-subtitle">
        Préparez les 5 rounds de bataille avec les objectifs de scoring
      </p>
    </div>

    <!-- Contenu principal -->
    <div class="step-content">
      <!-- Options de rounds -->
      <div class="config-section">
        <h3 class="section-title">Gestion des Rounds</h3>
        <p class="section-description">
          Configurez comment vous souhaitez gérer le scoring des rounds
        </p>
        
        <div class="rounds-options">
          <div class="option-card" :class="{ 'selected': data.enableRounds }" @click="toggleRounds(true)">
            <div class="option-icon">📊</div>
            <div class="option-info">
              <h4>Scoring par Rounds</h4>
              <p>Saisissez les scores round par round pendant la partie</p>
            </div>
            <div class="option-features">
              <span class="feature-tag">✅ Suivi détaillé</span>
              <span class="feature-tag">✅ Objectifs multiples</span>
            </div>
          </div>
          
          <div class="option-card" :class="{ 'selected': !data.enableRounds }" @click="toggleRounds(false)">
            <div class="option-icon">🏆</div>
            <div class="option-info">
              <h4>Score Final Seulement</h4>
              <p>Saisissez uniquement le score final à la fin de la partie</p>
            </div>
            <div class="option-features">
              <span class="feature-tag">⚡ Plus rapide</span>
              <span class="feature-tag">🎲 Moins détaillé</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration des rounds si activés -->
      <div v-if="data.enableRounds" class="config-section">
        <h3 class="section-title">Rounds de Bataille</h3>
        <p class="section-description">
          Chaque partie se déroule sur exactement 5 rounds avec différents types d'objectifs
        </p>
        
        <div class="rounds-grid">
          <div 
            v-for="round in rounds"
            :key="round.roundNumber"
            class="round-card"
            :class="{ 'configured': isRoundConfigured(round.roundNumber) }"
          >
            <div class="round-header">
              <div class="round-number">
                <span class="round-label">Round</span>
                <span class="round-digit">{{ round.roundNumber }}</span>
              </div>
              <div class="round-status">
                <span v-if="isRoundConfigured(round.roundNumber)" class="status-icon configured">✅</span>
                <span v-else class="status-icon pending">⏳</span>
              </div>
            </div>
            
            <div class="round-content">
              <!-- Scores par type -->
              <div class="score-types">
                <div class="score-type primary">
                  <h5>Objectifs Primaires</h5>
                  <div class="score-inputs">
                    <div class="player-score">
                      <label>{{ getPlayerName(true) }}</label>
                      <input 
                        v-model.number="round.scores.primary.player"
                        type="number"
                        min="0"
                        max="50"
                        class="score-input"
                        @input="updateRoundScore(round.roundNumber)"
                      />
                    </div>
                    <div class="vs-separator">VS</div>
                    <div class="player-score">
                      <label>{{ getPlayerName(false) }}</label>
                      <input 
                        v-model.number="round.scores.primary.opponent"
                        type="number"
                        min="0"
                        max="50"
                        class="score-input"
                        @input="updateRoundScore(round.roundNumber)"
                      />
                    </div>
                  </div>
                </div>
                
                <div class="score-type secondary">
                  <h5>Objectifs Secondaires</h5>
                  <div class="score-inputs">
                    <div class="player-score">
                      <label>{{ getPlayerName(true) }}</label>
                      <input 
                        v-model.number="round.scores.secondary.player"
                        type="number"
                        min="0"
                        max="15"
                        class="score-input"
                        @input="updateRoundScore(round.roundNumber)"
                      />
                    </div>
                    <div class="vs-separator">VS</div>
                    <div class="player-score">
                      <label>{{ getPlayerName(false) }}</label>
                      <input 
                        v-model.number="round.scores.secondary.opponent"
                        type="number"
                        min="0"
                        max="15"
                        class="score-input"
                        @input="updateRoundScore(round.roundNumber)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Total du round -->
              <div class="round-total">
                <div class="total-player">
                  Total: {{ getRoundTotal(round.roundNumber, true) }} pts
                </div>
                <div class="total-opponent">
                  Total: {{ getRoundTotal(round.roundNumber, false) }} pts
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Récapitulatif des scores -->
      <div v-if="data.enableRounds" class="config-section">
        <div class="score-summary">
          <h3 class="section-title">Récapitulatif des Scores</h3>
          
          <div class="summary-grid">
            <div class="player-summary">
              <h4 class="player-name">{{ getPlayerName(true) }}</h4>
              <div class="score-breakdown">
                <div class="score-item">
                  <span>Objectifs Primaires:</span>
                  <span class="score-value primary">{{ getTotalScores().player.primary }} pts</span>
                </div>
                <div class="score-item">
                  <span>Objectifs Secondaires:</span>
                  <span class="score-value secondary">{{ getTotalScores().player.secondary }} pts</span>
                </div>
                <div class="score-item total">
                  <span>Score Total:</span>
                  <span class="score-value total">{{ getTotalScores().player.total }} pts</span>
                </div>
              </div>
            </div>
            
            <div class="vs-divider">
              <div class="vs-icon">⚔️</div>
              <div class="vs-text">VS</div>
            </div>
            
            <div class="player-summary">
              <h4 class="player-name">{{ getPlayerName(false) }}</h4>
              <div class="score-breakdown">
                <div class="score-item">
                  <span>Objectifs Primaires:</span>
                  <span class="score-value primary">{{ getTotalScores().opponent.primary }} pts</span>
                </div>
                <div class="score-item">
                  <span>Objectifs Secondaires:</span>
                  <span class="score-value secondary">{{ getTotalScores().opponent.secondary }} pts</span>
                </div>
                <div class="score-item total">
                  <span>Score Total:</span>
                  <span class="score-value total">{{ getTotalScores().opponent.total }} pts</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Résultat actuel -->
          <div class="current-result">
            <div class="result-icon">{{ getResultIcon() }}</div>
            <div class="result-text">{{ getCurrentResult() }}</div>
          </div>
        </div>
      </div>

      <!-- Informations importantes -->
      <div class="config-section">
        <div class="info-panel">
          <h3 class="section-title">Informations Importantes</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-icon">⏱️</div>
              <div class="info-content">
                <h4>Durée des Rounds</h4>
                <p>Chaque round dure environ {{ Math.ceil(getEstimatedDuration() / 5) }} minutes</p>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon">📋</div>
              <div class="info-content">
                <h4>Modification des Scores</h4>
                <p>{{ getScoreModificationText() }}</p>
              </div>
            </div>
            <div class="info-item">
              <div class="info-icon">🎯</div>
              <div class="info-content">
                <h4>Types d'Objectifs</h4>
                <p>Primaires (0-50 pts) et Secondaires (0-15 pts) par round</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="step-navigation">
      <button 
        @click="$emit('previous')"
        class="btn-previous"
      >
        ⮜ Précédent
      </button>
      
      <button 
        @click="$emit('next')"
        :disabled="!isValid || loading"
        class="btn-next"
        :class="{ 'loading': loading }"
      >
        <span v-if="loading" class="btn-spinner">⏳</span>
        <span v-else>Suivant ⮞</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { GameCreationWizardData } from '../types/wizard'

interface Props {
  data: GameCreationWizardData
  props: {
    userFriends: Array<{ id: number; pseudo: string; avatar?: string }>
    currentUser: { id: number; pseudo: string; email: string }
  }
  errors?: Record<string, string[]>
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:data': [Partial<GameCreationWizardData>]
  'previous': []
  'next': []
  'validate': []
}>()

// Structure des rounds avec scores détaillés
interface RoundScore {
  roundNumber: number
  scores: {
    primary: { player: number; opponent: number }
    secondary: { player: number; opponent: number }
  }
}

const rounds = ref<RoundScore[]>([])

// Computed
const isValid = computed(() => {
  if (!props.data.enableRounds) {
    return true // Si pas de rounds détaillés, toujours valide
  }
  
  // Pour les rounds détaillés, on accepte des scores à 0 (pas encore joués)
  return rounds.value.length === 5
})

// Méthodes pour les noms des joueurs
const getPlayerName = (isCurrentUser: boolean): string => {
  if (isCurrentUser) {
    return props.props.currentUser.pseudo
  }
  
  const opponent = props.data.players?.find(p => !p.isCurrentUser)
  return opponent?.pseudo || 'Adversaire'
}

// Gestion des rounds
const toggleRounds = (enabled: boolean) => {
  emit('update:data', { enableRounds: enabled })
  
  if (enabled) {
    initializeRounds()
  } else {
    rounds.value = []
    emit('update:data', { rounds: [] })
  }
  
  emit('validate')
}

const initializeRounds = () => {
  if (rounds.value.length === 0) {
    rounds.value = Array.from({ length: 5 }, (_, index) => ({
      roundNumber: index + 1,
      scores: {
        primary: { player: 0, opponent: 0 },
        secondary: { player: 0, opponent: 0 }
      }
    }))
  }
}

const updateRoundScore = (roundNumber: number) => {
  const updatedRounds = rounds.value.map(round => {
    if (round.roundNumber === roundNumber) {
      return {
        roundNumber: round.roundNumber,
        playerScore: round.scores.primary.player + round.scores.secondary.player,
        opponentScore: round.scores.primary.opponent + round.scores.secondary.opponent,
        scores: [{
          playerId: 'player',
          scoreType: 'PRIMARY' as const,
          scoreValue: round.scores.primary.player
        }, {
          playerId: 'player', 
          scoreType: 'SECONDARY' as const,
          scoreValue: round.scores.secondary.player
        }, {
          playerId: 'opponent',
          scoreType: 'PRIMARY' as const,
          scoreValue: round.scores.primary.opponent
        }, {
          playerId: 'opponent',
          scoreType: 'SECONDARY' as const,
          scoreValue: round.scores.secondary.opponent
        }]
      }
    }
    return {
      roundNumber: round.roundNumber,
      playerScore: round.scores.primary.player + round.scores.secondary.player,
      opponentScore: round.scores.primary.opponent + round.scores.secondary.opponent
    }
  })
  
  emit('update:data', { rounds: updatedRounds })
  emit('validate')
}

const isRoundConfigured = (roundNumber: number): boolean => {
  const round = rounds.value.find(r => r.roundNumber === roundNumber)
  if (!round) return false
  
  return (round.scores.primary.player + round.scores.primary.opponent + 
          round.scores.secondary.player + round.scores.secondary.opponent) > 0
}

const getRoundTotal = (roundNumber: number, isPlayer: boolean): number => {
  const round = rounds.value.find(r => r.roundNumber === roundNumber)
  if (!round) return 0
  
  if (isPlayer) {
    return round.scores.primary.player + round.scores.secondary.player
  } else {
    return round.scores.primary.opponent + round.scores.secondary.opponent
  }
}

// Calculs de totaux
const getTotalScores = () => {
  const totals = {
    player: { primary: 0, secondary: 0, total: 0 },
    opponent: { primary: 0, secondary: 0, total: 0 }
  }
  
  rounds.value.forEach(round => {
    totals.player.primary += round.scores.primary.player
    totals.player.secondary += round.scores.secondary.player
    totals.opponent.primary += round.scores.primary.opponent
    totals.opponent.secondary += round.scores.secondary.opponent
  })
  
  totals.player.total = totals.player.primary + totals.player.secondary
  totals.opponent.total = totals.opponent.primary + totals.opponent.secondary
  
  return totals
}

const getCurrentResult = (): string => {
  const totals = getTotalScores()
  
  if (totals.player.total === totals.opponent.total) {
    return 'Égalité parfaite!'
  } else if (totals.player.total > totals.opponent.total) {
    const diff = totals.player.total - totals.opponent.total
    return `${getPlayerName(true)} mène de ${diff} points`
  } else {
    const diff = totals.opponent.total - totals.player.total
    return `${getPlayerName(false)} mène de ${diff} points`
  }
}

const getResultIcon = (): string => {
  const totals = getTotalScores()
  
  if (totals.player.total === totals.opponent.total) {
    return '🤝'
  } else if (totals.player.total > totals.opponent.total) {
    return '🏆'
  } else {
    return '⚔️'
  }
}

// Autres méthodes utilitaires
const getEstimatedDuration = (): number => {
  const points = props.data.pointsLimit
  if (points <= 500) return 60
  if (points <= 1000) return 90
  if (points <= 1500) return 105
  if (points <= 2000) return 120
  return 150
}

const getScoreModificationText = (): string => {
  if (props.data.opponentType === 'guest') {
    return 'Vous seul pourrez modifier les scores pendant la partie'
  }
  return 'Les deux joueurs pourront modifier les scores en temps réel'
}

// Lifecycle
onMounted(() => {
  if (props.data.enableRounds && rounds.value.length === 0) {
    initializeRounds()
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

.section-description {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
}

/* Options de rounds */
.rounds-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.option-card {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-card:hover {
  border-color: #dc143c;
  background: rgba(220, 20, 60, 0.1);
  transform: translateY(-2px);
}

.option-card.selected {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.3);
}

.option-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.option-info h4 {
  color: #ffffff;
  font-size: 1.3rem;
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.option-info p {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 1.4;
  margin: 0 0 1rem 0;
}

.option-features {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.feature-tag {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Grille des rounds */
.rounds-grid {
  display: grid;
  gap: 1.5rem;
}

.round-card {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.round-card.configured {
  border-color: #228b22;
  background: rgba(34, 139, 34, 0.1);
  box-shadow: 0 0 15px rgba(34, 139, 34, 0.2);
}

.round-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.round-number {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.round-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
}

.round-digit {
  color: #ffd700;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.status-icon {
  font-size: 1.5rem;
}

.status-icon.configured {
  animation: pulse-success 2s infinite;
}

@keyframes pulse-success {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Types de scores */
.score-types {
  display: grid;
  gap: 1.5rem;
}

.score-type {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid transparent;
}

.score-type.primary {
  border-left-color: #dc143c;
}

.score-type.secondary {
  border-left-color: #4682b4;
}

.score-type h5 {
  color: #ffd700;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  text-align: center;
}

.score-inputs {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: end;
}

.player-score {
  text-align: center;
}

.player-score label {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.score-input {
  width: 80px;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  text-align: center;
}

.score-input:focus {
  outline: none;
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.vs-separator {
  color: #dc143c;
  font-weight: bold;
  font-size: 1.2rem;
  text-shadow: 0 0 5px rgba(220, 20, 60, 0.5);
  align-self: center;
}

/* Total du round */
.round-total {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.total-player, .total-opponent {
  text-align: center;
  font-weight: bold;
  color: #ffd700;
  font-size: 1.1rem;
}

/* Récapitulatif des scores */
.score-summary {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2rem;
  align-items: center;
  margin-bottom: 2rem;
}

.player-summary {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
}

.player-summary h4 {
  color: #ffd700;
  text-align: center;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.score-breakdown {
  display: grid;
  gap: 0.5rem;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.score-item.total {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: bold;
  font-size: 1.1rem;
}

.score-value.primary {
  color: #dc143c;
}

.score-value.secondary {
  color: #4682b4;
}

.score-value.total {
  color: #ffd700;
  font-weight: bold;
}

.vs-divider {
  text-align: center;
}

.vs-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  animation: rotate-battle 3s linear infinite;
}

.vs-text {
  color: #dc143c;
  font-weight: bold;
  font-size: 1.5rem;
  text-shadow: 0 0 10px rgba(220, 20, 60, 0.5);
}

@keyframes rotate-battle {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Résultat actuel */
.current-result {
  text-align: center;
  padding: 1.5rem;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  border: 1px solid #ffd700;
}

.result-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.result-text {
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

/* Panel d'informations */
.info-panel {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.info-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.info-content h4 {
  color: #ffd700;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.info-content p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.4;
}

/* Navigation */
.step-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-previous, .btn-next {
  padding: 1rem 2rem;
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

.btn-previous {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.btn-previous:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.btn-next {
  background: linear-gradient(135deg, #dc143c, #8b0000);
  border: 2px solid #ffd700;
  color: white;
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .step-container {
    padding: 1.5rem;
  }
  
  .step-title {
    font-size: 2rem;
  }
  
  .rounds-options {
    grid-template-columns: 1fr;
  }
  
  .score-inputs {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .vs-separator {
    display: none;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    text-align: center;
  }
  
  .vs-divider {
    order: -1;
  }
  
  .step-navigation {
    flex-direction: column-reverse;
    gap: 1rem;
  }
  
  .btn-previous, .btn-next {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .round-header {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .score-input {
    width: 100%;
    max-width: 120px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>