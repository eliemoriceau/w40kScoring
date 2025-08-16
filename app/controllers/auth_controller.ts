import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerUserValidator } from '#validators/register_user'
import { loginUserValidator } from '#validators/login_user'
import { UserRegistrationService } from '../application/user/services/user_registration_service.js'
import { LucidUserRepository } from '../infrastructure/user/repositories/lucid_user_repository.js'
import { RegisterUserCommand } from '../application/user/commands/register_user_command.js'
import { SecureUserAuthenticationService } from '../application/auth/services/secure_user_authentication_service.js'
import { UserAuthenticationService } from '../domain/security/services/user_authentication_service.js'
import { RateLimiterService } from '../domain/security/services/rate_limiter_service.js'
import { LucidLoginAttemptRepository } from '../infrastructure/security/repositories/lucid_login_attempt_repository.js'
import { LucidAccountLockRepository } from '../infrastructure/security/repositories/lucid_account_lock_repository.js'
import { WinstonSecurityLogger } from '../infrastructure/security/services/winston_security_logger.js'
import { LoginUserCommand } from '../application/auth/commands/login_user_command.js'

export default class AuthController {
  private userRegistrationService: UserRegistrationService
  private secureAuthService: SecureUserAuthenticationService

  constructor() {
    const userRepository = new LucidUserRepository()
    this.userRegistrationService = new UserRegistrationService(userRepository)

    // Configuration du service d'authentification sécurisé
    const attemptRepository = new LucidLoginAttemptRepository()
    const lockRepository = new LucidAccountLockRepository()
    const securityLogger = new WinstonSecurityLogger()

    const authService = new UserAuthenticationService(userRepository)
    const rateLimiter = new RateLimiterService(attemptRepository, lockRepository)

    this.secureAuthService = new SecureUserAuthenticationService(
      authService,
      rateLimiter,
      attemptRepository,
      securityLogger
    )
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

  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login', {
      title: 'Accès au Commandement | Warhammer 40K Scoring',
    })
  }

  async login({ request, response, auth, session }: HttpContext) {
    try {
      const data = await request.validateUsing(loginUserValidator)

      console.log('🔧 Standard auth - Attempting login with:', data.login)

      // Utiliser l'authentification AdonisJS standard avec AuthFinder
      const user = await User.verifyCredentials(data.login, data.password)
      
      if (!user) {
        session.flash('error', 'Identifiants invalides')
        return response.redirect().back()
      }

      console.log('✅ Standard auth - User verified:', user.username)
      
      // Connexion avec AdonisJS
      await auth.use('web').login(user, !!data.rememberMe)

      console.log('✅ Standard auth - User logged in successfully')

      session.flash('success', `Bienvenue dans le Commandement, ${user.username}!`)

      return response.redirect('/parties')
    } catch (error) {
      console.error('💥 Login error:', error)
      session.flash('error', 'Identifiants invalides')
      return response.redirect().back()
    }
  }

  async logout({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.flash('success', 'Vous avez été déconnecté avec succès')
    return response.redirect('/login')
  }
}
