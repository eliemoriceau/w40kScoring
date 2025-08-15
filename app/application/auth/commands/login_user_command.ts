/**
 * Command pour l'authentification d'un utilisateur
 * Encapsule toutes les données nécessaires pour une tentative de login
 */
export class LoginUserCommand {
  constructor(
    public readonly login: string,
    public readonly password: string,
    public readonly rememberMe: boolean = false,
    public readonly ipAddress: string,
    public readonly userAgent: string | null = null,
    public readonly deviceId: string | null = null
  ) {
    this.validate()
  }

  static create(data: {
    login: string
    password: string
    rememberMe?: boolean
    ipAddress: string
    userAgent?: string | null
    deviceId?: string | null
  }): LoginUserCommand {
    return new LoginUserCommand(
      data.login,
      data.password,
      data.rememberMe ?? false,
      data.ipAddress,
      data.userAgent ?? null,
      data.deviceId ?? null
    )
  }

  private validate(): void {
    if (!this.login || this.login.trim().length === 0) {
      throw new Error('Login identifier is required')
    }

    if (!this.password || this.password.length === 0) {
      throw new Error('Password is required')
    }

    if (!this.ipAddress || this.ipAddress.trim().length === 0) {
      throw new Error('IP address is required for security tracking')
    }

    if (this.login.trim().length < 3) {
      throw new Error('Login identifier must be at least 3 characters')
    }

    if (this.password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }
  }

  isEmailLogin(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(this.login.trim())
  }

  getLoginMethod(): 'email' | 'username' {
    return this.isEmailLogin() ? 'email' : 'username'
  }
}
