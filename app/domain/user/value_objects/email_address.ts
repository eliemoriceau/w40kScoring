export class EmailAddress {
  constructor(private readonly value: string) {
    this.validate(value)
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Email address cannot be empty')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email address format')
    }

    if (value.length > 254) {
      throw new Error('Email address cannot exceed 254 characters')
    }
  }

  getValue(): string {
    return this.value.toLowerCase()
  }

  equals(other: EmailAddress): boolean {
    return this.getValue() === other.getValue()
  }

  static fromString(email: string): EmailAddress {
    return new EmailAddress(email.trim())
  }

  toString(): string {
    return this.getValue()
  }

  getDomain(): string {
    return this.value.split('@')[1]
  }
}
