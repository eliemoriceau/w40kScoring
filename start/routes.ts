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
    
    // API routes for wizard
    router.get('/api/users/search', [PartiesController, 'searchUsers']).as('api.users.search')
  })
  .middleware([middleware.auth()])

// 404 Not Found (fallback route)
router.any('*', [PagesController, 'notFound'])
