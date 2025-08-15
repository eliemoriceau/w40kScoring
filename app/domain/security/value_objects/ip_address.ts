/**
 * Value Object pour les adresses IP
 * Valide et encapsule une adresse IP
 */
export class IpAddress {
  private constructor(private readonly value: string) {
    this.validate(value)
  }

  static create(value: string): IpAddress {
    return new IpAddress(value)
  }

  getValue(): string {
    return this.value
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('IP address cannot be empty')
    }

    // Validation basique d'adresse IP (IPv4 et IPv6)
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/

    if (!ipv4Regex.test(value) && !ipv6Regex.test(value)) {
      // Accepter aussi localhost pour le développement
      if (value !== 'localhost' && value !== '127.0.0.1' && value !== '::1') {
        throw new Error(`Invalid IP address format: ${value}`)
      }
    }
  }

  equals(other: IpAddress): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
