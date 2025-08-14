export enum UserRoleType {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export class UserRole {
  constructor(private readonly value: UserRoleType) {
    this.validate(value)
  }

  private validate(value: UserRoleType): void {
    if (!Object.values(UserRoleType).includes(value)) {
      throw new Error(`Invalid user role: ${value}`)
    }
  }

  getValue(): UserRoleType {
    return this.value
  }

  equals(other: UserRole): boolean {
    return this.value === other.value
  }

  static fromString(role: string): UserRole {
    const upperRole = role.toUpperCase() as UserRoleType
    return new UserRole(upperRole)
  }

  static user(): UserRole {
    return new UserRole(UserRoleType.USER)
  }

  static admin(): UserRole {
    return new UserRole(UserRoleType.ADMIN)
  }

  static moderator(): UserRole {
    return new UserRole(UserRoleType.MODERATOR)
  }

  isUser(): boolean {
    return this.value === UserRoleType.USER
  }

  isAdmin(): boolean {
    return this.value === UserRoleType.ADMIN
  }

  isModerator(): boolean {
    return this.value === UserRoleType.MODERATOR
  }

  toString(): string {
    return this.value
  }

  getPermissionLevel(): number {
    switch (this.value) {
      case UserRoleType.USER:
        return 1
      case UserRoleType.MODERATOR:
        return 2
      case UserRoleType.ADMIN:
        return 3
      default:
        return 0
    }
  }

  canModerate(): boolean {
    return this.getPermissionLevel() >= 2
  }

  canAdministrate(): boolean {
    return this.getPermissionLevel() >= 3
  }
}
