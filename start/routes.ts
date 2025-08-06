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

// Home page
router.get('/', [PagesController, 'home'])

// 404 Not Found (fallback route)
router.any('*', [PagesController, 'notFound'])
