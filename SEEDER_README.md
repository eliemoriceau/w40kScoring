# 🎯 Complete Game Seeder - Guide d'utilisation

## Vue d'ensemble

Le **Complete Game Seeder** crée des scénarios de jeu complets et réalistes pour Warhammer 40K, incluant :

- 🎮 **3 jeux différents** avec scenarii variés
- 👥 **2 joueurs par jeu** (utilisateur enregistré + invité)
- 🎲 **5 rounds** par jeu (ou 3 pour Combat Patrol)
- 📊 **Scores détaillés** par round et joueur
- 🏆 **Données réalistes** de compétition

## ⚡ Utilisation rapide

```bash
# 1. Exécuter les migrations (si ce n'est pas fait)
node ace migration:run

# 2. Lancer le seeder complet
node ace db:seed

# Alternative : Seeder spécifique
node ace db:seed --files=database/seeders/complete_game_seeder.ts
```

## 🎮 Scenarii générés

### 1. 🏆 Competitive Tournament Game

- **Joueurs** : Imperial Commander VII vs Tau Shadowsun
- **Format** : Strike Force (2000 points)
- **Type** : Matched Play
- **Rounds** : 5 rounds complets
- **Scores** : Réalistes et équilibrés
- **Détails** : Scores détaillés par type (PRIMARY, SECONDARY, etc.)

### 2. 🎓 Learning Game (Combat Patrol)

- **Joueurs** : Rookie Space Marine vs Guest Newbie
- **Format** : Combat Patrol (500 points)
- **Type** : Narrative
- **Rounds** : 3 rounds (format apprentissage)
- **Scores** : Plus faibles, adaptés aux débutants

### 3. ⚡ Close Championship Match

- **Joueurs** : Champion Player Alpha vs Contender Beta
- **Format** : Strike Force (2000 points)
- **Type** : Matched Play
- **Rounds** : 5 rounds serrés
- **Scores** : Partie très équilibrée (< 15 points d'écart)

## 📊 Données générées

Le seeder crée automatiquement :

| Élément          | Quantité | Description                                            |
| ---------------- | -------- | ------------------------------------------------------ |
| **Jeux**         | 3        | Scenarii différents (compétitif, apprentissage, serré) |
| **Utilisateurs** | 5        | Comptes de démonstration (@demo.w40k)                  |
| **Joueurs**      | 6        | 2 joueurs par jeu (mix registered/guest)               |
| **Rounds**       | 13       | 5+3+5 rounds selon le format                           |
| **Scores**       | ~50      | Scores détaillés par type et joueur                    |

## 🛠️ Architecture technique

### Factories utilisées

- **`GameFactory`** : Création de jeux avec différents statuts
- **`PlayerFactory`** : Joueurs enregistrés et invités
- **`RoundFactory`** : Rounds avec scores réalistes
- **`ScoreFactory`** : Scores détaillés par type
- **`CompleteGameFactory`** : Orchestration complète

### Approche DDD

- ✅ Entités du domaine préservées
- ✅ Value Objects respectés
- ✅ Événements de domaine générés
- ✅ Architecture hexagonale maintenue

## 🎯 Utilisation pour tests

### Tests unitaires

```typescript
import CompleteGameFactory from '#tests/helpers/complete_game_factory'

// Créer un jeu complet pour test
const completeGame = CompleteGameFactory.createCompleteGame({
  includeDetailedScores: true,
  scorePattern: 'realistic',
})
```

### Tests de scénarii

```typescript
// Jeu compétitif
const competitive = CompleteGameFactory.createScenario('competitive')

// Jeu d'apprentissage
const learning = CompleteGameFactory.createScenario('learning')

// Jeu de domination
const domination = CompleteGameFactory.createScenario('domination')
```

### Tests reproductibles

```typescript
// Utiliser un seed pour des résultats reproductibles
const game = CompleteGameFactory.createCompleteGame({
  seed: 12345, // Résultats identiques à chaque exécution
  players: [
    { pseudo: 'TestPlayer1', userId: 1 },
    { pseudo: 'TestPlayer2', userId: null },
  ],
})
```

## 🗄️ Compatibilité base de données

### SQLite ✅

- Support complet
- Contraintes respectées
- Migrations appliquées

### PostgreSQL ✅

- Support via Lucid ORM
- Mêmes données générées
- Performance optimale

## 🧹 Nettoyage des données

Le seeder nettoie automatiquement :

- ❌ Anciens scores détaillés
- ❌ Anciens rounds
- ❌ Anciens joueurs
- ❌ Anciens jeux
- ❌ Utilisateurs de démo précédents

## 📋 Validation des données

### Contraintes métier respectées

- ✅ Pseudos uniques par jeu
- ✅ Scores compatibles avec types
- ✅ Relations FK cohérentes
- ✅ États de jeu logiques

### Scores réalistes

- **PRIMARY** : 5-15 points
- **SECONDARY** : 3-12 points
- **OBJECTIVE** : 1-8 points
- **BONUS** : 2-5 points
- **PENALTY** : -1 à -5 points

## 🚀 Personnalisation

### Créer vos propres scenarii

```typescript
const customGame = CompleteGameFactory.createCompleteGame({
  gameType: GameType.MATCHED_PLAY,
  pointsLimit: new PointsLimit(1000),
  players: [
    { pseudo: 'MonJoueur', userId: 123 },
    { pseudo: 'MonAdversaire', userId: 456 },
  ],
  roundCount: 4,
  scorePattern: 'escalating',
  includeDetailedScores: true,
})
```

### Formats W40K supportés

```typescript
// Combat Patrol (500 points)
const combatPatrol = CompleteGameFactory.createForFormat('combat-patrol')

// Incursion (1000 points)
const incursion = CompleteGameFactory.createForFormat('incursion')

// Strike Force (2000 points)
const strikeForce = CompleteGameFactory.createForFormat('strike-force')

// Onslaught (3000 points)
const onslaught = CompleteGameFactory.createForFormat('onslaught')
```

## 🔧 Dépannage

### Erreur "table does not exist"

```bash
# Exécuter les migrations
node ace migration:run
```

### Erreur de contrainte unique

```bash
# Nettoyer la base manuellement
node ace migration:rollback
node ace migration:run
```

### Problème de dates

Le seeder convertit automatiquement les dates JavaScript en Luxon DateTime pour AdonisJS.

## 📈 Performance

- ⚡ **~2 secondes** pour générer tous les scenarii
- 💾 **~50KB** de données en SQLite
- 🔄 **Idempotent** (peut être relancé sans problème)

---

**Issue #12** ✅ **Implémenté avec succès**

_Guide créé pour w40kScoring - Seeder complet avec architecture DDD_
