/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const PagesController = () => import('#controllers/pages_controller')

// Health check endpoint for Kubernetes
router.get('/health', ({ response }) => {
  return response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Home page
router.get('/', [PagesController, 'home'])

// 404 Not Found (fallback route)
router.any('*', [PagesController, 'notFound'])
