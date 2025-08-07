import { DomainEvent } from './events/domain_event.js'

/**
 * AggregateRoot Base Class
 * Provides domain event handling capabilities
 */
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = []

  /**
   * Add a domain event to be published
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  /**
   * Get all unpublished domain events
   */
  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents]
  }

  /**
   * Clear all domain events (typically called after publishing)
   */
  clearDomainEvents(): void {
    this._domainEvents = []
  }

  /**
   * Check if there are unpublished domain events
   */
  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0
  }
}
