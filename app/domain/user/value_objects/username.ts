export class Username {
  constructor(private readonly value: string) {
    this.validate(value)
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Username cannot be empty')
    }

    if (value.length < 3) {
      throw new Error('Username must be at least 3 characters long')
    }

    if (value.length > 30) {
      throw new Error('Username cannot exceed 30 characters')
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(value)) {
      throw new Error('Username can only contain letters, numbers, underscores and hyphens')
    }
  }

  getValue(): string {
    return this.value
  }

  equals(other: Username): boolean {
    return this.value === other.value
  }

  static fromString(username: string): Username {
    return new Username(username.trim())
  }

  toString(): string {
    return this.value
  }
}
