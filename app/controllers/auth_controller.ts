import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerUserValidator } from '#validators/register_user'
import { UserRegistrationService } from '../application/user/services/user_registration_service.js'
import { LucidUserRepository } from '../infrastructure/user/repositories/lucid_user_repository.js'
import { RegisterUserCommand } from '../application/user/commands/register_user_command.js'

export default class AuthController {
  private userRegistrationService: UserRegistrationService

  constructor() {
    const userRepository = new LucidUserRepository()
    this.userRegistrationService = new UserRegistrationService(userRepository)
  }

  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/register', {
      title: 'Rejoindre la Croisade | Warhammer 40K Scoring',
    })
  }

  async register({ request, response, auth, session }: HttpContext) {
    try {
      const data = await request.validateUsing(registerUserValidator)

      const command = RegisterUserCommand.create({
        username: data.username,
        email: data.email,
        password: data.password,
        newsletterConsent: data.newsletterConsent ?? false,
        termsAccepted: data.termsAccepted,
      })

      const result = await this.userRegistrationService.register(command)

      if (result.success) {
        await auth.use('web').login(await User.findOrFail(result.userId))

        session.flash(
          'success',
          `Bienvenue dans la Croisade, ${result.username}! Votre compte a été créé avec succès.`
        )

        return response.redirect('/parties')
      }

      session.flash(
        'error',
        result.message || 'Une erreur est survenue lors de la création du compte'
      )
      return response.redirect().back()
    } catch (error) {
      session.flash(
        'error',
        error.message || 'Une erreur est survenue lors de la création du compte'
      )
      return response.redirect().back()
    }
  }
}
