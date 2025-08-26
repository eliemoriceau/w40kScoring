# Tests Browser (Playwright)

Ce répertoire contient les tests E2E (End-to-End) utilisant Playwright pour tester l'application depuis l'interface utilisateur.

## Configuration

Les tests browser sont configurés pour utiliser :

- **Suite** : `browser` (configurée dans `adonisrc.ts`)
- **Timeout** : 300s (5 minutes) pour les tests longs
- **Framework** : Playwright via `@japa/browser-client`

## Structure Recommandée

```
tests/browser/
├── README.md                     # Ce fichier
├── wizard/                       # Tests pour le wizard de création
│   └── party_creation.spec.ts
├── parties/                      # Tests pour la gestion des parties
│   ├── party_list.spec.ts
│   └── party_detail.spec.ts
└── scores/                       # Tests pour la gestion des scores
    └── score_management.spec.ts
```

## Exemple d'utilisation

```typescript
import { test } from '@japa/runner'

test.group('Wizard de Création de Partie - E2E', () => {
  test('devrait créer une nouvelle partie complète', async ({ browserContext, visit }) => {
    const page = await browserContext.newPage()

    // Navigation vers la page de création
    await visit('/parties/create', { page })

    // Étape 1 : Configuration de base
    await page.getByRole('combobox', { name: /type de jeu/i }).selectOption('MATCHED_PLAY')
    await page.getByRole('spinbutton', { name: /limite de points/i }).fill('2000')
    await page.getByRole('button', { name: /suivant/i }).click()

    // Étape 2 : Configuration adversaire
    await page.getByRole('radio', { name: /adversaire invité/i }).check()
    await page.getByRole('textbox', { name: /pseudo adversaire/i }).fill('TestOpponent')
    await page.getByRole('button', { name: /suivant/i }).click()

    // Étape 3 : Finalisation
    await page.getByRole('button', { name: /créer la partie/i }).click()

    // Vérifications
    await expect(page.getByText(/partie créée avec succès/i)).toBeVisible()
    await expect(page).toHaveURL(/\/parties\/\d+/)
  })
})
```

## Exécution

```bash
# Tous les tests browser
npm test -- --suite=browser

# Tests browser spécifiques
npm test -- --grep="E2E"

# Tests browser avec watch mode
npm test -- --suite=browser --watch
```

## Bonnes Pratiques

1. **Isolation** : Chaque test doit être indépendant
2. **Données de test** : Utiliser des données de test dédiées
3. **Attentes explicites** : Toujours attendre les éléments avant interaction
4. **Nettoyage** : Nettoyer les données après les tests si nécessaire
5. **Performance** : Regrouper les tests similaires pour optimiser le temps d'exécution

## Dépendances

- `@japa/browser-client` : Client Playwright pour Japa
- `playwright` : Framework de test E2E
- Configuration dans `tests/bootstrap.ts`
