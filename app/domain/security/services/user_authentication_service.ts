import { LoginCredentials } from '../value_objects/login_credentials.js'
import { UserRepositoryInterface } from '../../user/repositories/user_repository_interface.js'
import { User } from '../../user/entities/user.js'
import { EmailAddress } from '../../user/value_objects/email_address.js'
import { Username } from '../../user/value_objects/username.js'

/**
 * Service domaine pour l'authentification des utilisateurs
 * Responsable de la logique métier d'authentification
 */
export class UserAuthenticationService {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  /**
   * Authentifie un utilisateur avec ses credentials
   * Détermine automatiquement si l'identifiant est un email ou un username
   */
  async authenticate(credentials: LoginCredentials): Promise<User | null> {
    let user: User | null = null

    try {
      if (credentials.isEmailLogin()) {
        // Recherche par email
        const email = EmailAddress.fromString(credentials.getIdentifier())
        user = await this.userRepository.findByEmail(email)
      } else {
        // Recherche par username
        const username = Username.fromString(credentials.getIdentifier())
        user = await this.userRepository.findByUsername(username)
      }

      if (!user) {
        return null
      }

      // Vérifier le mot de passe
      const isValidPassword = await this.verifyPassword(
        credentials.getPassword(),
        user.getPasswordHash()
      )

      if (!isValidPassword) {
        return null
      }

      return user
    } catch (error) {
      // En cas d'erreur (utilisateur non trouvé, etc.), retourner null
      // pour éviter de révéler des informations sur l'existence des comptes
      return null
    }
  }

  /**
   * Vérifie si un mot de passe correspond au hash stocké
   * Utilise le service de hachage d'AdonisJS pour la compatibilité
   */
  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      // Utiliser le service de hash d'AdonisJS
      const hash = await import('@adonisjs/core/services/hash')
      return await hash.default.verify(hashedPassword, plainPassword)
    } catch (error) {
      console.error('Error verifying password:', error)
      return false
    }
  }

  /**
   * Détermine le type de login utilisé (email ou username)
   */
  getLoginMethod(credentials: LoginCredentials): 'email' | 'username' {
    return credentials.isEmailLogin() ? 'email' : 'username'
  }
}
