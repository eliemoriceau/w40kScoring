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
    console.log('🚀 Registration attempt started')
    try {
      const data = await request.validateUsing(registerUserValidator)
      console.log('✅ Validation passed:', { username: data.username, email: data.email })

      const command = RegisterUserCommand.create({
        username: data.username,
        email: data.email,
        password: data.password,
        newsletterConsent: data.newsletterConsent ?? false,
        termsAccepted: data.termsAccepted,
      })
      console.log('📋 Command created:', command)

      const result = await this.userRegistrationService.register(command)
      console.log('🎯 Registration service result:', result)

      if (result.success) {
        console.log('🔐 Attempting to login user with ID:', result.userId)
        await auth.use('web').login(await User.findOrFail(result.userId))
        console.log('✅ User logged in successfully')

        session.flash(
          'success',
          `Bienvenue dans la Croisade, ${result.username}! Votre compte a été créé avec succès.`
        )
        console.log('🏠 Redirecting to /parties')

        return response.redirect('/parties')
      }

      console.log('❌ Registration failed:', result.message)
      session.flash(
        'error',
        result.message || 'Une erreur est survenue lors de la création du compte'
      )
      return response.redirect().back()
    } catch (error) {
      console.error('💥 Registration error:', error)
      session.flash(
        'error',
        error.message || 'Une erreur est survenue lors de la création du compte'
      )
      return response.redirect().back()
    }
  }
}
