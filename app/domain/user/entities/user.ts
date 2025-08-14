import { DateTime } from 'luxon'
import { AggregateRoot } from '../../shared/aggregate_root.js'
import { UserId, Username, EmailAddress, UserRole } from '../value_objects/index.js'
import { UserRegisteredEvent } from '../events/user_registered_event.js'

export class User extends AggregateRoot<UserId> {
  private constructor(
    id: UserId,
    private readonly username: Username,
    private readonly email: EmailAddress,
    private readonly passwordHash: string,
    private readonly role: UserRole,
    private readonly newsletterConsent: boolean,
    private readonly termsAcceptedAt: Date,
    private readonly createdAt: DateTime,
    private readonly updatedAt: DateTime | null = null
  ) {
    super(id)
  }

  static register(
    id: UserId,
    username: Username,
    email: EmailAddress,
    passwordHash: string,
    newsletterConsent: boolean = false
  ): User {
    const role = UserRole.user()
    const termsAcceptedAt = new Date()
    const createdAt = DateTime.now()

    const user = new User(
      id,
      username,
      email,
      passwordHash,
      role,
      newsletterConsent,
      termsAcceptedAt,
      createdAt
    )

    user.addDomainEvent(
      new UserRegisteredEvent(id, username, email, role, newsletterConsent, termsAcceptedAt)
    )

    return user
  }

  static reconstitute(
    id: UserId,
    username: Username,
    email: EmailAddress,
    passwordHash: string,
    role: UserRole,
    newsletterConsent: boolean,
    termsAcceptedAt: Date,
    createdAt: DateTime,
    updatedAt: DateTime | null = null
  ): User {
    return new User(
      id,
      username,
      email,
      passwordHash,
      role,
      newsletterConsent,
      termsAcceptedAt,
      createdAt,
      updatedAt
    )
  }

  getUsername(): Username {
    return this.username
  }

  getEmail(): EmailAddress {
    return this.email
  }

  getPasswordHash(): string {
    return this.passwordHash
  }

  getRole(): UserRole {
    return this.role
  }

  getNewsletterConsent(): boolean {
    return this.newsletterConsent
  }

  getTermsAcceptedAt(): Date {
    return this.termsAcceptedAt
  }

  getCreatedAt(): DateTime {
    return this.createdAt
  }

  getUpdatedAt(): DateTime | null {
    return this.updatedAt
  }

  isAdmin(): boolean {
    return this.role.isAdmin()
  }

  isModerator(): boolean {
    return this.role.isModerator()
  }

  canModerate(): boolean {
    return this.role.canModerate()
  }

  canAdministrate(): boolean {
    return this.role.canAdministrate()
  }

  toPrimitives(): {
    id: number
    username: string
    email: string
    passwordHash: string
    role: string
    newsletterConsent: boolean
    termsAcceptedAt: Date
    createdAt: DateTime
    updatedAt: DateTime | null
  } {
    return {
      id: this.id.getValue(),
      username: this.username.getValue(),
      email: this.email.getValue(),
      passwordHash: this.passwordHash,
      role: this.role.getValue(),
      newsletterConsent: this.newsletterConsent,
      termsAcceptedAt: this.termsAcceptedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
