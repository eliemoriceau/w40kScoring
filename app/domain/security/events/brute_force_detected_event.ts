import { DomainEvent } from '../../events/domain_event.js'
import { IpAddress } from '../value_objects/ip_address.js'

/**
 * Event domaine déclenché lors de la détection d'une attaque brute force
 */
export class BruteForceDetectedEvent implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly eventType: string
  public readonly occurredOn: Date
  public readonly eventVersion: number
  public readonly data: Record<string, any>

  constructor(
    public readonly ipAddress: IpAddress,
    public readonly attemptCount: number,
    public readonly timeWindow: string, // '15min' par exemple
    public readonly targetIdentifiers: string[], // Liste des identifiants ciblés (hashés)
    public readonly severity: 'low' | 'medium' | 'high' | 'critical'
  ) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = ipAddress.getValue()
    this.eventType = 'security.brute_force_detected'
    this.occurredOn = new Date()
    this.eventVersion = 1
    this.data = {
      ipAddress: this.ipAddress.getValue(),
      attemptCount: this.attemptCount,
      timeWindow: this.timeWindow,
      targetIdentifiers: this.targetIdentifiers,
      severity: this.severity,
    }
  }

  getEventName(): string {
    return this.eventType
  }

  getEventData(): Record<string, any> {
    return this.data
  }
}
