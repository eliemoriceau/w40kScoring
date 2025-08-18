# 🎯 Spécifications Techniques - Wizard de Création de Game W40K

## Vue d'ensemble

Wizard multi-étapes pour la création complète d'une partie Warhammer 40K avec thème visuel immersif et flux de données optimisé.

## Architecture Technique

### Composants Principaux

#### 1. Page Principale (`/parties/create/index.vue`)
```vue
<template>
  <div class="w40k-wizard-container">
    <StepIndicator :current-step="currentStep" :total-steps="5" />
    
    <div class="wizard-content">
      <KeepAlive>
        <component 
          :is="currentStepComponent" 
          v-model:data="wizardData"
          @next="handleNext"
          @previous="handlePrevious"
          @complete="handleComplete"
        />
      </KeepAlive>
    </div>
    
    <GameCreationProgress 
      :progress="completionProgress" 
      :estimated-time="estimatedGameTime"
    />
  </div>
</template>
```

#### 2. État Global du Wizard (`composables/useGameWizard.ts`)
```typescript
interface WizardState {
  currentStep: WizardStep
  data: GameCreationData
  validation: StepValidation
  errors: WizardErrors
  loading: boolean
}

export const useGameWizard = () => {
  // État réactif persisté en session
  const wizardState = ref<WizardState>(getInitialState())
  
  // Navigation entre étapes
  const goToNextStep = () => { /* ... */ }
  const goToPreviousStep = () => { /* ... */ }
  
  // Validation et sauvegarde
  const validateCurrentStep = () => { /* ... */ }
  const saveProgress = () => { /* ... */ }
  
  // Soumission finale
  const submitGameCreation = async () => { /* ... */ }
  
  return {
    wizardState: readonly(wizardState),
    goToNextStep,
    goToPreviousStep,
    validateCurrentStep,
    saveProgress,
    submitGameCreation
  }
}
```

### Composants d'Étapes

#### Étape 1: Configuration de Base
```vue
<!-- Step1GameConfig.vue -->
<template>
  <div class="step-container step-1">
    <WizardHeader 
      title="⚔️ Configuration de la Bataille"
      subtitle="Définissez les paramètres de base"
    />
    
    <div class="config-section">
      <GameTypeSelector 
        v-model="data.gameType"
        :types="gameTypes"
        @change="updateGameType"
      />
      
      <PointsLimitInput
        v-model="data.pointsLimit"
        :presets="[1000, 1500, 2000]"
        :min="500"
        :max="5000"
      />
      
      <MissionSelector
        v-model="data.mission"
        :missions="availableMissions"
        :optional="true"
      />
    </div>
    
    <StepNavigation 
      :can-continue="isStep1Valid"
      @next="$emit('next')"
    />
  </div>
</template>
```

#### Étape 2: Sélection Adversaire
```vue
<!-- Step2Opponent.vue -->
<template>
  <div class="step-container step-2">
    <WizardHeader 
      title="👥 Sélection de l'Adversaire"
      subtitle="Choisissez votre opposant"
    />
    
    <div class="opponent-options">
      <!-- Option 1: Utilisateur existant -->
      <OpponentOption 
        value="existing"
        v-model="opponentType"
        title="Utilisateur Existant"
        icon="🎯"
      >
        <UserSearchInput
          v-if="opponentType === 'existing'"
          v-model="selectedUser"
          :loading="searchLoading"
          @search="handleUserSearch"
        />
      </OpponentOption>
      
      <!-- Option 2: Invitation -->
      <OpponentOption 
        value="invite"
        v-model="opponentType"
        title="Inviter Quelqu'un"
        icon="📧"
      >
        <InvitationForm
          v-if="opponentType === 'invite'"
          v-model:email="inviteEmail"
          @send="handleSendInvitation"
        />
      </OpponentOption>
      
      <!-- Option 3: Invité anonyme -->
      <OpponentOption 
        value="guest"
        v-model="opponentType"
        title="Invité Anonyme"
        icon="👤"
      >
        <GuestInput
          v-if="opponentType === 'guest'"
          v-model="guestPseudo"
          placeholder="Pseudo de l'adversaire"
        />
      </OpponentOption>
    </div>
    
    <StepNavigation 
      :can-continue="isStep2Valid"
      @previous="$emit('previous')"
      @next="$emit('next')"
    />
  </div>
</template>
```

