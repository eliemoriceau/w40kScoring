import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import { browserClient } from '@japa/browser-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  apiClient(),
  browserClient({
    runInSuites: ['browser'],
    contextOptions: {
      // Configuration Playwright optimisée pour les tests E2E
      viewport: { width: 1280, height: 720 }, // Taille d'écran standard
      ignoreHTTPSErrors: true, // Ignorer les erreurs SSL en dev
    },
  }),
]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => testUtils.db().migrate(),
    async () => {
      // Pour les tests browser, ajouter des données de test
      // Détecter si des tests browser sont exécutés
      const isBrowserTest =
        process.argv.includes('--suites=browser') ||
        process.argv.some((arg) => arg.includes('browser')) ||
        process.argv.includes('--grep=browser')

      if (isBrowserTest) {
        console.log('🌱 Exécution des seeders pour les tests E2E')

        // D'abord créer les rôles
        const { default: RoleSeeder } = await import('../database/seeders/role_seeder.js')
        await new RoleSeeder(app.container.make('lucid.db')).run()
        console.log('✅ Rôles créés')

        // Ensuite créer les données de test
        const { default: BrowserTestSeeder } = await import(
          '../database/seeders/browser_test_seeder.js'
        )
        await new BrowserTestSeeder(app.container.make('lucid.db')).run()
        console.log('✅ Données de test créées')
      }
    },
  ],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['functional', 'e2e', 'integration', 'browser'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
