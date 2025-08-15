import { DomainEvent } from '../../events/domain_event.js'
import { UserId } from '../../user/value_objects/user_id.js'
import { IpAddress } from '../value_objects/ip_address.js'

/**
 * Event domaine déclenché lors d'une connexion utilisateur réussie
 */
export class UserLoggedInEvent implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly eventType: string
  public readonly occurredOn: Date
  public readonly eventVersion: number
  public readonly data: Record<string, any>

  constructor(
    public readonly userId: UserId,
    public readonly loginMethod: 'email' | 'username',
    public readonly ipAddress: IpAddress,
    public readonly userAgent: string | null,
    public readonly rememberMe: boolean,
    public readonly deviceId: string | null = null
  ) {
    this.eventId = crypto.randomUUID()
    this.aggregateId = userId.getValue().toString()
    this.eventType = 'user.logged_in'
    this.occurredOn = new Date()
    this.eventVersion = 1
    this.data = {
      userId: this.userId.getValue(),
      loginMethod: this.loginMethod,
      ipAddress: this.ipAddress.getValue(),
      userAgent: this.userAgent,
      rememberMe: this.rememberMe,
      deviceId: this.deviceId,
    }
  }

  getEventName(): string {
    return this.eventType
  }

  getEventData(): Record<string, any> {
    return this.data
  }
}
