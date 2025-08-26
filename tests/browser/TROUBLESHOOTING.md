# Guide de Résolution des Tests E2E Playwright

Ce guide documente les problèmes courants avec les tests Playwright et leurs solutions.

## 🔧 Problèmes Identifiés et Solutions

### 1. Navigateurs Playwright Non Installés

**Symptôme** : Tests timeout immédiatement ou erreur "Browser not found"

**Solution** :

```bash
# Installer les navigateurs Playwright
npx playwright install

# Ou installer seulement Chromium (plus léger)
npx playwright install chromium
```

### 2. Erreur "expect is not defined"

**Symptôme** : `ReferenceError: expect is not defined`

**Cause** : Utilisation de l'API expect de Playwright au lieu des assertions Japa

**Solution** : Utiliser les assertions Japa injectées

```typescript
// ❌ Incorrect
test('mon test', async ({ page }) => {
  expect(page.url()).toContain('/parties')
})

// ✅ Correct
test('mon test', async ({ page, assert }) => {
  assert.include(page.url(), '/parties')
})
```

### 3. Timeouts sur le Chargement des Pages

**Symptôme** : `Timeout 30000ms exceeded` sur les éléments DOM

**Causes Possibles** :

- Serveur de développement non démarré
- Pages qui prennent du temps à charger
- Éléments qui n'existent pas

**Solutions** :

```typescript
// 1. Vérifier que le serveur dev tourne
// npm run dev (dans un autre terminal)

// 2. Augmenter les timeouts
await page.waitForLoadState('networkidle', { timeout: 30000 })

// 3. Utiliser des attentes plus explicites
await page.waitForSelector('h1', { timeout: 10000 })

// 4. Gestion d'erreur robuste
try {
  await page.click('button', { timeout: 5000 })
} catch (error) {
  console.log('Element not found, test continues...')
}
```

### 4. Configuration Playwright Incorrecte

**Symptôme** : Erreurs de configuration TypeScript

**Solution** : Configuration minimaliste dans `bootstrap.ts`

```typescript
browserClient({
  runInSuites: ['browser'],
  contextOptions: {
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
})
```

### 5. Port de Développement Occupé

**Symptôme** : `Port 24678 is already in use`

**Solutions** :

```bash
# Tuer le processus qui utilise le port
lsof -ti:3333 | xargs kill -9

# Redémarrer le serveur dev
npm run dev
```

## 🚀 Meilleures Pratiques

### Structure des Tests

```typescript
test('description claire', async ({ browserContext, visit, assert }) => {
  const page = await browserContext.newPage()

  try {
    // 1. Navigation
    await visit('/path', { page })

    // 2. Attendre le chargement
    await page.waitForLoadState('networkidle')

    // 3. Actions et vérifications
    const element = await page.locator('selector').first()
    if (await element.isVisible()) {
      await element.click()
    }

    // 4. Assertions avec Japa
    assert.include(page.url(), '/expected-path')
  } catch (error) {
    // 5. Debug info
    console.error('Test failed:', error)
    await page.screenshot({ path: 'debug-screenshot.png' })
    throw error
  } finally {
    // 6. Nettoyage
    await page.close()
  }
})
```

### Gestion d'État

```typescript
// Créer des données de test avant les tests
test.setup(async () => {
  // Préparer les données de test via API
})

// Nettoyer après les tests
test.teardown(async () => {
  // Nettoyer les données de test
})
```

### Debug des Tests

```typescript
// 1. Mode headless désactivé pour debug
// Dans bootstrap.ts : headless: false

// 2. Captures d'écran automatiques
await page.screenshot({
  path: `screenshots/test-${Date.now()}.png`,
  fullPage: true,
})

// 3. Logs détaillés
console.log('Current URL:', page.url())
console.log('Page title:', await page.title())

// 4. Attendre manuellement
await page.pause() // Mode interactif
```

## 🔄 Workflow de Dépannage

1. **Vérifier les prérequis** :

   ```bash
   npx playwright --version
   npx playwright install --dry-run
   ```

2. **Tester la configuration minimale** :

   ```bash
   npm test -- --suite=browser --grep="Navigation de Base"
   ```

3. **Examiner les logs** :
   - Erreurs dans la console du navigateur
   - Erreurs réseau (404, 500, etc.)
   - Timeouts vs erreurs de sélecteur

4. **Isolation du problème** :
   - Tester un seul test à la fois
   - Désactiver headless pour voir le navigateur
   - Ajouter des captures d'écran

5. **Validation finale** :
   ```bash
   # Tous les tests browser
   npm test -- --suite=browser
   ```

## 📝 Checklist de Qualité

- [ ] Navigateurs Playwright installés
- [ ] Serveur de développement actif
- [ ] Configuration bootstrap correcte
- [ ] Assertions Japa (pas expect)
- [ ] Timeouts appropriés
- [ ] Gestion d'erreurs robuste
- [ ] Nettoyage des pages
- [ ] Documentation des cas d'échec

## 🆘 Support

En cas de problème persistant :

1. Consulter la [documentation Japa Browser](https://japa.dev/docs/plugins/browser-client)
2. Vérifier les [logs de Playwright](https://playwright.dev/docs/debug)
3. Examiner les exemples dans `basic_navigation.spec.ts`
4. Activer le mode debug avec `page.pause()`