#### Étape 3: Configuration Joueurs
```vue
<!-- Step3Players.vue -->
<template>
  <div class="step-container step-3">
    <WizardHeader 
      title="🏛️ Configuration des Joueurs"
      subtitle="Définissez les armées et pseudos"
    />
    
    <div class="players-config">
      <PlayerConfigCard
        v-for="(player, index) in players"
        :key="`player-${index}`"
        :player="player"
        :index="index"
        :is-current-user="index === 0"
        @update="updatePlayer"
      />
    </div>
    
    <ArmyPresets 
      @apply-preset="applyArmyPreset"
      :presets="popularArmyMatchups"
    />
    
    <StepNavigation 
      :can-continue="isStep3Valid"
      @previous="$emit('previous')"
      @next="$emit('next')"
    />
  </div>
</template>
```

#### Étape 4: Rounds Prédéfinis
```vue
<!-- Step4Rounds.vue -->
<template>
  <div class="step-container step-4">
    <WizardHeader 
      title="⚡ Configuration des Rounds"
      subtitle="Pré-configurez les rounds (optionnel)"
    />
    
    <div class="rounds-toggle">
      <ToggleSwitch
        v-model="enableRounds"
        label="Pré-créer les rounds"
        description="Recommandé pour un suivi complet de la bataille"
      />
    </div>
    
    <div v-if="enableRounds" class="rounds-config">
      <RoundConfigCard
        v-for="round in rounds"
        :key="round.number"
        :round="round"
        :players="players"
        @update="updateRound"
      />
      
      <div class="rounds-actions">
        <button @click="addRound" class="btn-add-round">
          ➕ Ajouter Round
        </button>
        <button @click="generateRandomScores" class="btn-random">
          🎲 Scores Aléatoires
        </button>
      </div>
    </div>
    
    <StepNavigation 
      :can-continue="isStep4Valid"
      @previous="$emit('previous')"
      @next="$emit('next')"
    />
  </div>
</template>
```

#### Étape 5: Récapitulatif
```vue
<!-- Step5Summary.vue -->
<template>
  <div class="step-container step-5">
    <WizardHeader 
      title="✅ Récapitulatif de la Bataille"
      subtitle="Vérifiez et validez votre configuration"
    />
    
    <div class="summary-sections">
      <SummarySection title="🎮 Configuration de Base">
        <SummaryItem label="Type" :value="gameTypeDisplay" />
        <SummaryItem label="Points" :value="`${pointsLimit} pts`" />
        <SummaryItem label="Mission" :value="mission || 'Aléatoire'" />
        <SummaryItem label="Durée estimée" :value="estimatedDuration" />
      </SummarySection>
      
      <SummarySection title="👥 Joueurs">
        <PlayerSummaryCard
          v-for="player in players"
          :key="player.id"
          :player="player"
        />
      </SummarySection>
      
      <SummarySection v-if="hasRounds" title="⚡ Rounds">
        <div class="rounds-summary">
          {{ rounds.length }} rounds pré-configurés
          <RoundsSummaryChart :rounds="rounds" />
        </div>
      </SummarySection>
    </div>
    
    <div class="creation-warning">
      <WarningBox>
        ⚠️ Une fois créée, la partie ne pourra plus être supprimée 
        (seulement annulée). Vérifiez votre configuration.
      </WarningBox>
    </div>
    
    <StepNavigation 
      :can-continue="true"
      :loading="creationLoading"
      next-label="🚀 CRÉER LA BATAILLE"
      @previous="$emit('previous')"
      @next="$emit('complete')"
    />
  </div>
</template>
```

## Flux de Données

