import hash from '@adonisjs/core/services/hash'
import { UserRepositoryInterface } from '../../../domain/user/repositories/user_repository_interface.js'
import { User } from '../../../domain/user/entities/user.js'
import { Username, EmailAddress } from '../../../domain/user/value_objects/index.js'
import { RegisterUserCommand } from '../commands/register_user_command.js'
import { UserRegistrationResult } from '../dtos/registration_dto.js'

export class UserRegistrationService {
  constructor(private userRepository: UserRepositoryInterface) {}

  async register(command: RegisterUserCommand): Promise<UserRegistrationResult> {
    const username = Username.fromString(command.username)
    const email = EmailAddress.fromString(command.email)

    await this.validateUniqueConstraints(username, email)

    if (!command.termsAccepted) {
      throw new Error('Terms of service must be accepted')
    }

    this.validatePassword(command.password)

    const passwordHash = await hash.make(command.password)
    const userId = await this.userRepository.nextId()

    const user = User.register(userId, username, email, passwordHash, command.newsletterConsent)

    await this.userRepository.save(user)

    // Récupérer l'utilisateur créé pour avoir l'ID réel généré par la base
    const createdUser = await this.userRepository.findByUsername(username)

    if (!createdUser) {
      throw new Error('Failed to create user')
    }

    return {
      userId: createdUser.getId().getValue(),
      username: username.getValue(),
      email: email.getValue(),
      success: true,
      message: 'User registered successfully',
    }
  }

  private async validateUniqueConstraints(username: Username, email: EmailAddress): Promise<void> {
    const [isUsernameUnique, isEmailUnique] = await Promise.all([
      this.userRepository.isUsernameUnique(username),
      this.userRepository.isEmailUnique(email),
    ])

    if (!isUsernameUnique) {
      throw new Error('Username is already taken')
    }

    if (!isEmailUnique) {
      throw new Error('Email address is already registered')
    }
  }

  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
  }
}
