import { test } from '@japa/runner'

/**
 * Test de connectivité E2E basique
 *
 * Ce test valide que l'infrastructure de test fonctionne
 * avant d'exécuter des tests plus complexes.
 */
test.group('Test de Connectivité E2E', () => {
  test('devrait pouvoir se connecter au serveur de test', async ({ browserContext, assert }) => {
    const page = await browserContext.newPage()

    try {
      // Navigation directe vers la page d'accueil (publique)
      await page.goto('http://127.0.0.1:3334/', { waitUntil: 'domcontentloaded', timeout: 15000 })

      // Vérifier que nous ne sommes plus sur about:blank
      const currentUrl = page.url()
      console.log('URL actuelle:', currentUrl)

      assert.notEqual(currentUrl, 'about:blank', 'La page ne devrait pas être about:blank')
      assert.include(
        currentUrl,
        '127.0.0.1:3334',
        "L'URL devrait contenir l'adresse du serveur de test"
      )

      // Vérifier que nous avons du contenu sur la page
      const bodyContent = await page.textContent('body')
      assert.isNotEmpty(bodyContent, 'La page devrait avoir du contenu')

      console.log('✅ Connectivité E2E validée')
    } catch (error) {
      console.error('Erreur de connectivité E2E:', error)

      // Prendre une capture d'écran pour debug
      await page.screenshot({
        path: 'tests/browser/screenshots/connectivity-error.png',
        fullPage: true,
      })

      throw error
    } finally {
      await page.close()
    }
  })

  test('devrait pouvoir naviguer vers la page de login', async ({ browserContext, assert }) => {
    const page = await browserContext.newPage()

    try {
      // Navigation directe vers /login (page publique)
      await page.goto('http://127.0.0.1:3334/login', {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      })

      const loginUrl = page.url()
      console.log('URL login:', loginUrl)

      // Vérifier que l'URL contient /login
      assert.include(loginUrl, '/login', "L'URL devrait contenir /login")

      // Vérifier que le formulaire de login est présent
      const loginForm = await page.locator('#login').isVisible()
      assert.isTrue(loginForm, 'Le champ login devrait être visible')

      // Vérifier la présence d'autres éléments du formulaire
      const passwordField = await page.locator('#password').isVisible()
      assert.isTrue(passwordField, 'Le champ password devrait être visible')

      const submitButton = await page.locator('button[type="submit"]').isVisible()
      assert.isTrue(submitButton, 'Le bouton submit devrait être visible')

      console.log('✅ Navigation vers /login réussie')
    } catch (error) {
      console.error('Erreur de navigation:', error)

      // Prendre une capture d'écran pour debug
      await page.screenshot({
        path: 'tests/browser/screenshots/navigation-error.png',
        fullPage: true,
      })

      throw error
    } finally {
      await page.close()
    }
  })
})
