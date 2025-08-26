import { test } from '@japa/runner'

/**
 * Tests E2E pour le wizard de création de partie
 *
 * Ces tests valident l'expérience utilisateur complète
 * du wizard de création de partie via l'interface web.
 */
test.group('Wizard de Création de Partie - E2E', () => {
  test('devrait naviguer à travers toutes les étapes du wizard', async ({
    browserContext,
    visit,
  }) => {
    const page = await browserContext.newPage()

    // Navigation vers le wizard de création
    await visit('/parties/create', { page })

    // Vérifier que le wizard est affiché
    await page.waitForSelector('.wizard-header')
    await expect(page.getByRole('heading', { name: /créer une nouvelle bataille/i })).toBeVisible()

    // Étape 1 : Configuration de base
    await page.getByRole('combobox', { name: /type de jeu/i }).selectOption('MATCHED_PLAY')
    await page.getByRole('spinbutton', { name: /limite de points/i }).fill('2000')
    await page.getByRole('textbox', { name: /mission/i }).fill('Test Mission E2E')

    // Vérifier que le bouton suivant est activé
    await expect(page.getByRole('button', { name: /suivant/i })).toBeEnabled()
    await page.getByRole('button', { name: /suivant/i }).click()

    // Étape 2 : Configuration adversaire
    await page.waitForSelector('[data-step="2"]')
    await page.getByRole('radio', { name: /adversaire invité/i }).check()
    await page.getByRole('textbox', { name: /pseudo adversaire/i }).fill('E2E Opponent')

    await expect(page.getByRole('button', { name: /suivant/i })).toBeEnabled()
    await page.getByRole('button', { name: /suivant/i }).click()

    // Étape 3 : Configuration joueurs
    await page.waitForSelector('[data-step="3"]')

    // Le joueur actuel devrait être pré-rempli
    await expect(page.getByRole('textbox', { name: /votre pseudo/i })).toHaveValue(/.+/)

    // Vérifier que l'adversaire est configuré
    await expect(page.getByDisplayValue('E2E Opponent')).toBeVisible()

    await page.getByRole('button', { name: /suivant/i }).click()

    // Étape 4 : Résumé et création
    await page.waitForSelector('[data-step="4"]')

    // Vérifier que le résumé affiche les bonnes informations
    await expect(page.getByText('MATCHED_PLAY')).toBeVisible()
    await expect(page.getByText('2000 points')).toBeVisible()
    await expect(page.getByText('Test Mission E2E')).toBeVisible()
    await expect(page.getByText('E2E Opponent')).toBeVisible()

    // Créer la partie
    await page.getByRole('button', { name: /créer la bataille/i }).click()

    // Vérifier la création réussie
    await page.waitForSelector('.notification-container')
    await expect(page.getByText(/bataille créée/i)).toBeVisible()

    // Vérifier la redirection vers la page de la partie
    await page.waitForURL(/\/parties\/\d+/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /test mission e2e/i })).toBeVisible()
  })

  test('devrait valider les erreurs de saisie dans le wizard', async ({
    browserContext,
    visit,
  }) => {
    const page = await browserContext.newPage()

    await visit('/parties/create', { page })

    // Étape 1 : Tenter de passer sans sélectionner le type
    await page.getByRole('button', { name: /suivant/i }).click()

    // Le wizard ne devrait pas avancer
    await expect(page.getByText(/étape 1/i)).toBeVisible()

    // Saisir des données invalides
    await page.getByRole('spinbutton', { name: /limite de points/i }).fill('123') // Pas un multiple de 50

    // Vérifier l'erreur de validation
    await expect(page.getByText(/multiple de 50/i)).toBeVisible()

    // Corriger la saisie
    await page.getByRole('combobox', { name: /type de jeu/i }).selectOption('OPEN_PLAY')
    await page.getByRole('spinbutton', { name: /limite de points/i }).fill('1000')

    // Maintenant le bouton suivant devrait être activé
    await expect(page.getByRole('button', { name: /suivant/i })).toBeEnabled()
  })

  test('devrait permettre de revenir aux étapes précédentes', async ({ browserContext, visit }) => {
    const page = await browserContext.newPage()

    await visit('/parties/create', { page })

    // Configuration rapide étape 1
    await page.getByRole('combobox', { name: /type de jeu/i }).selectOption('NARRATIVE')
    await page.getByRole('spinbutton', { name: /limite de points/i }).fill('1500')
    await page.getByRole('button', { name: /suivant/i }).click()

    // Configuration étape 2
    await page.getByRole('radio', { name: /adversaire invité/i }).check()
    await page.getByRole('textbox', { name: /pseudo adversaire/i }).fill('Retour Test')
    await page.getByRole('button', { name: /suivant/i }).click()

    // Revenir à l'étape précédente
    await page.getByRole('button', { name: /précédent/i }).click()

    // Vérifier qu'on est bien revenu à l'étape 2
    await expect(page.getByText(/étape 2/i)).toBeVisible()
    await expect(page.getByDisplayValue('Retour Test')).toBeVisible()

    // Revenir à l'étape 1
    await page.getByRole('button', { name: /précédent/i }).click()

    // Vérifier que les données sont préservées
    await expect(page.getByRole('combobox', { name: /type de jeu/i })).toHaveValue('NARRATIVE')
    await expect(page.getByRole('spinbutton', { name: /limite de points/i })).toHaveValue('1500')
  })

  test('devrait sauvegarder automatiquement la progression', async ({ browserContext, visit }) => {
    const page = await browserContext.newPage()

    await visit('/parties/create', { page })

    // Configuration partielle
    await page.getByRole('combobox', { name: /type de jeu/i }).selectOption('MATCHED_PLAY')
    await page.getByRole('spinbutton', { name: /limite de points/i }).fill('2000')

    // Attendre la sauvegarde automatique
    await page.waitForTimeout(1000)

    // Rafraîchir la page
    await page.reload()

    // Vérifier que les données sont restaurées
    await expect(page.getByRole('combobox', { name: /type de jeu/i })).toHaveValue('MATCHED_PLAY')
    await expect(page.getByRole('spinbutton', { name: /limite de points/i })).toHaveValue('2000')
  })

  test('devrait gérer les raccourcis clavier', async ({ browserContext, visit }) => {
    const page = await browserContext.newPage()

    await visit('/parties/create', { page })

    // Configuration étape 1
    await page.getByRole('combobox', { name: /type de jeu/i }).selectOption('MATCHED_PLAY')
    await page.getByRole('spinbutton', { name: /limite de points/i }).fill('2000')

    // Utiliser Alt + Flèche droite pour avancer
    await page.keyboard.press('Alt+ArrowRight')

    // Vérifier qu'on est passé à l'étape 2
    await expect(page.getByText(/étape 2/i)).toBeVisible()

    // Utiliser Alt + Flèche gauche pour reculer
    await page.keyboard.press('Alt+ArrowLeft')

    // Vérifier qu'on est revenu à l'étape 1
    await expect(page.getByText(/étape 1/i)).toBeVisible()

    // Utiliser Ctrl + S pour sauvegarder
    await page.keyboard.press('Control+s')

    // Vérifier la notification de sauvegarde
    await expect(page.getByText(/sauvegardé/i)).toBeVisible()
  })
})