### 1. Route Controller
```typescript
// app/controllers/parties_controller.ts
export default class PartiesController {
  async create({ inertia, auth }: HttpContext) {
    const user = auth.user!
    
    // Charger les données nécessaires pour le wizard
    const [availableMissions, gameTypes, userFriends] = await Promise.all([
      Mission.all(),
      GameType.getAllTypes(),
      this.getUserFriends(user.id)
    ])
    
    return inertia.render('parties/create/index', {
      availableMissions: availableMissions.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description
      })),
      gameTypes: gameTypes.map(gt => ({
        value: gt.value,
        displayName: gt.displayName
      })),
      userFriends: userFriends.map(f => ({
        id: f.id,
        pseudo: f.pseudo,
        avatar: f.avatar
      })),
      currentUser: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email
      }
    })
  }
  
  async store({ request, response, auth, partieCompleteService }: HttpContext) {
    const user = auth.user!
    const wizardData = await request.validateUsing(gameCreationValidator)
    
    try {
      // Utiliser le service d'orchestration existant
      const result = await partieCompleteService.createPartieComplete({
        userId: user.id,
        requestingUserId: user.id,
        gameType: wizardData.gameType,
        pointsLimit: wizardData.pointsLimit,
        mission: wizardData.mission,
        opponentId: wizardData.opponentId,
        players: wizardData.players,
        rounds: wizardData.rounds
      })
      
      // Notification de succès
      session.flash('notification', {
        type: 'success',
        title: 'Bataille créée !',
        message: `La partie ${result.partieId} a été créée avec succès.`,
        duration: 5000
      })
      
      // Redirection vers la page de détail
      return response.redirect().toPath(`/parties/${result.partieId}`)
      
    } catch (error) {
      session.flash('notification', {
        type: 'error',
        title: 'Erreur de création',
        message: error.message || 'Impossible de créer la partie.',
        duration: 8000
      })
      
      return response.redirect().back()
    }
  }
}
```

### 2. Validation des Données
```typescript
// app/validators/game_creation_validator.ts
export const gameCreationValidator = vine.compile(
  vine.object({
    // Étape 1
    gameType: vine.enum(['MATCHED_PLAY', 'NARRATIVE', 'OPEN_PLAY']),
    pointsLimit: vine.number().min(500).max(5000).multipleOf(50),
    mission: vine.string().optional(),
    
    // Étape 2
    opponentType: vine.enum(['existing', 'invite', 'guest']),
    opponentId: vine.number().optional().requiredWhen('opponentType', '=', 'existing'),
    opponentEmail: vine.string().email().optional().requiredWhen('opponentType', '=', 'invite'),
    opponentPseudo: vine.string().optional().requiredWhen('opponentType', '=', 'guest'),
    
    // Étape 3
    players: vine.array(
      vine.object({
        pseudo: vine.string().minLength(3).maxLength(20),
        army: vine.string().optional(),
        userId: vine.number().optional()
      })
    ).minLength(2).maxLength(2),
    
    // Étape 4
    rounds: vine.array(
      vine.object({
        roundNumber: vine.number().min(1).max(5),
        playerScore: vine.number().min(0).optional(),
        opponentScore: vine.number().min(0).optional(),
        scores: vine.array(
          vine.object({
            playerId: vine.string(),
            scoreType: vine.enum(['PRIMARY', 'SECONDARY', 'CHALLENGER']),
            scoreName: vine.string().optional(),
            scoreValue: vine.number().min(-100).max(100)
          })
        ).optional()
      })
    ).optional()
  })
)
```

