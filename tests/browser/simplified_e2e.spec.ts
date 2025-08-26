import { test } from '@japa/runner'

/**
 * Tests E2E Simplifiés - Validation Sans Serveur
 *
 * Ces tests valident que l'infrastructure E2E fonctionne
 * sans avoir besoin d'un serveur de test dédié.
 */
test.group('Tests E2E Simplifiés', () => {
  test('devrait pouvoir initialiser le contexte navigateur', async ({ browserContext, assert }) => {
    const page = await browserContext.newPage()

    try {
      // Test basique d'initialisation
      assert.isTrue(page !== null, 'Le contexte navigateur devrait être initialisé')
      assert.isTrue(page.url().includes('about:blank'), 'La page devrait commencer sur about:blank')

      // Configuration de base
      await page.setViewportSize({ width: 1280, height: 720 })
      const viewport = page.viewportSize()
      assert.equal(viewport?.width, 1280, 'La largeur de viewport devrait être configurée')
      assert.equal(viewport?.height, 720, 'La hauteur de viewport devrait être configurée')

      console.log('✅ Contexte navigateur Playwright initialisé avec succès')
    } finally {
      await page.close()
    }
  })

  test('devrait pouvoir naviguer vers des URLs externes pour validation', async ({
    browserContext,
    assert,
  }) => {
    const page = await browserContext.newPage()

    try {
      // Test de navigation vers une URL externe simple
      await page.goto(
        'data:text/html,<html><head><title>Test</title></head><body><h1>Test E2E</h1><div id="content">Contenu de test</div></body></html>'
      )

      // Validation du contenu
      const title = await page.title()
      assert.equal(title, 'Test', 'Le titre de la page devrait être correct')

      const heading = await page.textContent('h1')
      assert.equal(heading, 'Test E2E', 'Le contenu H1 devrait être correct')

      const content = await page.textContent('#content')
      assert.equal(content, 'Contenu de test', 'Le contenu devrait être accessible via sélecteur')

      console.log("✅ Navigation et sélection d'éléments DOM fonctionnelles")
    } finally {
      await page.close()
    }
  })

  test("devrait pouvoir prendre des captures d'écran", async ({ browserContext, assert }) => {
    const page = await browserContext.newPage()

    try {
      // Créer une page de test simple
      const htmlContent = `<html>
        <head><title>Screenshot Test</title></head>
        <body style="background: #f0f0f0; font-family: Arial;">
          <div style="text-align: center; padding: 2rem;">
            <h1>W40K Scoring Test</h1>
            <p>Test de fonctionnalité Playwright</p>
            <button id="test-btn">Cliquer ici</button>
          </div>
        </body>
      </html>`

      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`)

      // Attendre que la page soit chargée
      await page.waitForLoadState('networkidle')

      // Prendre une capture d'écran
      const screenshotPath = 'tests/browser/screenshots/playwright-validation.png'
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      })

      console.log("✅ Capture d'écran sauvegardée: " + screenshotPath)

      // Validation que la page est bien rendue
      const title = await page.title()
      assert.equal(title, 'Screenshot Test', 'La page de test devrait être rendue')

      const button = await page.locator('button').count()
      assert.equal(button, 1, 'Le bouton devrait être présent')
    } finally {
      await page.close()
    }
  })

  test('devrait pouvoir simuler des interactions utilisateur', async ({
    browserContext,
    assert,
  }) => {
    const page = await browserContext.newPage()

    try {
      // Page de test interactive plus simple
      const simpleHTML = `<html>
        <head><title>Interactive Test</title></head>
        <body>
          <input id="test-input" type="text" value="">
          <button id="test-btn" onclick="updateResult()">Cliquer</button>
          <div id="result">Initial</div>
          <script>
            function updateResult() {
              var input = document.getElementById("test-input");
              var result = document.getElementById("result");
              result.textContent = "Result: " + input.value;
            }
          </script>
        </body>
      </html>`

      await page.goto(`data:text/html,${encodeURIComponent(simpleHTML)}`)

      // Attendre que la page soit totalement chargée
      await page.waitForLoadState('networkidle')

      // Vérifier que les éléments sont présents
      const inputExists = await page.locator('#test-input').count()
      assert.equal(inputExists, 1, "L'input devrait être présent")

      const buttonExists = await page.locator('#test-btn').count()
      assert.equal(buttonExists, 1, 'Le bouton devrait être présent')

      // Test d'interaction: saisie de texte
      await page.fill('#test-input', 'Test Simple')
      const inputValue = await page.inputValue('#test-input')
      assert.equal(inputValue, 'Test Simple', 'La saisie devrait fonctionner')

      // Test d'interaction: clic sur le bouton
      await page.click('#test-btn')

      // Attendre que le résultat soit mis à jour
      await page.waitForTimeout(100)

      // Vérifier le résultat avec du texte ASCII simple
      const result = await page.textContent('#result')
      assert.equal(result, 'Result: Test Simple', "L'interaction devrait produire le bon résultat")

      console.log('✅ Interactions utilisateur (saisie, clic) fonctionnelles')
    } catch (error) {
      console.error("Erreur lors du test d'interaction:", error)

      // Capture d'écran pour debug
      await page.screenshot({
        path: 'tests/browser/screenshots/interaction-error.png',
        fullPage: true,
      })

      throw error
    } finally {
      await page.close()
    }
  })
})
