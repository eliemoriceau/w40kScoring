import { DomainEvent } from '../../shared/aggregate_root.js'
import { UserId } from '../value_objects/user_id.js'
import { Username } from '../value_objects/username.js'
import { EmailAddress } from '../value_objects/email_address.js'
import { UserRole } from '../value_objects/user_role.js'

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    aggregateId: UserId,
    public readonly username: Username,
    public readonly email: EmailAddress,
    public readonly role: UserRole,
    public readonly newsletterConsent: boolean,
    public readonly termsAcceptedAt: Date
  ) {
    super(aggregateId.getValue())
  }

  eventName(): string {
    return 'user.registered'
  }

  getPayload() {
    return {
      userId: this.aggregateId,
      username: this.username.getValue(),
      email: this.email.getValue(),
      role: this.role.getValue(),
      newsletterConsent: this.newsletterConsent,
      termsAcceptedAt: this.termsAcceptedAt.toISOString(),
      occurredOn: this.occurredOn.toISOString(),
    }
  }
}
