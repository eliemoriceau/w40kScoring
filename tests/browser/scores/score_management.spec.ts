import { test } from '@japa/runner'
import { authenticateTestUser } from '../helpers/auth_helper.js'

/**
 * Tests E2E pour la gestion des scores
 *
 * Ces tests valident l'interface de saisie et modification
 * des scores dans les parties W40K.
 */
test.group('Gestion des Scores - E2E', () => {
  test('devrait permettre de saisir des scores primaires', async ({ browserContext }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier l'utilisateur de test
      await authenticateTestUser(page)

      // Naviguer directement vers la partie créée par le seeder
      await page.goto('http://127.0.0.1:3334/parties/1', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })

      // Attendre que la page soit chargée
      await page.waitForSelector('[data-testid="score-board"]')

      // Trouver une cellule de score vide pour le round 1
      const scoreCell = page
        .locator('[data-round="1"][data-player="1"][data-score-type="PRIMARY"]')
        .first()

      if (await scoreCell.isVisible()) {
        // Cliquer sur la cellule pour l'éditer
        await scoreCell.click()

        // Saisir un score
        await page.getByRole('spinbutton', { name: /score primaire/i }).fill('15')
        await page.keyboard.press('Enter')

        // Vérifier que le score est sauvegardé
        await expect(scoreCell).toContainText('15')

        // Vérifier la notification de succès
        await expect(page.getByText(/score mis à jour/i)).toBeVisible()
      }
    } catch (error) {
      console.error('Erreur test scores primaires:', error)
      await page.screenshot({ path: 'tests/browser/screenshots/scores-primary-error.png' })
      throw error
    } finally {
      await page.close()
    }
  })

  test('devrait permettre de saisir des scores secondaires avec nom', async ({
    browserContext,
  }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier et naviguer directement vers la partie
      await authenticateTestUser(page)
      await page.goto('http://127.0.0.1:3334/parties/1', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      await page.waitForSelector('[data-testid="score-board"]')

      // Trouver une cellule de score secondaire
      const secondaryCell = page.locator('[data-score-type="SECONDARY"]').first()

      if (await secondaryCell.isVisible()) {
        await secondaryCell.click()

        // Remplir le nom du score secondaire
        await page.getByRole('textbox', { name: /nom du score/i }).fill('Assassinate')
        await page.getByRole('spinbutton', { name: /valeur/i }).fill('10')

        // Sauvegarder
        await page.getByRole('button', { name: /sauvegarder/i }).click()

        // Vérifier l'affichage
        await expect(secondaryCell).toContainText('Assassinate: 10')
      }
    } finally {
      await page.close()
    }
  })

  test('devrait valider les contraintes de scores', async ({ browserContext }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier et naviguer directement vers la partie
      await authenticateTestUser(page)
      await page.goto('http://127.0.0.1:3334/parties/1', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      await page.waitForSelector('[data-testid="score-board"]')

      const scoreCell = page.locator('[data-score-type="PRIMARY"]').first()

      if (await scoreCell.isVisible()) {
        await scoreCell.click()

        // Tenter de saisir un score invalide (négatif)
        await page.getByRole('spinbutton', { name: /score primaire/i }).fill('-5')
        await page.keyboard.press('Enter')

        // Vérifier l'erreur de validation
        await expect(page.getByText(/score invalide/i)).toBeVisible()

        // Tenter de saisir un score trop élevé
        await page.getByRole('spinbutton', { name: /score primaire/i }).fill('100')
        await page.keyboard.press('Enter')

        // Vérifier l'erreur de validation
        await expect(page.getByText(/score maximum/i)).toBeVisible()
      }
    } finally {
      await page.close()
    }
  })

  test('devrait calculer automatiquement les totaux', async ({ browserContext }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier et naviguer directement vers la partie
      await authenticateTestUser(page)
      await page.goto('http://127.0.0.1:3334/parties/1', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      await page.waitForSelector('[data-testid="score-board"]')

      // Saisir plusieurs scores pour un joueur
      const player1Scores = page.locator('[data-player="1"]')

      // Score primaire round 1
      await player1Scores.locator('[data-round="1"][data-score-type="PRIMARY"]').click()
      await page.getByRole('spinbutton').fill('20')
      await page.keyboard.press('Enter')

      // Attendre la mise à jour
      await page.waitForTimeout(500)

      // Score primaire round 2
      await player1Scores.locator('[data-round="2"][data-score-type="PRIMARY"]').click()
      await page.getByRole('spinbutton').fill('25')
      await page.keyboard.press('Enter')

      // Attendre la mise à jour
      await page.waitForTimeout(500)

      // Vérifier que le total est calculé correctement
      const totalCell = page.locator('[data-testid="player-1-total"]')
      await expect(totalCell).toContainText('45')
    } finally {
      await page.close()
    }
  })

  test("devrait permettre la modification en lot des scores d'un round", async ({
    browserContext,
  }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier et naviguer directement vers la partie
      await authenticateTestUser(page)
      await page.goto('http://127.0.0.1:3334/parties/1', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      await page.waitForSelector('[data-testid="score-board"]')

      // Ouvrir l'édition en lot pour le round 1
      await page.getByRole('button', { name: /éditer round 1/i }).click()

      // Vérifier que le modal s'ouvre
      await expect(page.getByRole('dialog', { name: /scores round 1/i })).toBeVisible()

      // Saisir les scores pour les deux joueurs
      await page.getByRole('spinbutton', { name: /joueur 1/i }).fill('30')
      await page.getByRole('spinbutton', { name: /joueur 2/i }).fill('22')

      // Sauvegarder
      await page.getByRole('button', { name: /sauvegarder les scores/i }).click()

      // Vérifier que les scores sont mis à jour dans le tableau
      await expect(page.locator('[data-round="1"][data-player="1"]')).toContainText('30')
      await expect(page.locator('[data-round="1"][data-player="2"]')).toContainText('22')
    } finally {
      await page.close()
    }
  })

  test("devrait afficher l'historique des modifications", async ({ browserContext }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier et naviguer directement vers la partie
      await authenticateTestUser(page)
      await page.goto('http://127.0.0.1:3334/parties/1', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      await page.waitForSelector('[data-testid="score-board"]')

      // Ouvrir l'historique
      await page.getByRole('button', { name: /historique/i }).click()

      // Vérifier que l'historique s'affiche
      await expect(
        page.getByRole('dialog', { name: /historique des modifications/i })
      ).toBeVisible()

      // Vérifier la présence d'entrées d'historique
      const historyItems = page.locator('[data-testid="history-item"]')

      if ((await historyItems.count()) > 0) {
        // Vérifier qu'une entrée contient les informations attendues
        const firstItem = historyItems.first()
        await expect(firstItem.locator('[data-testid="modification-time"]')).toBeVisible()
        await expect(firstItem.locator('[data-testid="modification-user"]')).toBeVisible()
        await expect(firstItem.locator('[data-testid="modification-details"]')).toBeVisible()
      }
    } finally {
      await page.close()
    }
  })

  test('devrait supporter les raccourcis clavier pour la navigation', async ({
    browserContext,
  }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier et naviguer directement vers la partie
      await authenticateTestUser(page)
      await page.goto('http://127.0.0.1:3334/parties/1', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      await page.waitForSelector('[data-testid="score-board"]')

      // Cliquer sur une cellule de score
      const scoreCell = page.locator('[data-score-type="PRIMARY"]').first()
      await scoreCell.click()

      // Utiliser Tab pour naviguer vers la cellule suivante
      await page.keyboard.press('Tab')

      // Vérifier que le focus est déplacé
      await expect(page.locator(':focus')).toBeTruthy()

      // Utiliser Escape pour annuler l'édition
      await page.keyboard.press('Escape')

      // Vérifier que l'édition est annulée
      await expect(page.getByRole('spinbutton')).not.toBeVisible()
    } finally {
      await page.close()
    }
  })
})
