/**
 * Base Domain Event Interface
 * All domain events must implement this interface
 */
export interface DomainEvent {
  /**
   * Unique identifier for the event
   */
  eventId: string

  /**
   * Aggregate ID that generated this event
   */
  aggregateId: string

  /**
   * Type of the event
   */
  eventType: string

  /**
   * Timestamp when the event occurred
   */
  occurredOn: Date

  /**
   * Version of the event schema
   */
  eventVersion: number

  /**
   * Event payload data
   */
  data: Record<string, any>
}
