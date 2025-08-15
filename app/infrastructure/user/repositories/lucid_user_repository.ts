import { DateTime } from 'luxon'
import UserModel from '#models/user'
import { UserRepositoryInterface } from '../../../domain/user/repositories/user_repository_interface.js'
import { User } from '../../../domain/user/entities/user.js'
import {
  UserId,
  Username,
  EmailAddress,
  UserRole,
  UserRoleType,
} from '../../../domain/user/value_objects/index.js'

export class LucidUserRepository implements UserRepositoryInterface {
  async save(user: User): Promise<void> {
    const primitives = user.toPrimitives()

    // Utiliser create() pour l'auto-increment au lieu de fill() + save()
    await UserModel.create({
      username: primitives.username,
      email: primitives.email,
      password: primitives.passwordHash,
      roleId: this.getRoleIdFromRoleType(primitives.role as UserRoleType),
      newsletterConsent: primitives.newsletterConsent,
      termsAcceptedAt: DateTime.fromJSDate(primitives.termsAcceptedAt),
    })
  }

  async findById(id: UserId): Promise<User | null> {
    const userModel = await UserModel.query().preload('role').where('id', id.getValue()).first()

    if (!userModel) {
      return null
    }

    return this.toDomain(userModel)
  }

  async findByUsername(username: Username): Promise<User | null> {
    const userModel = await UserModel.query()
      .preload('role')
      .where('username', username.getValue())
      .first()

    if (!userModel) {
      return null
    }

    return this.toDomain(userModel)
  }

  async findByEmail(email: EmailAddress): Promise<User | null> {
    const userModel = await UserModel.query()
      .preload('role')
      .where('email', email.getValue())
      .first()

    if (!userModel) {
      return null
    }

    return this.toDomain(userModel)
  }

  async exists(id: UserId): Promise<boolean> {
    const count = await UserModel.query().where('id', id.getValue()).count('* as total')

    return Number(count[0].$extras.total) > 0
  }

  async isUsernameUnique(username: Username, excludeId?: UserId): Promise<boolean> {
    const query = UserModel.query().where('username', username.getValue())

    if (excludeId) {
      query.whereNot('id', excludeId.getValue())
    }

    const count = await query.count('* as total')
    return Number(count[0].$extras.total) === 0
  }

  async isEmailUnique(email: EmailAddress, excludeId?: UserId): Promise<boolean> {
    const query = UserModel.query().where('email', email.getValue())

    if (excludeId) {
      query.whereNot('id', excludeId.getValue())
    }

    const count = await query.count('* as total')
    return Number(count[0].$extras.total) === 0
  }

  async nextId(): Promise<UserId> {
    // Pour Lucid ORM, on retourne un ID temporaire
    // L'ID réel sera généré lors du save()
    return UserId.fromNumber(1)
  }

  private toDomain(userModel: UserModel): User {
    if (!userModel.role) {
      throw new Error(`User with ID ${userModel.id} has no role loaded or assigned`)
    }
    
    return User.reconstitute(
      UserId.fromNumber(userModel.id),
      Username.fromString(userModel.username),
      EmailAddress.fromString(userModel.email),
      userModel.password,
      UserRole.fromString(userModel.role.name),
      userModel.newsletterConsent,
      userModel.termsAcceptedAt.toJSDate(),
      userModel.createdAt,
      userModel.updatedAt
    )
  }

  private getRoleIdFromRoleType(roleType: UserRoleType): number {
    switch (roleType) {
      case UserRoleType.USER:
        return 1
      case UserRoleType.MODERATOR:
        return 2
      case UserRoleType.ADMIN:
        return 3
      default:
        return 1
    }
  }
}
