export class UserId {
  constructor(private readonly value: number) {
    this.validate(value)
  }

  private validate(value: number): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('UserId must be a positive integer')
    }
  }

  getValue(): number {
    return this.value
  }

  equals(other: UserId): boolean {
    return this.value === other.value
  }

  static fromNumber(id: number): UserId {
    return new UserId(id)
  }

  toString(): string {
    return this.value.toString()
  }
}