### 3. Types TypeScript
```typescript
// inertia/pages/parties/create/types/wizard.ts
export interface GameCreationWizardData {
  // Étape 1: Configuration de base
  gameType: 'MATCHED_PLAY' | 'NARRATIVE' | 'OPEN_PLAY'
  pointsLimit: number
  mission?: string
  
  // Étape 2: Adversaire
  opponentType: 'existing' | 'invite' | 'guest'
  opponentId?: number
  opponentEmail?: string
  opponentPseudo?: string
  
  // Étape 3: Joueurs
  players: Array<{
    pseudo: string
    army?: string
    userId?: number
    isCurrentUser?: boolean
  }>
  
  // Étape 4: Rounds
  enableRounds: boolean
  rounds: Array<{
    roundNumber: number
    playerScore?: number
    opponentScore?: number
    scores?: Array<{
      playerId: string
      scoreType: 'PRIMARY' | 'SECONDARY' | 'CHALLENGER'
      scoreName?: string
      scoreValue: number
    }>
  }>
}

export interface WizardProps {
  availableMissions: Array<{ id: number; name: string; description: string }>
  gameTypes: Array<{ value: string; displayName: string }>
  userFriends: Array<{ id: number; pseudo: string; avatar?: string }>
  currentUser: { id: number; pseudo: string; email: string }
}

export type WizardStep = 1 | 2 | 3 | 4 | 5

export interface StepValidation {
  step1: boolean
  step2: boolean
  step3: boolean
  step4: boolean
  step5: boolean
}
```

## Thème Visuel W40K

### Palette de Couleurs
```css
:root {
  /* Couleurs principales */
  --w40k-black: #000000;
  --w40k-dark-gray: #1a1a1a;
  --w40k-steel: #2d3748;
  
  /* Rouge Sang / Danger */
  --w40k-blood: #8b0000;
  --w40k-crimson: #dc143c;
  --w40k-red-light: #ff6b6b;
  
  /* Or Imperial */
  --w40k-gold: #ffd700;
  --w40k-gold-dark: #b8860b;
  
  /* Accents */
  --w40k-green: #228b22;
  --w40k-blue-steel: #4682b4;
  --w40k-purple: #6a0dad;
}
```

### Composants Stylés
```scss
// Wizard Container
.w40k-wizard-container {
  background: linear-gradient(135deg, 
    var(--w40k-black) 0%, 
    var(--w40k-dark-gray) 25%, 
    #1a0000 50%, 
    var(--w40k-dark-gray) 75%, 
    var(--w40k-black) 100%);
  
  min-height: 100vh;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 20% 50%, rgba(220, 20, 60, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.05) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
}

// Step Container
.step-container {
  position: relative;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid var(--w40k-blood);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 0 30px rgba(220, 20, 60, 0.3),
    inset 0 1px 0 rgba(255, 215, 0, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, 
      var(--w40k-blood), 
      var(--w40k-gold), 
      var(--w40k-blood));
    border-radius: 14px;
    z-index: -1;
    opacity: 0.6;
  }
}

// Buttons W40K Style
.btn-w40k {
  background: linear-gradient(145deg, 
    var(--w40k-blood) 0%, 
    var(--w40k-crimson) 100%);
  border: 1px solid var(--w40k-gold);
  color: white;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(255, 215, 0, 0.2), 
      transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    box-shadow: 
      0 0 20px rgba(220, 20, 60, 0.6),
      0 0 40px rgba(255, 215, 0, 0.3);
    transform: translateY(-2px);
  }
}

// Indicateur de Progression
.step-indicator {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  
  .step {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin: 0 10px;
    transition: all 0.3s ease;
    
    &.completed {
      background: var(--w40k-green);
      color: white;
      box-shadow: 0 0 15px rgba(34, 139, 34, 0.5);
    }
    
    &.current {
      background: var(--w40k-crimson);
      color: white;
      box-shadow: 0 0 20px rgba(220, 20, 60, 0.6);
      animation: pulse-w40k 2s infinite;
    }
    
    &.pending {
      background: var(--w40k-steel);
      color: #888;
    }
    
    // Connexions entre étapes
    &:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 100%;
      width: 20px;
      height: 2px;
      background: var(--w40k-steel);
      transform: translateY(-50%);
    }
  }
}

@keyframes pulse-w40k {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(220, 20, 60, 0.6); 
  }
  50% { 
    box-shadow: 0 0 30px rgba(220, 20, 60, 0.9); 
  }
}
```

## Intégrations Spéciales

