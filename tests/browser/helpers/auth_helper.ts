import type { Page } from 'playwright'
import { DateTime } from 'luxon'
import User from '#models/user'

/**
 * Créer l'utilisateur de test s'il n'existe pas
 */
export async function ensureTestUserExists(): Promise<{ userId: number }> {
  // Nettoyer l'utilisateur existant pour éviter les conflits
  const existingUser = await User.findBy('email', 'test@example.com')
  if (existingUser) {
    console.log("🗑️ Nettoyage de l'utilisateur de test existant")
    await existingUser.delete()
  }

  console.log("👤 Création de l'utilisateur de test")
  const testUser = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    roleId: 1,
    termsAcceptedAt: DateTime.now(),
  })
  console.log('✅ Utilisateur de test créé avec succès')

  return { userId: testUser.id }
}

/**
 * Authentifie l'utilisateur de test dans le navigateur
 * @param page Instance Playwright de la page
 * @returns Promise résolue une fois l'authentification terminée
 */
export async function authenticateTestUser(page: Page): Promise<void> {
  // S'assurer que l'utilisateur de test existe
  await ensureTestUserExists()

  try {
    console.log("🔐 Début de l'authentification de test")

    // Naviguer vers la page de login
    await page.goto('http://127.0.0.1:3334/login', { waitUntil: 'domcontentloaded' })
    console.log('📄 Page de login chargée')

    // Attendre que le formulaire soit chargé
    await page.waitForSelector('#login', { timeout: 10000 })
    console.log('📝 Formulaire de login détecté')

    // Remplir le formulaire de login
    await page.fill('#login', 'test@example.com')
    await page.fill('#password', 'password123')
    console.log('✏️ Formulaire rempli avec les identifiants de test')

    // Vérifier que les valeurs sont bien saisies
    const loginValue = await page.inputValue('#login')
    const passwordValue = await page.inputValue('#password')
    console.log(
      `🔍 Vérification: login="${loginValue}", password="${passwordValue ? '****' : 'vide'}"`
    )

    // Soumettre le formulaire
    await page.click('button[type="submit"]')
    console.log('🚀 Formulaire soumis')

    // Attendre la redirection avec retry logic
    let authAttempts = 0
    const maxAuthAttempts = 3
    let authSuccess = false

    while (!authSuccess && authAttempts < maxAuthAttempts) {
      authAttempts++
      console.log(`🔄 Tentative d'authentification ${authAttempts}/${maxAuthAttempts}`)

      try {
        // Attendre un peu plus longtemps et vérifier l'URL
        await page.waitForTimeout(2000)
        const currentUrl = page.url()
        console.log('🌐 URL actuelle:', currentUrl)

        if (currentUrl.includes('/parties')) {
          authSuccess = true
          console.log('✅ Redirection réussie vers /parties')
          break
        }

        // Si toujours sur login, attendre un peu plus ou retry
        if (currentUrl.includes('/login')) {
          if (authAttempts < maxAuthAttempts) {
            console.log('⏳ Toujours sur login, nouvel essai...')
            await page.waitForTimeout(2000)
          }
        }
      } catch (error) {
        console.log(`❌ Tentative ${authAttempts} échouée:`, error.message)
        if (authAttempts < maxAuthAttempts) {
          await page.waitForTimeout(1000)
        }
      }
    }

    if (!authSuccess) {
      // Chercher des messages d'erreur sur la page
      const errorElements = await page
        .locator('.error, .alert-danger, [class*="error"], [class*="danger"]')
        .allTextContents()
      if (errorElements.length > 0) {
        console.log("⚠️ Messages d'erreur trouvés:", errorElements)
      }

      // Chercher des flash messages
      const flashElements = await page
        .locator('[class*="flash"], [class*="notification"], [class*="alert"]')
        .allTextContents()
      if (flashElements.length > 0) {
        console.log('💬 Messages flash:', flashElements)
      }

      throw new Error(`Authentification échouée après ${maxAuthAttempts} tentatives`)
    }

    // Dernière vérification avec waitForURL
    await page.waitForURL('**/parties', { timeout: 5000 })

    console.log('✅ Utilisateur de test authentifié avec succès')
  } catch (error) {
    console.error("❌ Erreur d'authentification:", error)

    // Debug : capturer l'état actuel
    const currentUrl = page.url()
    console.log("🔍 URL actuelle lors de l'erreur:", currentUrl)

    // Capturer le contenu de la page pour debug
    const pageContent = await page.textContent('body')
    console.log('📄 Contenu de la page (100 premiers caractères):', pageContent?.slice(0, 100))

    // Prendre une capture d'écran pour debug
    await page.screenshot({
      path: 'tests/browser/screenshots/auth-error-detailed.png',
      fullPage: true,
    })

    throw error
  }
}

/**
 * Authentifie l'utilisateur de test et navigue vers une page protégée
 * @param page Instance Playwright de la page
 * @param visit Fonction visit d'Inertia.js
 * @param url URL de destination après authentification
 * @returns Promise résolue une fois l'authentification et navigation terminées
 */
export async function authenticateAndVisit(
  page: Page,
  visit: Function,
  url: string
): Promise<void> {
  await authenticateTestUser(page)
  await visit(url, { page })
}
