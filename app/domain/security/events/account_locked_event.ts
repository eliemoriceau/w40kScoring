import { DomainEvent } from '../../events/domain_event.js'
import { UserId } from '../../user/value_objects/user_id.js'
import { IpAddress } from '../value_objects/ip_address.js'
import { DateTime } from 'luxon'

/**
 * Event domaine déclenché lors du verrouillage d'un compte
 */
export class AccountLockedEvent implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly eventType: string
  public readonly occurredOn: Date
  public readonly eventVersion: number
  public readonly data: Record<string, any>

  constructor(
    public readonly userId: UserId | null,
    public readonly identifierHash: string,
    public readonly reason: string,
    public readonly lockedUntil: DateTime,
    public readonly lockedByIp: IpAddress,
    public readonly failureCount: number
  ) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = userId?.getValue().toString() || identifierHash
    this.eventType = 'account.locked'
    this.occurredOn = new Date()
    this.eventVersion = 1
    this.data = {
      userId: this.userId?.getValue() || null,
      identifierHash: this.identifierHash,
      reason: this.reason,
      lockedUntil: this.lockedUntil.toISO(),
      lockedByIp: this.lockedByIp.getValue(),
      failureCount: this.failureCount,
    }
  }

  getEventName(): string {
    return this.eventType
  }

  getEventData(): Record<string, any> {
    return this.data
  }
}
