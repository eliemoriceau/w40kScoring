# Design : Édition Inline des Scores avec 5 Rounds

## 🎯 Objectifs

1. **5 rounds pré-créés** : Chaque partie doit avoir automatiquement 5 rounds dès sa création
2. **Édition inline fluide** : Interface optimisée pour une saisie rapide et intuitive
3. **Validation en temps réel** : Contrôles et feedback immédiat
4. **UX optimisée** : Navigation clavier, auto-focus, indicateurs visuels

## 🎨 Interface Design

### Grille de Scores Améliorée

```
┌─────────────────────────────────────────────────────────────┐
│                    PARTIE #123 - MATCHED PLAY               │
├─────────────────────────────────────────────────────────────┤
│  Joueur 1: Jean (85 pts)      |    Joueur 2: Paul (72 pts)  │
├─────────────────────────────────────────────────────────────┤
│  Round 1:  [15] ✓             |    Round 1:  [12] ✓        │
│  Round 2:  [18] ✓             |    Round 2:  [14] ✓        │
│  Round 3:  [20] ✓             |    Round 3:  [16] ✓        │
│  Round 4:  [ ? ] 🎯           |    Round 4:  [ ? ] 🎯      │
│  Round 5:  [ - ] 📋          |    Round 5:  [ - ] 📋      │
├─────────────────────────────────────────────────────────────┤
│  Secondaires: +32 pts         |    Secondaires: +30 pts    │
└─────────────────────────────────────────────────────────────┘
```

### États Visuels des Rounds

- **✅ Complété** : Score affiché en vert, éditable au clic
- **🎯 En cours** : Bordure orange, auto-focus au clic
- **📋 À venir** : Bordure grise, placeholder "0"
- **✏️ En édition** : Input actif, bordure rouge, boutons de validation

### Interactions Clavier

- **Tab** : Navigation entre les champs de score
- **Enter** : Valider et passer au round suivant
- **Escape** : Annuler et restaurer la valeur précédente
- **↑/↓** : Incrémenter/décrémenter de 1
- **Shift+↑/↓** : Incrémenter/décrémenter de 5

## 🔄 États de l'Interface

### 1. Mode Lecture (par défaut)
- Scores affichés en texte statique
- Hover effects sur les scores éditables
- Indicateur d'édition (crayon) au survol

### 2. Mode Édition (score sélectionné)
- Input numérique avec focus automatique
- Validation en temps réel (0-50 pour primaire, 0-15 pour secondaire)
- Boutons de validation/annulation
- Indicateur de sauvegarde en cours

### 3. Mode Sauvegarde
- Spinner de chargement discret
- Désactivation temporaire de l'input
- Feedback visuel de confirmation

## 📱 Responsive Design

### Mobile (< 768px)
- Stack vertical des joueurs
- Champs de score plus larges
- Boutons tactiles plus grands
- Navigation par swipe entre rounds

### Tablet (768px - 1024px)
- Grille 2 colonnes maintenue
- Taille des champs adaptée
- Touch targets optimisés

### Desktop (> 1024px)
- Grille complète avec tous les détails
- Raccourcis clavier visibles
- Tooltips informatifs

## 🎨 Design System

### Couleurs

```scss
// États des rounds
$round-completed: #10B981;     // Vert - Terminé
$round-current: #F59E0B;       // Orange - En cours
$round-pending: #6B7280;       // Gris - À venir
$round-editing: #EF4444;       // Rouge - En édition

// Scores
$score-primary: #F3F4F6;       // Blanc cassé - Score principal
$score-secondary: #9CA3AF;     // Gris clair - Score secondaire
$score-total: #FCD34D;         // Doré - Total

// Interactions
$hover-bg: rgba(239, 68, 68, 0.1);
$focus-ring: #DC2626;
$success-flash: rgba(16, 185, 129, 0.2);
```

### Animations

```scss
// Transition d'édition
.score-edit-enter {
  transform: scale(1.05);
  box-shadow: 0 0 0 2px $focus-ring;
  transition: all 0.2s ease-out;
}

// Flash de confirmation
.score-saved {
  animation: success-flash 0.3s ease-out;
}

@keyframes success-flash {
  0% { background-color: transparent; }
  50% { background-color: $success-flash; }
  100% { background-color: transparent; }
}
```

## 🛠️ Composants Techniques

### ScoreCell.vue
```vue
<template>
  <div 
    :class="scoreClasses"
    @click="startEditing"
    @keydown="handleKeyboard"
  >
    <span v-if="!isEditing" class="score-display">
      {{ displayValue }}
    </span>
    <input 
      v-else
      v-model.number="editValue"
      :min="minValue"
      :max="maxValue"
      @blur="saveScore"
      @keyup.enter="saveScore"
      @keyup.escape="cancelEdit"
      class="score-input"
      type="number"
      ref="scoreInput"
    />
    <LoadingSpinner v-if="isSaving" size="sm" />
  </div>
</template>
```

### RoundRow.vue
```vue
<template>
  <div :class="roundClasses">
    <div class="round-header">
      <span class="round-number">Round {{ round.roundNumber }}</span>
      <RoundStatus :status="round.status" />
    </div>
    
    <div class="scores-grid">
      <ScoreCell 
        v-for="player in players"
        :key="player.id"
        :round="round"
        :player="player"
        :editable="canEdit"
        @score-updated="handleScoreUpdate"
      />
    </div>
  </div>
</template>
```

### GameScoreBoard.vue (composant principal)
```vue
<template>
  <div class="score-board">
    <!-- En-tête avec totaux -->
    <ScoreSummary :players="players" />
    
    <!-- Grille des rounds -->
    <div class="rounds-grid">
      <RoundRow 
        v-for="round in rounds"
        :key="round.id"
        :round="round"
        :players="players"
        :can-edit="gameCanEdit"
        @round-updated="handleRoundUpdate"
      />
    </div>
    
    <!-- Scores secondaires -->
    <SecondaryScores :players="players" />
  </div>
</template>
```