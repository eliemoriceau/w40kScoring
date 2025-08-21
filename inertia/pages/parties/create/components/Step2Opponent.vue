<template>
  <div class="step-container step-2">
    <!-- En-tête de l'étape -->
    <div class="step-header">
      <h2 class="step-title">⚡ Sélection de l'Adversaire</h2>
      <p class="step-subtitle">Choisissez votre adversaire pour cette bataille épique</p>
    </div>

    <!-- Contenu principal -->
    <div class="step-content">
      <!-- Type d'adversaire -->
      <div class="config-section">
        <h3 class="section-title">Type d'Adversaire</h3>
        <p class="section-description">
          Sélectionnez comment vous souhaitez ajouter votre adversaire
        </p>

        <div class="opponent-type-grid">
          <div
            v-for="opponentType in opponentTypes"
            :key="opponentType.value"
            class="opponent-type-card"
            :class="{ selected: data.opponentType === opponentType.value }"
            @click="selectOpponentType(opponentType.value)"
          >
            <div class="opponent-type-icon">
              {{ getOpponentTypeIcon(opponentType.value) }}
            </div>
            <div class="opponent-type-info">
              <h4 class="opponent-type-name">{{ opponentType.displayName }}</h4>
              <p class="opponent-type-desc">{{ getOpponentTypeDescription(opponentType.value) }}</p>
            </div>
            <div class="selection-indicator">
              <span v-if="data.opponentType === opponentType.value" class="selected-check">✓</span>
            </div>
          </div>
        </div>

        <div v-if="errors?.opponentType" class="error-message">
          {{ errors.opponentType[0] }}
        </div>
      </div>

      <!-- Configuration selon le type sélectionné -->
      <div v-if="data.opponentType" class="config-section">
        <!-- Adversaire existant -->
        <div v-if="data.opponentType === 'existing'" class="opponent-existing">
          <h3 class="section-title">Rechercher un Utilisateur</h3>
          <p class="section-description">Recherchez et sélectionnez un utilisateur existant</p>

          <!-- Barre de recherche -->
          <div class="search-container">
            <div class="search-input-wrapper">
              <input
                v-model="searchQuery"
                type="text"
                class="search-input"
                placeholder="Rechercher par nom, pseudo ou email..."
                @input="performSearch"
                :disabled="loading"
              />
              <div class="search-icon">
                <span v-if="!isSearching">🔍</span>
                <span v-else class="spinner">⏳</span>
              </div>
            </div>
            <div
              v-if="searchQuery && searchResults.length === 0 && !isSearching"
              class="search-hint"
            >
              Aucun utilisateur trouvé pour "{{ searchQuery }}"
            </div>
          </div>

          <!-- Résultats de recherche -->
          <div v-if="searchResults.length > 0" class="search-results">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="user-result"
              :class="{ selected: data.opponentId === user.id }"
              @click="selectSearchedUser(user)"
            >
              <div class="user-avatar">
                <img v-if="user.avatar" :src="user.avatar" :alt="user.pseudo" class="avatar-img" />
                <span v-else class="avatar-placeholder">
                  {{ user.pseudo.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="user-info">
                <h4 class="user-name">{{ user.pseudo }}</h4>
                <p class="user-email">{{ user.email }}</p>
              </div>
              <div class="selection-indicator">
                <span v-if="data.opponentId === user.id" class="selected-check">✓</span>
              </div>
            </div>
          </div>

          <!-- Message par défaut -->
          <div v-if="!searchQuery" class="search-prompt">
            <div class="search-prompt-icon">🔍</div>
            <h4>Rechercher un adversaire</h4>
            <p>Tapez le nom, pseudo ou email de votre adversaire pour le trouver.</p>
          </div>
        </div>

        <!-- Inviter par email -->
        <div v-if="data.opponentType === 'invite'" class="opponent-invite">
          <h3 class="section-title">Inviter par Email</h3>
          <p class="section-description">
            L'adversaire recevra une invitation par email pour rejoindre la partie
          </p>

          <div class="invite-form">
            <div class="form-group">
              <label class="input-label">Adresse email :</label>
              <input
                v-model="data.opponentEmail"
                type="email"
                class="email-input"
                placeholder="adversaire@example.com"
                @blur="validateEmail"
                :class="{ error: errors?.opponentEmail }"
              />
              <div v-if="errors?.opponentEmail" class="error-message">
                {{ errors.opponentEmail[0] }}
              </div>
            </div>

            <div class="form-group">
              <label class="input-label">Pseudo (optionnel) :</label>
              <input
                v-model="data.opponentPseudo"
                type="text"
                class="pseudo-input"
                placeholder="Nom de votre adversaire"
                maxlength="50"
              />
              <div class="input-hint">Si laissé vide, l'adversaire pourra choisir son pseudo</div>
            </div>
          </div>
        </div>

        <!-- Adversaire invité (sans compte) -->
        <div v-if="data.opponentType === 'guest'" class="opponent-guest">
          <h3 class="section-title">Adversaire Invité</h3>
          <p class="section-description">
            Créez une partie avec un adversaire sans compte utilisateur
          </p>

          <div class="guest-form">
            <div class="form-group">
              <label class="input-label">Pseudo de l'adversaire :</label>
              <input
                v-model="data.opponentPseudo"
                type="text"
                class="pseudo-input"
                placeholder="Nom de votre adversaire"
                maxlength="50"
                @input="validateGuestPseudo"
                :class="{ error: errors?.opponentPseudo }"
              />
              <div v-if="errors?.opponentPseudo" class="error-message">
                {{ errors.opponentPseudo[0] }}
              </div>
              <div class="input-hint">Ce nom sera affiché dans les résultats de la partie</div>
            </div>

            <div class="guest-info-box">
              <div class="info-icon">💡</div>
              <div class="info-content">
                <h4>Mode Invité</h4>
                <p>L'adversaire invité ne pourra pas :</p>
                <ul>
                  <li>Se connecter à son compte</li>
                  <li>Voir l'historique des parties</li>
                  <li>Modifier les scores pendant la partie</li>
                </ul>
                <p>Seul vous pourrez gérer cette partie.</p>
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
import { ref, computed } from 'vue'
import axios from 'axios'
import type { GameCreationWizardData, OpponentType, User } from '../types/wizard'

interface Props {
  data: GameCreationWizardData
  userFriends: User[]
  currentUser: { id: number; pseudo: string; email: string }
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

// État pour la recherche d'utilisateurs
const searchQuery = ref('')
const searchResults = ref<User[]>([])
const isSearching = ref(false)
let searchTimeout: NodeJS.Timeout | null = null

// Types d'adversaires disponibles
const opponentTypes = [
  { value: 'existing' as OpponentType, displayName: 'Utilisateur Existant' },
  { value: 'invite' as OpponentType, displayName: 'Inviter par Email' },
  { value: 'guest' as OpponentType, displayName: 'Adversaire Invité' },
]

// Computed
const isValid = computed(() => {
  if (!props.data.opponentType) return false

  switch (props.data.opponentType) {
    case 'existing':
      return !!props.data.opponentId
    case 'invite':
      return !!(props.data.opponentEmail && isValidEmail(props.data.opponentEmail))
    case 'guest':
      return !!(props.data.opponentPseudo && props.data.opponentPseudo.trim().length >= 2)
    default:
      return false
  }
})

// Méthodes
const selectOpponentType = (type: OpponentType) => {
  // Réinitialiser les données selon le type
  const updates: Partial<GameCreationWizardData> = { opponentType: type }

  if (type === 'existing') {
    updates.opponentEmail = undefined
    updates.opponentPseudo = undefined
  } else if (type === 'invite') {
    updates.opponentId = undefined
  } else if (type === 'guest') {
    updates.opponentId = undefined
    updates.opponentEmail = undefined
  }

  emit('update:data', updates)
  emit('validate')
}

const selectExistingOpponent = (friend: User) => {
  emit('update:data', {
    opponentId: friend.id,
    opponentPseudo: friend.pseudo,
  })
  emit('validate')
}

// Fonctions de recherche d'utilisateurs
const performSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(async () => {
    if (searchQuery.value.trim().length < 2) {
      searchResults.value = []
      return
    }

    isSearching.value = true

    try {
      const response = await axios.get('/api/users/search', {
        params: {
          q: searchQuery.value.trim(),
          limit: 10,
        },
      })

      searchResults.value = response.data.users || []
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300) // Debounce de 300ms
}

const selectSearchedUser = (user: User) => {
  emit('update:data', {
    opponentId: user.id,
    opponentPseudo: user.pseudo,
    opponentEmail: user.email,
  })
  emit('validate')
}

const validateEmail = () => {
  emit('validate')
}

const validateGuestPseudo = () => {
  emit('validate')
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const getOpponentTypeIcon = (type: OpponentType): string => {
  const icons = {
    existing: '👥',
    invite: '✉️',
    guest: '👤',
  }
  return icons[type] || '⚔️'
}

const getOpponentTypeDescription = (type: OpponentType): string => {
  const descriptions = {
    existing: 'Recherchez et sélectionnez un utilisateur déjà inscrit',
    invite: 'Envoyez une invitation par email à votre adversaire',
    guest: 'Créez une partie avec un adversaire sans compte',
  }
  return descriptions[type] || ''
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

/* Types d'adversaires */
.opponent-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.opponent-type-card {
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

.opponent-type-card:hover {
  border-color: #dc143c;
  background: rgba(220, 20, 60, 0.1);
  transform: translateY(-2px);
}

.opponent-type-card.selected {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.opponent-type-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.opponent-type-info {
  flex: 1;
}

.opponent-type-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
}

.opponent-type-desc {
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

/* Recherche d'utilisateurs */
.search-container {
  margin-bottom: 2rem;
}

.search-input-wrapper {
  position: relative;
  margin-bottom: 0.5rem;
}

.search-input {
  width: 100%;
  padding: 1rem 3rem 1rem 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.search-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
}

.spinner {
  animation: spin 1s linear infinite;
}

.search-hint {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

/* Résultats de recherche */
.search-results {
  display: grid;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.user-result {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-result:hover {
  border-color: #dc143c;
  background: rgba(220, 20, 60, 0.1);
  transform: translateY(-1px);
}

.user-result.selected {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #dc143c, #8b0000);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: bold;
  color: white;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.3rem 0;
}

.user-email {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

/* Message de recherche */
.search-prompt {
  text-align: center;
  padding: 3rem 2rem;
  color: rgba(255, 255, 255, 0.7);
}

.search-prompt-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.search-prompt h4 {
  color: #ffffff;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.search-prompt p {
  margin: 0;
  line-height: 1.4;
}

/* Formulaires */
.invite-form,
.guest-form {
  background: rgba(0, 0, 0, 0.3);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.form-group {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  color: #ffd700;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.email-input,
.pseudo-input {
  width: 100%;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.email-input:focus,
.pseudo-input:focus {
  outline: none;
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.email-input.error,
.pseudo-input.error {
  border-color: #ff6b6b;
}

.input-hint {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
}

/* Boîte d'information */
.guest-info-box {
  background: rgba(255, 165, 0, 0.1);
  border-left: 4px solid #ffa500;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.info-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.info-content h4 {
  color: #ffa500;
  margin: 0 0 0.5rem 0;
}

.info-content p {
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.info-content ul {
  color: rgba(255, 255, 255, 0.8);
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.info-content li {
  margin-bottom: 0.25rem;
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

  .opponent-type-grid,
  .friends-grid {
    grid-template-columns: 1fr;
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
  .friend-card {
    padding: 1rem;
  }

  .friend-avatar {
    width: 40px;
    height: 40px;
  }

  .avatar-placeholder {
    font-size: 1rem;
  }
}
</style>
