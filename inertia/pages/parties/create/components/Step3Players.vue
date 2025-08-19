<template>
  <div class="step-container step-3">
    <!-- En-tête de l'étape -->
    <div class="step-header">
      <h2 class="step-title">👥 Configuration des Joueurs</h2>
      <p class="step-subtitle">Configurez les détails des joueurs pour cette bataille</p>
    </div>

    <!-- Contenu principal -->
    <div class="step-content">
      <!-- Liste des joueurs -->
      <div class="config-section">
        <h3 class="section-title">Joueurs de la Partie</h3>
        <p class="section-description">Vérifiez et complétez les informations des joueurs</p>

        <div class="players-list">
          <!-- Joueur principal (utilisateur actuel) -->
          <div class="player-card current-user">
            <div class="player-header">
              <div class="player-icon">⚔️</div>
              <div class="player-info">
                <h4 class="player-name">{{ props.currentUser.pseudo }}</h4>
                <span class="player-role">Vous (Organisateur)</span>
              </div>
              <div class="player-status">
                <span class="status-badge confirmed">Confirmé</span>
              </div>
            </div>

            <!-- Configuration de l'armée -->
            <div class="player-army-config">
              <div class="form-group">
                <label class="input-label">Votre Armée :</label>
                <input
                  v-model="currentPlayerArmy"
                  type="text"
                  class="army-input"
                  placeholder="ex: Space Marines, Aeldari, Chaos..."
                  maxlength="100"
                  @input="updateCurrentPlayerArmy"
                />
                <div class="input-hint">Saisissez le nom de votre armée (optionnel)</div>
              </div>
            </div>
          </div>

          <!-- Adversaire -->
          <div class="player-card opponent">
            <div class="player-header">
              <div class="player-icon">{{ getOpponentIcon() }}</div>
              <div class="player-info">
                <h4 class="player-name">{{ getOpponentName() }}</h4>
                <span class="player-role">{{ getOpponentRole() }}</span>
              </div>
              <div class="player-status">
                <span class="status-badge" :class="getOpponentStatusClass()">
                  {{ getOpponentStatus() }}
                </span>
              </div>
            </div>

            <!-- Configuration de l'armée adversaire -->
            <div class="player-army-config">
              <div class="form-group">
                <label class="input-label">Armée Adversaire :</label>
                <input
                  v-model="opponentArmy"
                  type="text"
                  class="army-input"
                  placeholder="ex: Orks, Necrons, Imperial Guard..."
                  maxlength="100"
                  @input="updateOpponentArmy"
                  :disabled="data.opponentType === 'invite' && !isOpponentConfirmed"
                />
                <div class="input-hint">
                  {{ getOpponentArmyHint() }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Informations sur les points -->
      <div class="config-section">
        <div class="points-summary">
          <div class="points-info">
            <h3 class="section-title">Récapitulatif des Points</h3>
            <div class="points-details">
              <div class="point-item">
                <span class="point-label">Limite de Points :</span>
                <span class="point-value">{{ data.pointsLimit }} pts</span>
              </div>
              <div class="point-item">
                <span class="point-label">Type de Jeu :</span>
                <span class="point-value">{{ getGameTypeDisplay(data.gameType) }}</span>
              </div>
              <div v-if="data.mission" class="point-item">
                <span class="point-label">Mission :</span>
                <span class="point-value">{{ data.mission }}</span>
              </div>
            </div>
          </div>

          <div class="battle-preview">
            <div class="preview-icon">⚔️</div>
            <div class="versus-text">VS</div>
            <div class="preview-icon">🛡️</div>
          </div>
        </div>
      </div>

      <!-- Règles et informations -->
      <div class="config-section">
        <div class="rules-info">
          <h3 class="section-title">Informations Importantes</h3>
          <div class="rules-list">
            <div class="rule-item">
              <div class="rule-icon">📋</div>
              <div class="rule-content">
                <h4>Gestion des Scores</h4>
                <p>{{ getScoreManagementText() }}</p>
              </div>
            </div>
            <div class="rule-item">
              <div class="rule-icon">🎯</div>
              <div class="rule-content">
                <h4>Objectifs de Mission</h4>
                <p>
                  Les scores seront organisés par rounds avec objectifs primaires et secondaires
                </p>
              </div>
            </div>
            <div class="rule-item">
              <div class="rule-icon">⏱️</div>
              <div class="rule-content">
                <h4>Durée de Partie</h4>
                <p>5 rounds maximum, durée estimée : {{ getEstimatedDuration() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions spéciales selon le type d'adversaire -->
      <div v-if="data.opponentType === 'invite'" class="config-section">
        <div class="invite-actions">
          <h3 class="section-title">Actions d'Invitation</h3>
          <div class="action-buttons">
            <button class="btn-action secondary" @click="resendInvitation">
              <span class="btn-icon">📧</span>
              Renvoyer l'Invitation
            </button>
            <button class="btn-action secondary" @click="copyInviteLink">
              <span class="btn-icon">🔗</span>
              Copier le Lien
            </button>
          </div>
          <div class="invite-status">
            <div class="status-icon">📬</div>
            <div class="status-text">
              L'invitation a été envoyée à <strong>{{ data.opponentEmail }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="step-navigation">
      <button @click="$emit('previous')" class="btn-previous">⮜ Précédent</button>

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

// État local
const currentPlayerArmy = ref('')
const opponentArmy = ref('')
const isOpponentConfirmed = ref(false)

// Computed
const isValid = computed(() => {
  // Validation de base : au moins 2 joueurs configurés
  return props.data.players && props.data.players.length >= 2
})

// Méthodes pour l'adversaire
const getOpponentName = (): string => {
  if (props.data.opponentType === 'existing' && props.data.opponentId) {
    const friend = props.props.userFriends.find((f) => f.id === props.data.opponentId)
    return friend?.pseudo || 'Adversaire'
  }
  return props.data.opponentPseudo || props.data.opponentEmail || 'Adversaire'
}

const getOpponentIcon = (): string => {
  const icons = {
    existing: '👤',
    invite: '✉️',
    guest: '🤖',
  }
  return icons[props.data.opponentType] || '👤'
}

const getOpponentRole = (): string => {
  const roles = {
    existing: 'Ami',
    invite: 'Invité par Email',
    guest: 'Joueur Invité',
  }
  return roles[props.data.opponentType] || 'Adversaire'
}

const getOpponentStatus = (): string => {
  if (props.data.opponentType === 'existing') return 'Confirmé'
  if (props.data.opponentType === 'invite')
    return isOpponentConfirmed.value ? 'Confirmé' : 'En Attente'
  return 'Prêt'
}

const getOpponentStatusClass = (): string => {
  if (props.data.opponentType === 'existing' || props.data.opponentType === 'guest')
    return 'confirmed'
  return isOpponentConfirmed.value ? 'confirmed' : 'pending'
}

const getOpponentArmyHint = (): string => {
  if (props.data.opponentType === 'invite' && !isOpponentConfirmed.value) {
    return "L'adversaire pourra définir son armée après avoir accepté l'invitation"
  }
  return "Saisissez le nom de l'armée adversaire (optionnel)"
}

const getScoreManagementText = (): string => {
  if (props.data.opponentType === 'guest') {
    return 'Vous gérerez tous les scores de la partie (vous et votre adversaire invité)'
  }
  if (props.data.opponentType === 'invite') {
    return "Les deux joueurs pourront saisir et modifier les scores une fois l'invitation acceptée"
  }
  return 'Les deux joueurs pourront saisir et modifier les scores pendant la partie'
}

// Autres méthodes
const getGameTypeDisplay = (gameType: GameType): string => {
  const displays = {
    MATCHED_PLAY: 'Jeu Équilibré',
    NARRATIVE: 'Jeu Narratif',
    OPEN_PLAY: 'Jeu Libre',
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

// Gestion des mises à jour
const updateCurrentPlayerArmy = () => {
  updatePlayerArmy(props.props.currentUser.id, currentPlayerArmy.value)
}

const updateOpponentArmy = () => {
  if (props.data.opponentId) {
    updatePlayerArmy(props.data.opponentId, opponentArmy.value)
  } else {
    // Pour les invités, on met à jour directement le pseudo/army
    const opponentPlayer = props.data.players.find((p) => !p.isCurrentUser)
    if (opponentPlayer) {
      opponentPlayer.army = opponentArmy.value
      emit('update:data', { players: [...props.data.players] })
    }
  }
}

const updatePlayerArmy = (playerId: number, army: string) => {
  const updatedPlayers = props.data.players.map((player) => {
    if (player.userId === playerId) {
      return { ...player, army }
    }
    return player
  })

  emit('update:data', { players: updatedPlayers })
  emit('validate')
}

// Actions spéciales
const resendInvitation = () => {
  // Logique pour renvoyer l'invitation
  console.log("Renvoi de l'invitation à", props.data.opponentEmail)
}

const copyInviteLink = () => {
  // Logique pour copier le lien d'invitation
  const link = `${window.location.origin}/parties/join/${props.data.opponentId}`
  navigator.clipboard.writeText(link)
  // TODO: Afficher une notification de succès
}

// Lifecycle
onMounted(() => {
  // Initialiser les joueurs si ce n'est pas déjà fait
  if (!props.data.players || props.data.players.length === 0) {
    const players = [
      {
        pseudo: props.props.currentUser.pseudo,
        army: '',
        userId: props.props.currentUser.id,
        isCurrentUser: true,
      },
      {
        pseudo: getOpponentName(),
        army: '',
        userId: props.data.opponentId,
        isCurrentUser: false,
      },
    ]

    emit('update:data', { players })
  }

  // Initialiser les valeurs des armées
  const currentPlayer = props.data.players?.find((p) => p.isCurrentUser)
  const opponent = props.data.players?.find((p) => !p.isCurrentUser)

  if (currentPlayer?.army) currentPlayerArmy.value = currentPlayer.army
  if (opponent?.army) opponentArmy.value = opponent.army

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

/* Liste des joueurs */
.players-list {
  display: grid;
  gap: 1.5rem;
}

.player-card {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.player-card.current-user {
  border-color: #228b22;
  background: rgba(34, 139, 34, 0.1);
  box-shadow: 0 0 15px rgba(34, 139, 34, 0.2);
}

.player-card.opponent {
  border-color: #dc143c;
  background: rgba(220, 20, 60, 0.1);
  box-shadow: 0 0 15px rgba(220, 20, 60, 0.2);
}

.player-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.player-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.player-info {
  flex: 1;
}

.player-name {
  font-size: 1.3rem;
  font-weight: bold;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
}

.player-role {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
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

/* Configuration des armées */
.player-army-config {
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.input-label {
  display: block;
  color: #ffd700;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.army-input {
  width: 100%;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.army-input:focus {
  outline: none;
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.army-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-hint {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
}

/* Récapitulatif des points */
.points-summary {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 215, 0, 0.3);
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  align-items: center;
}

.points-details {
  display: grid;
  gap: 0.75rem;
}

.point-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.point-label {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.point-value {
  color: #ffd700;
  font-weight: bold;
}

.battle-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 2rem;
}

.preview-icon {
  animation: bounce 2s infinite;
}

.versus-text {
  color: #dc143c;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(220, 20, 60, 0.5);
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-5px);
  }
  60% {
    transform: translateY(-3px);
  }
}

/* Informations et règles */
.rules-info {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.rules-list {
  display: grid;
  gap: 1rem;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.rule-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.rule-content h4 {
  color: #ffd700;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.rule-content p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.4;
}

/* Actions d'invitation */
.invite-actions {
  background: rgba(70, 130, 180, 0.1);
  border-left: 4px solid #4682b4;
  border-radius: 8px;
  padding: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.btn-action {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.btn-action.secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

.btn-action.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #4682b4;
}

.btn-icon {
  font-size: 1rem;
}

.invite-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.status-icon {
  font-size: 1.5rem;
}

.status-text {
  color: rgba(255, 255, 255, 0.9);
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

.btn-previous,
.btn-next {
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

  .points-summary {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-action {
    justify-content: center;
  }

  .step-navigation {
    flex-direction: column-reverse;
    gap: 1rem;
  }

  .btn-previous,
  .btn-next {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .player-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .player-status {
    align-self: flex-end;
  }

  .rules-list {
    gap: 0.5rem;
  }

  .rule-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>
