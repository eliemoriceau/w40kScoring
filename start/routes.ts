/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const PagesController = () => import('#controllers/pages_controller')
const PartiesController = () => import('#controllers/parties_controller')
const AuthController = () => import('#controllers/auth_controller')

// Admin Controllers
const AdminDashboardsController = () => import('#controllers/admin/admin_dashboards_controller')

// Health check endpoint for Kubernetes
router.get('/health', ({ response }) => {
  return response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Home page
router.get('/', [PagesController, 'home'])


// Test Tailwind CSS (temporary route)
router.get('/test-tailwind', ({ inertia }) => {
  return inertia.render('test-tailwind')
})

// Temporary simple tailwind test without components
router.get('/simple-tailwind', ({ response }) => {
  return response.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tailwind CSS Test</title>
  <style>
    /* Simplified Tailwind CSS inline test */
    body { background: #0c0a09; color: #f5f5f4; font-family: system-ui; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .title { font-size: 2.5rem; font-weight: bold; color: #dc2626; margin-bottom: 2rem; }
    .card { background: #1c1917; padding: 1.5rem; border-radius: 0.5rem; border: 2px solid #dc2626; margin-bottom: 1rem; }
    .btn { background: #dc2626; color: white; padding: 0.75rem 1.5rem; border-radius: 0.375rem; border: none; cursor: pointer; }
    .btn:hover { background: #991b1b; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">🛡️ Tailwind CSS v4 Integration Test</h1>
    
    <div class="grid">
      <div class="card">
        <h2 style="color: #f87171; margin-bottom: 1rem;">Installation Status</h2>
        <p>✅ Tailwind CSS v4 installé</p>
        <p>✅ Plugin Vite configuré</p>
        <p>✅ Thème W40K défini</p>
        <button class="btn">Test Button</button>
      </div>
      
      <div class="card">
        <h2 style="color: #eab308; margin-bottom: 1rem;">Next Steps</h2>
        <p>🔄 Migration des composants existants</p>
        <p>🎨 Application du thème W40K</p>
        <p>✨ Amélioration de l'UX</p>
      </div>
    </div>
    
    <div style="margin-top: 2rem; padding: 1rem; background: rgba(220, 38, 38, 0.1); border-left: 4px solid #dc2626;">
      <strong>Note:</strong> Cette page de test utilise du CSS inline pour éviter les conflits avec les composants existants.
      La prochaine étape sera de migrer progressivement les composants vers Tailwind CSS v4.
    </div>
  </div>
</body>
</html>
  `)
})

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
| Routes for user authentication (register, login, logout)
*/
router.get('/register', [AuthController, 'showRegister']).as('auth.show_register')
router.post('/register', [AuthController, 'register']).as('auth.register')

router.get('/login', [AuthController, 'showLogin']).as('auth.show_login')
router.post('/login', [AuthController, 'login']).as('auth.login')
router.post('/logout', [AuthController, 'logout']).as('auth.logout')

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
| Routes that require user authentication
*/
router
  .group(() => {
    // Parties management
    router.get('/parties', [PartiesController, 'index']).as('parties.index')
    router.get('/parties/data', [PartiesController, 'data']).as('parties.data')
    router.get('/parties/create', [PartiesController, 'create']).as('parties.create')
    router.post('/parties/create', [PartiesController, 'store']).as('parties.store')
    router.get('/parties/:id', [PartiesController, 'show']).as('parties.show')

    // Round score update for inline editing
    router
      .put('/parties/:gameId/rounds/:roundId/score', [PartiesController, 'updateRoundScore'])
      .as('parties.rounds.update_score')

    // API routes for wizard
    router.get('/api/users/search', [PartiesController, 'searchUsers']).as('api.users.search')
  })
  .middleware([middleware.auth()])

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
| Routes for administrative panel - restricted to ADMIN role (level 3)
*/
router
  .group(() => {
    // Dashboard principal
    router.get('/', [AdminDashboardsController, 'index']).as('dashboard')

    // Placeholder pour les autres routes admin (implémentées dans les prochaines phases)
    router
      .get('/users', ({ response }) => {
        return response.status(501).json({
          message: 'Gestion des utilisateurs - En cours de développement (Phase 2)',
        })
      })
      .as('users.index')

    router
      .get('/parties', ({ response }) => {
        return response.status(501).json({
          message: 'Gestion des parties - En cours de développement (Phase 3)',
        })
      })
      .as('parties.index')

    router
      .get('/analytics', ({ response }) => {
        return response.status(501).json({
          message: 'Analytics - En cours de développement (Phase 4)',
        })
      })
      .as('analytics.index')

    router
      .get('/system/config', ({ response }) => {
        return response.status(501).json({
          message: 'Configuration système - En cours de développement (Phase 5)',
        })
      })
      .as('system.config')

    router
      .get('/system/logs', ({ response }) => {
        return response.status(501).json({
          message: 'Logs système - En cours de développement (Phase 5)',
        })
      })
      .as('system.logs')
  })
  .prefix('/admin')
  .as('admin')
  .middleware([middleware.auth(), middleware.adminAccess(), middleware.auditLogger()])

// 404 Not Found (fallback route)
router.any('*', [PagesController, 'notFound'])
