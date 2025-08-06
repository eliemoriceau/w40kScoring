import type { HttpContext } from '@adonisjs/core/http'

export default class PagesController {
  /**
   * Display the home page
   */
  async home({ inertia }: HttpContext) {
    return inertia.render('Home')
  }

  /**
   * Display the 404 not found page
   */
  async notFound({ inertia }: HttpContext) {
    return inertia.render('NotFound')
  }
}