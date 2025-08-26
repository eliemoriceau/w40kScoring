import { test } from '@japa/runner'
import { authenticateTestUser } from '../helpers/auth_helper.js'

/**
 * Tests E2E pour la liste des parties
 *
 * Ces tests valident l'affichage et la navigation
 * dans la liste des parties utilisateur.
 */
test.group('Liste des Parties - E2E', () => {
  test('devrait afficher la liste des parties utilisateur', async ({ browserContext }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier l'utilisateur de test
      await authenticateTestUser(page)

      // Navigation directe vers la liste des parties
      await page.waitForURL('**/parties', { timeout: 10000 })

      // Vérifier que la page de liste est affichée
      await expect(page.getByRole('heading', { name: /mes parties/i })).toBeVisible()

      // Vérifier la présence des éléments d'interface
      await expect(page.getByRole('link', { name: /nouvelle bataille/i })).toBeVisible()
      await expect(page.getByRole('combobox', { name: /filtrer par statut/i })).toBeVisible()
    } finally {
      await page.close()
    }
  })

  test('devrait filtrer les parties par statut', async ({ browserContext }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier et aller directement à la liste des parties
      await authenticateTestUser(page)
      await page.waitForURL('**/parties', { timeout: 10000 })

      // Appliquer un filtre par statut
      await page.getByRole('combobox', { name: /filtrer par statut/i }).selectOption('EN_COURS')

      // Vérifier que l'URL est mise à jour avec le filtre
      await expect(page).toHaveURL(/status=EN_COURS/)

      // Les résultats devraient être filtrés
      const partyCards = page.locator('[data-testid="party-card"]')

      // Vérifier que toutes les cartes affichées ont le statut "EN_COURS"
      const count = await partyCards.count()
      for (let i = 0; i < count; i++) {
        await expect(partyCards.nth(i).getByText(/en cours/i)).toBeVisible()
      }
    } finally {
      await page.close()
    }
  })

  test('devrait permettre la pagination', async ({ browserContext }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier et aller directement à la liste des parties
      await authenticateTestUser(page)
      await page.waitForURL('**/parties', { timeout: 10000 })

      // Vérifier s'il y a pagination (si plus de résultats)
      const paginationNext = page.getByRole('button', { name: /suivant/i })

      if (await paginationNext.isVisible()) {
        // Cliquer sur suivant
        await paginationNext.click()

        // Vérifier que l'URL change
        await expect(page).toHaveURL(/cursor=/)

        // Vérifier que de nouveaux résultats sont chargés
        await expect(page.getByText(/page 2/i)).toBeVisible()
      }
    } finally {
      await page.close()
    }
  })

  test("devrait naviguer vers le détail d'une partie", async ({ browserContext }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier et aller directement à la liste des parties
      await authenticateTestUser(page)
      await page.waitForURL('**/parties', { timeout: 10000 })

      // Cliquer sur la première partie disponible
      const firstPartyLink = page.locator('[data-testid="party-card"] a').first()

      if (await firstPartyLink.isVisible()) {
        await firstPartyLink.click()

        // Vérifier la navigation vers le détail
        await page.waitForURL(/\/parties\/\d+/)

        // Vérifier que la page de détail est chargée
        await expect(page.getByText(/round/i)).toBeVisible()
        await expect(page.getByText(/scores/i)).toBeVisible()
      }
    } finally {
      await page.close()
    }
  })

  test('devrait afficher les informations de partie correctement', async ({ browserContext }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier et aller directement à la liste des parties
      await authenticateTestUser(page)
      await page.waitForURL('**/parties', { timeout: 10000 })

      // Vérifier qu'une carte de partie contient les informations essentielles
      const partyCard = page.locator('[data-testid="party-card"]').first()

      if (await partyCard.isVisible()) {
        // Chaque carte devrait contenir :
        await expect(partyCard.locator('[data-testid="party-type"]')).toBeVisible()
        await expect(partyCard.locator('[data-testid="points-limit"]')).toBeVisible()
        await expect(partyCard.locator('[data-testid="party-status"]')).toBeVisible()
        await expect(partyCard.locator('[data-testid="players"]')).toBeVisible()
      }
    } finally {
      await page.close()
    }
  })

  test('devrait permettre de créer une nouvelle partie', async ({ browserContext }) => {
    const page = await browserContext.newPage()

    try {
      // Authentifier et aller directement à la liste des parties
      await authenticateTestUser(page)
      await page.waitForURL('**/parties', { timeout: 10000 })

      // Cliquer sur "Nouvelle Bataille"
      await page.getByRole('link', { name: /nouvelle bataille/i }).click()

      // Vérifier la redirection vers le wizard
      await expect(page).toHaveURL('/parties/create')
      await expect(
        page.getByRole('heading', { name: /créer une nouvelle bataille/i })
      ).toBeVisible()
    } finally {
      await page.close()
    }
  })
})
