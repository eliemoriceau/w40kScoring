<template>
  <div class="step-container step-5">
    <!-- En-tête de l'étape -->
    <div class="step-header">
      <h2 class="step-title">🏁 Récapitulatif Final</h2>
      <p class="step-subtitle">Vérifiez tous les détails avant de créer votre bataille épique</p>
    </div>

    <!-- Contenu principal -->
    <div class="step-content">
      <!-- Configuration de la partie -->
      <div class="summary-section">
        <div class="section-card game-config">
          <div class="card-header">
            <h3 class="card-title">⚔️ Configuration de la Bataille</h3>
            <button @click="$emit('step-change', 1)" class="edit-btn">✏️ Modifier</button>
          </div>

          <div class="config-details">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Type de Jeu :</span>
                <span class="detail-value">{{ getGameTypeDisplay(data.gameType) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Limite de Points :</span>
                <span class="detail-value primary">{{ data.pointsLimit }} pts</span>
              </div>
              <div v-if="data.mission" class="detail-item">
                <span class="detail-label">Mission :</span>
                <span class="detail-value">{{ data.mission }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Durée Estimée :</span>
                <span class="detail-value">{{ getEstimatedDuration() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration des joueurs -->
      <div class="summary-section">
        <div class="section-card players-config">
          <div class="card-header">
            <h3 class="card-title">👥 Joueurs</h3>
            <button @click="$emit('step-change', 2)" class="edit-btn">
              ✏️ Modifier Adversaire
            </button>
          </div>

          <div class="players-summary">
            <!-- Joueur principal -->
            <div class="player-summary current-user">
              <div class="player-info">
                <div class="player-avatar">
                  <span class="avatar-text">{{
                    props.currentUser.pseudo.charAt(0).toUpperCase()
                  }}</span>
                </div>
                <div class="player-details">
                  <h4 class="player-name">{{ props.currentUser.pseudo }}</h4>
                  <span class="player-role">Organisateur</span>
                  <div v-if="getCurrentPlayerArmy()" class="player-army">
                    🛡️ {{ getCurrentPlayerArmy() }}
                  </div>
                </div>
              </div>
              <div class="player-status">
                <span class="status-badge confirmed">✅ Prêt</span>
              </div>
            </div>

            <!-- VS Divider -->
            <div class="vs-container">
              <div class="vs-icon">⚔️</div>
              <div class="vs-text">VERSUS</div>
            </div>

            <!-- Adversaire -->
            <div class="player-summary opponent">
              <div class="player-info">
                <div class="player-avatar opponent-avatar">
                  <span class="avatar-text">{{ getOpponentName().charAt(0).toUpperCase() }}</span>
                </div>
                <div class="player-details">
                  <h4 class="player-name">{{ getOpponentName() }}</h4>
                  <span class="player-role">{{ getOpponentRole() }}</span>
                  <div v-if="getOpponentArmy()" class="player-army">🛡️ {{ getOpponentArmy() }}</div>
                </div>
              </div>
              <div class="player-status">
                <span class="status-badge" :class="getOpponentStatusClass()">
                  {{ getOpponentStatusIcon() }} {{ getOpponentStatus() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions spéciales selon le type d'adversaire -->
          <div v-if="data.opponentType === 'invite'" class="invite-info">
            <div class="info-box">
              <div class="info-icon">📧</div>
              <div class="info-content">
                <p>
                  L'invitation sera envoyée à <strong>{{ data.opponentEmail }}</strong> après
                  création de la partie.
                </p>
              </div>
            </div>
          </div>

          <div v-if="data.opponentType === 'guest'" class="guest-info">
            <div class="info-box">
              <div class="info-icon">👤</div>
              <div class="info-content">
                <p>
                  Vous gérerez tous les aspects de cette partie pour le compte de votre adversaire
                  invité.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration des rounds -->
      <div class="summary-section">
        <div class="section-card rounds-config">
          <div class="card-header">
            <h3 class="card-title">🎯 Gestion des Scores</h3>
            <button @click="$emit('step-change', 4)" class="edit-btn">✏️ Modifier</button>
          </div>

          <div class="rounds-summary">
            <div v-if="data.enableRounds" class="rounds-enabled">
              <div class="rounds-info">
                <div class="info-item">
                  <span class="info-icon">📊</span>
                  <span class="info-text">Scoring détaillé par rounds (5 rounds maximum)</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">🎯</span>
                  <span class="info-text"
                    >Objectifs Primaires (0-50 pts) et Secondaires (0-15 pts)</span
                  >
                </div>
                <div class="info-item">
                  <span class="info-icon">⚡</span>
                  <span class="info-text">Saisie des scores en temps réel</span>
                </div>
              </div>

              <!-- Prévisualisation des rounds si des scores sont déjà saisis -->
              <div v-if="hasPreConfiguredScores()" class="rounds-preview">
                <h4>Scores pré-configurés :</h4>
                <div class="preview-rounds">
                  <div
                    v-for="round in getPreConfiguredRounds()"
                    :key="round.roundNumber"
                    class="preview-round"
                  >
                    <span class="round-label">R{{ round.roundNumber }}</span>
                    <span class="round-scores">
                      {{ round.playerScore || 0 }} - {{ round.opponentScore || 0 }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="rounds-disabled">
              <div class="info-item">
                <span class="info-icon">🏆</span>
                <span class="info-text">Score final uniquement à la fin de la partie</span>
              </div>
              <div class="info-item">
                <span class="info-icon">⚡</span>
                <span class="info-text">Saisie rapide et simplifiée</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Informations importantes -->
      <div class="summary-section">
        <div class="section-card important-info">
          <div class="card-header">
            <h3 class="card-title">⚠️ Informations Importantes</h3>
          </div>

          <div class="important-list">
            <div class="important-item">
              <div class="item-icon">🔒</div>
              <div class="item-content">
                <h4>Permissions</h4>
                <p>{{ getPermissionsText() }}</p>
              </div>
            </div>

            <div class="important-item">
              <div class="item-icon">💾</div>
              <div class="item-content">
                <h4>Sauvegarde</h4>
                <p>Tous les scores sont automatiquement sauvegardés en temps réel</p>
              </div>
            </div>

            <div class="important-item">
              <div class="item-icon">📱</div>
              <div class="item-content">
                <h4>Accès</h4>
                <p>La partie sera accessible depuis n'importe quel appareil connecté</p>
              </div>
            </div>

            <div class="important-item">
              <div class="item-icon">📊</div>
              <div class="item-content">
                <h4>Historique</h4>
                <p>Cette partie sera ajoutée à votre historique de matchs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions finales -->
      <div class="summary-section">
        <div class="final-actions">
          <div class="action-info">
            <h3>🚀 Prêt à créer votre bataille ?</h3>
            <p>Une fois créée, la partie sera immédiatement disponible pour jouer.</p>
          </div>

          <div class="create-options">
            <div class="option-card">
              <div class="option-icon">🎮</div>
              <div class="option-content">
                <h4>Créer et Jouer</h4>
                <p>Créer la partie et commencer immédiatement</p>
              </div>
            </div>

            <div class="option-card">
              <div class="option-icon">📅</div>
              <div class="option-content">
                <h4>Créer et Programmer</h4>
                <p>Créer la partie pour la jouer plus tard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="step-navigation">
      <button @click="$emit('previous')" class="btn-previous">⮜ Précédent</button>

      <button
        @click="handleCreateGame"
        :disabled="loading"
        class="btn-create"
        :class="{ loading: loading }"
      >
        <span v-if="loading" class="btn-spinner">⏳</span>
        <span v-else>🚀 Créer la Bataille</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GameCreationWizardData, GameType, OpponentType } from '../types/wizard'

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
  'previous': []
  'step-change': [number]
  'create-game': []
}>()

// Computed pour les détails du jeu
const getGameTypeDisplay = (gameType: GameType): string => {
  const displays = {
    MATCHED_PLAY: 'Jeu Équilibré (Matched Play)',
    NARRATIVE: 'Jeu Narratif (Narrative)',
    OPEN_PLAY: 'Jeu Libre (Open Play)',
  }
  return displays[gameType] || gameType
}

const getEstimatedDuration = (): string => {
  const points = props.data.pointsLimit
  if (points <= 500) return '1h'
  if (points <= 1000) return '1h30'
  if (points <= 1500) return '1h45'
  if (points <= 2000) return '2h'
  return '2h30+'
}

// Méthodes pour les joueurs
const getCurrentPlayerArmy = (): string => {
  const player = props.data.players?.find((p) => p.isCurrentUser)
  return player?.army || ''
}

const getOpponentName = (): string => {
  if (props.data.opponentType === 'existing' && props.data.opponentId) {
    const friend = props.props.userFriends.find((f) => f.id === props.data.opponentId)
    return friend?.pseudo || 'Adversaire'
  }
  return props.data.opponentPseudo || props.data.opponentEmail || 'Adversaire'
}

const getOpponentArmy = (): string => {
  const opponent = props.data.players?.find((p) => !p.isCurrentUser)
  return opponent?.army || ''
}

const getOpponentRole = (): string => {
  const roles: Record<OpponentType, string> = {
    existing: 'Ami',
    invite: 'Invité par Email',
    guest: 'Joueur Invité',
  }
  return roles[props.data.opponentType] || 'Adversaire'
}

const getOpponentStatus = (): string => {
  switch (props.data.opponentType) {
    case 'existing':
      return 'Confirmé'
    case 'invite':
      return 'En Attente'
    case 'guest':
      return 'Prêt'
    default:
      return 'Inconnu'
  }
}

const getOpponentStatusClass = (): string => {
  switch (props.data.opponentType) {
    case 'existing':
    case 'guest':
      return 'confirmed'
    case 'invite':
      return 'pending'
    default:
      return 'unknown'
  }
}

const getOpponentStatusIcon = (): string => {
  switch (props.data.opponentType) {
    case 'existing':
    case 'guest':
      return '✅'
    case 'invite':
      return '📧'
    default:
      return '❓'
  }
}

// Méthodes pour les rounds
const hasPreConfiguredScores = (): boolean => {
  return (
    props.data.rounds &&
    props.data.rounds.length > 0 &&
    props.data.rounds.some((r) => (r.playerScore || 0) + (r.opponentScore || 0) > 0)
  )
}

const getPreConfiguredRounds = () => {
  return props.data.rounds?.filter((r) => (r.playerScore || 0) + (r.opponentScore || 0) > 0) || []
}

// Autres méthodes
const getPermissionsText = (): string => {
  switch (props.data.opponentType) {
    case 'existing':
      return 'Vous et votre ami pourrez modifier les scores et gérer la partie'
    case 'invite':
      return "Une fois l'invitation acceptée, les deux joueurs pourront gérer la partie"
    case 'guest':
      return 'Vous seul pourrez modifier les scores et gérer la partie'
    default:
      return 'Permissions par défaut'
  }
}

const handleCreateGame = () => {
  emit('create-game')
}
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

/* Sections du récapitulatif */
.summary-section {
  margin-bottom: 2rem;
}

.section-card {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.section-card:hover {
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #ffd700;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.edit-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.edit-btn:hover {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
  color: #ffd700;
}

/* Configuration du jeu */
.config-details {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border-left: 3px solid #dc143c;
}

.detail-label {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.detail-value {
  color: #ffffff;
  font-weight: bold;
}

.detail-value.primary {
  color: #ffd700;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

/* Résumé des joueurs */
.players-summary {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2rem;
  align-items: center;
}

.player-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border-left: 4px solid transparent;
}

.player-summary.current-user {
  border-left-color: #228b22;
  background: linear-gradient(135deg, rgba(34, 139, 34, 0.1), rgba(255, 255, 255, 0.05));
}

.player-summary.opponent {
  border-left-color: #dc143c;
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.1), rgba(255, 255, 255, 0.05));
}

.player-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.player-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #228b22, #32cd32);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.player-avatar.opponent-avatar {
  background: linear-gradient(135deg, #dc143c, #8b0000);
}

.avatar-text {
  font-size: 1.5rem;
}

.player-details {
  flex: 1;
}

.player-name {
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0 0 0.25rem 0;
}

.player-role {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.player-army {
  color: #ffd700;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.player-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.confirmed {
  background: rgba(34, 139, 34, 0.2);
  border: 1px solid #228b22;
  color: #32cd32;
}

.status-badge.pending {
  background: rgba(255, 165, 0, 0.2);
  border: 1px solid #ffa500;
  color: #ffd700;
}

/* VS Container */
.vs-container {
  text-align: center;
}

.vs-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  animation: pulse-battle 2s infinite;
}

.vs-text {
  color: #dc143c;
  font-weight: bold;
  font-size: 1.2rem;
  text-shadow: 0 0 10px rgba(220, 20, 60, 0.5);
  letter-spacing: 2px;
}

@keyframes pulse-battle {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Boîtes d'information */
.info-box,
.invite-info,
.guest-info {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.invite-info .info-box {
  background: rgba(70, 130, 180, 0.1);
  border-left: 4px solid #4682b4;
}

.guest-info .info-box {
  background: rgba(255, 165, 0, 0.1);
  border-left: 4px solid #ffa500;
}

.info-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.info-content p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

/* Résumé des rounds */
.rounds-summary {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
}

.rounds-info {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

.info-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.info-text {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

/* Prévisualisation des rounds */
.rounds-preview h4 {
  color: #ffd700;
  margin: 0 0 1rem 0;
}

.preview-rounds {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.preview-round {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid #ffd700;
  border-radius: 6px;
}

.round-label {
  color: #ffd700;
  font-weight: bold;
  font-size: 0.9rem;
}

.round-scores {
  color: #ffffff;
  font-weight: bold;
}

/* Informations importantes */
.important-list {
  display: grid;
  gap: 1rem;
}

.important-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.item-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.item-content h4 {
  color: #ffd700;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.item-content p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.4;
}

/* Actions finales */
.final-actions {
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.1), rgba(255, 215, 0, 0.1));
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.action-info h3 {
  color: #ffffff;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.action-info p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 2rem 0;
}

.create-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.option-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.option-card:hover {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
}

.option-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.option-content h4 {
  color: #ffffff;
  margin: 0 0 0.5rem 0;
}

.option-content p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 0.9rem;
}

/* Navigation */
.step-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-previous,
.btn-create {
  padding: 1rem 2rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 200px;
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

.btn-create {
  background: linear-gradient(135deg, #228b22, #32cd32);
  border: 2px solid #ffd700;
  color: white;
  font-size: 1.2rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.btn-create:hover:not(:disabled) {
  background: linear-gradient(135deg, #32cd32, #228b22);
  box-shadow:
    0 0 25px rgba(34, 139, 34, 0.5),
    0 0 40px rgba(255, 215, 0, 0.3);
  transform: translateY(-2px);
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-create.loading {
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

/* Responsive */
@media (max-width: 768px) {
  .step-container {
    padding: 1.5rem;
  }

  .step-title {
    font-size: 2rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .players-summary {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .vs-container {
    order: -1;
  }

  .create-options {
    grid-template-columns: 1fr;
  }

  .step-navigation {
    flex-direction: column-reverse;
    gap: 1rem;
  }

  .btn-previous,
  .btn-create {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .player-summary {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .player-info {
    flex-direction: column;
    text-align: center;
  }

  .important-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>
