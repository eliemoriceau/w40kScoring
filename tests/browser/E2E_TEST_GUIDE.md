# Guide des Tests E2E - Configuration et Troubleshooting

## État Actuel

Les tests E2E Playwright sont configurés mais rencontrent des problèmes de conflits de ports lors des tests automatisés. Cette documentation explique comment résoudre ces problèmes et exécuter les tests E2E manuellement.

## Problème Identifié

**Symptôme**: `Error: listen EADDRINUSE: address already in use`

**Cause**: AdonisJS essaie de démarrer des serveurs de test sur des ports déjà occupés, notamment par d'autres instances de test (suites `integration`, `functional`, `browser`).

**Impact**: Les tests E2E échouent au démarrage du serveur, empêchant la validation de l'interface utilisateur.

## Solutions Recommandées

### Option 1: Tests E2E Manuels (Recommandé pour maintenant)

1. **Démarrer le serveur de développement**:

   ```bash
   npm run dev
   ```

2. **Dans un autre terminal, exécuter les tests E2E**:

   ```bash
   # Test de connectivité basique
   npm test -- --suite=browser --grep="Test de Connectivité E2E"

   # Tests du wizard de création
   npm test -- --suite=browser --grep="Wizard de Création de Partie"

   # Tests de gestion des scores
   npm test -- --suite=browser --grep="Gestion des Scores"
   ```

### Option 2: Configuration de Ports Dédiés (Solution future)

Modifier la configuration pour utiliser des ports dédiés aux tests E2E:

1. **Créer un profil de test E2E séparé** dans `package.json`:

   ```json
   {
     "scripts": {
       "test:e2e": "NODE_ENV=e2e PORT=4000 node ace test --suite=browser",
       "test:unit": "node ace test --suite=unit",
       "test:functional": "node ace test --suite=functional"
     }
   }
   ```

2. **Configuration environnement E2E** (`.env.e2e`):
   ```env
   NODE_ENV=e2e
   PORT=4000
   DB_DATABASE=e2e_test.db
   ```

### Option 3: Tests E2E en Parallèle avec Docker

Utiliser Docker Compose pour isoler les environnements de test:

```yaml
version: '3.8'
services:
  e2e-tests:
    build: .
    ports:
      - '4000:3333'
    environment:
      - NODE_ENV=test
      - DB_DATABASE=e2e_test.db
    command: npm run test:e2e
```

## Tests E2E Disponibles

### 1. Test de Connectivité (`test_connectivity.spec.ts`)

- ✅ Valide la connexion serveur de base
- ✅ Vérifie la navigation vers les pages principales
- ✅ Prend des captures d'écran pour debug

### 2. Tests du Wizard (`wizard/party_creation.spec.ts`)

- 🔧 Navigation entre les étapes du wizard
- 🔧 Validation des formulaires à chaque étape
- 🔧 Création complète d'une partie
- 🔧 Gestion des erreurs et validation

### 3. Tests de la Liste des Parties (`parties/party_list.spec.ts`)

- 🔧 Affichage de la liste des parties
- 🔧 Filtres et recherche
- 🔧 Actions sur les parties (voir, éditer, supprimer)

### 4. Tests de Gestion des Scores (`scores/score_management.spec.ts`)

- 🔧 Ajout et modification des scores
- 🔧 Validation des règles métier
- 🔧 Interface utilisateur de scoring
- 🔧 Calculs de scores en temps réel

## Étapes de Résolution (À faire)

1. **Immédiat**: Utiliser les tests manuels avec serveur de développement
2. **Court terme**: Configurer des environnements de test séparés
3. **Moyen terme**: Intégrer les tests E2E dans la CI/CD
4. **Long terme**: Optimiser les performances des tests parallèles

## Commandes Utiles

```bash
# Vérifier les ports utilisés
lsof -ti:3333

# Tuer les processus sur un port
pkill -f "node.*3333"

# Tests avec debug
DEBUG=* npm test -- --suite=browser

# Capturer les erreurs
npm test -- --suite=browser 2>&1 | tee test-output.log
```

## Contact et Support

- **Documentation**: `/tests/browser/TROUBLESHOOTING.md`
- **Exemples de tests**: `/tests/browser/README.md`
- **Configuration**: `/tests/bootstrap.ts`

Les tests E2E sont prêts mais nécessitent une configuration serveur dédiée pour l'exécution automatisée.
