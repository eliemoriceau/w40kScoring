/**
 * Value Object pour les credentials de login
 * Encapsule l'identifiant (email ou username) et le mot de passe
 * Détecte automatiquement si l'identifiant est un email ou un username
 */
export class LoginCredentials {
  private constructor(
    private readonly identifier: string,
    private readonly password: string,
    private readonly isEmail: boolean
  ) {
    this.validate()
  }

  static create(identifier: string, password: string): LoginCredentials {
    const trimmedIdentifier = identifier.trim()
    const isEmail = this.isValidEmail(trimmedIdentifier)

    return new LoginCredentials(trimmedIdentifier, password, isEmail)
  }

  getIdentifier(): string {
    return this.identifier
  }

  getPassword(): string {
    return this.password
  }

  isEmailLogin(): boolean {
    return this.isEmail
  }

  isUsernameLogin(): boolean {
    return !this.isEmail
  }

  private validate(): void {
    // Validation de l'identifiant
    if (!this.identifier || this.identifier.length === 0) {
      throw new Error('Identifier cannot be empty')
    }

    if (this.identifier.length < 3) {
      throw new Error('Identifier must be at least 3 characters long')
    }

    if (this.identifier.length > 255) {
      throw new Error('Identifier cannot exceed 255 characters')
    }

    // Validation du mot de passe
    if (!this.password || this.password.length === 0) {
      throw new Error('Password cannot be empty')
    }

    if (this.password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    if (this.password.length > 255) {
      throw new Error('Password cannot exceed 255 characters')
    }
  }

  private static isValidEmail(identifier: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(identifier)
  }

  equals(other: LoginCredentials): boolean {
    return (
      this.identifier === other.identifier &&
      this.password === other.password &&
      this.isEmail === other.isEmail
    )
  }

  toString(): string {
    return `LoginCredentials(${this.isEmail ? 'email' : 'username'}: ${this.identifier})`
  }
}