### 1. Recherche d'Utilisateurs en Temps Réel
```typescript
// composables/useUserSearch.ts
export const useUserSearch = () => {
  const searchResults = ref<User[]>([])
  const isSearching = ref(false)
  const searchQuery = ref('')
  
  const searchUsers = useDebounceFn(async (query: string) => {
    if (query.length < 2) {
      searchResults.value = []
      return
    }
    
    isSearching.value = true
    
    try {
      const { data } = await axios.get('/api/users/search', {
        params: { q: query, limit: 10 }
      })
      searchResults.value = data.users
    } catch (error) {
      console.error('User search failed:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
  
  watch(searchQuery, searchUsers)
  
  return {
    searchResults: readonly(searchResults),
    isSearching: readonly(isSearching),
    searchQuery,
    searchUsers: () => searchUsers(searchQuery.value)
  }
}
```

### 2. Sauvegarde Automatique en Session
```typescript
// composables/useWizardPersistence.ts
export const useWizardPersistence = (wizardData: Ref<GameCreationWizardData>) => {
  const STORAGE_KEY = 'w40k_game_wizard_data'
  
  // Charger les données sauvegardées
  const loadSavedData = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsedData = JSON.parse(saved)
        Object.assign(wizardData.value, parsedData)
      }
    } catch (error) {
      console.warn('Failed to load wizard data from storage:', error)
    }
  }
  
  // Sauvegarder automatiquement
  const saveData = useDebounceFn(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(wizardData.value))
    } catch (error) {
      console.warn('Failed to save wizard data:', error)
    }
  }, 500)
  
  // Watcher pour sauvegarde automatique
  watch(wizardData, saveData, { deep: true })
  
  const clearSavedData = () => {
    sessionStorage.removeItem(STORAGE_KEY)
  }
  
  return {
    loadSavedData,
    saveData,
    clearSavedData
  }
}
```

### 3. Notifications Toast W40K
```typescript
// Notification après création réussie
const showSuccessNotification = (partieId: number) => {
  toast({
    title: '⚔️ Bataille Créée !',
    description: `La partie #${partieId} a été créée avec succès. Que l'Empereur vous guide !`,
    variant: 'success',
    duration: 5000,
    action: {
      label: 'Voir la Partie',
      onClick: () => router.visit(`/parties/${partieId}`)
    }
  })
}
```

## Performance & UX

### 1. Lazy Loading des Étapes
```vue
<script setup lang="ts">
// Chargement paresseux des composants d'étapes
const currentStepComponent = computed(() => {
  const components = {
    1: defineAsyncComponent(() => import('./components/Step1GameConfig.vue')),
    2: defineAsyncComponent(() => import('./components/Step2Opponent.vue')),
    3: defineAsyncComponent(() => import('./components/Step3Players.vue')),
    4: defineAsyncComponent(() => import('./components/Step4Rounds.vue')),
    5: defineAsyncComponent(() => import('./components/Step5Summary.vue'))
  }
  
  return components[currentStep.value]
})
</script>
```

### 2. Validation en Temps Réel
```typescript
// Validation progressive avec feedback utilisateur
const validateStep = (stepNumber: WizardStep): boolean => {
  const validators = {
    1: () => validateGameConfig(wizardData.value),
    2: () => validateOpponent(wizardData.value),
    3: () => validatePlayers(wizardData.value),
    4: () => validateRounds(wizardData.value),
    5: () => true // Toujours valide si on arrive là
  }
  
  return validators[stepNumber]()
}
```

### 3. Transitions Fluides
```css
.wizard-transition-enter-active,
.wizard-transition-leave-active {
  transition: all 0.3s ease-in-out;
}

.wizard-transition-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.wizard-transition-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}
```

---

## 🎯 Résumé de l'Architecture

Cette architecture offre :

✅ **UX Optimale** : Wizard guidé avec validation en temps réel  
✅ **Performance** : Lazy loading, debouncing, persistance session  
✅ **Accessibilité** : Navigation clavier, ARIA labels  
✅ **Thème W40K** : Immersion visuelle complète  
✅ **Robustesse** : Validation côté client et serveur  
✅ **Extensibilité** : Architecture modulaire et typée  

Le wizard utilise l'orchestration existante (`PartieCompleteService`) et s'intègre parfaitement dans l'architecture DDD du projet.