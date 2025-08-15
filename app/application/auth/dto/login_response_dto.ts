import { UserId } from '../../../domain/user/value_objects/user_id.js'
import { Username } from '../../../domain/user/value_objects/username.js'

/**
 * DTO de réponse pour les tentatives de login
 */
export class LoginResponseDto {
  private constructor(
    public readonly success: boolean,
    public readonly userId: number | null = null,
    public readonly username: string | null = null,
    public readonly message: string | null = null,
    public readonly errorCode: string | null = null,
    public readonly retryAfter: number | null = null, // secondes
    public readonly lockDuration: number | null = null // secondes
  ) {}

  static success(userId: UserId, username: Username): LoginResponseDto {
    return new LoginResponseDto(
      true,
      userId.getValue(),
      username.getValue(),
      'Authentication successful'
    )
  }

  static failure(message: string, errorCode: string = 'INVALID_CREDENTIALS'): LoginResponseDto {
    return new LoginResponseDto(false, null, null, message, errorCode)
  }

  static rateLimited(retryAfter: number): LoginResponseDto {
    return new LoginResponseDto(
      false,
      null,
      null,
      'Too many login attempts. Please try again later.',
      'RATE_LIMITED',
      retryAfter
    )
  }

  static accountLocked(lockDuration: number): LoginResponseDto {
    return new LoginResponseDto(
      false,
      null,
      null,
      'Account temporarily locked due to multiple failed attempts.',
      'ACCOUNT_LOCKED',
      null,
      lockDuration
    )
  }

  isSuccess(): boolean {
    return this.success
  }

  isRateLimited(): boolean {
    return this.errorCode === 'RATE_LIMITED'
  }

  isAccountLocked(): boolean {
    return this.errorCode === 'ACCOUNT_LOCKED'
  }

  toResponse(): {
    success: boolean
    userId?: number
    username?: string
    message?: string
    error?: {
      code: string
      message: string
      retryAfter?: number
      lockDuration?: number
    }
  } {
    if (this.success) {
      return {
        success: true,
        userId: this.userId!,
        username: this.username!,
        message: this.message!,
      }
    }

    return {
      success: false,
      error: {
        code: this.errorCode!,
        message: this.message!,
        retryAfter: this.retryAfter || undefined,
        lockDuration: this.lockDuration || undefined,
      },
    }
  }
}
