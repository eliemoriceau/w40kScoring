export abstract class DomainEvent {
  public readonly occurredOn: Date
  public readonly aggregateId: string | number

  constructor(aggregateId: string | number) {
    this.aggregateId = aggregateId
    this.occurredOn = new Date()
  }

  abstract eventName(): string
}

export abstract class AggregateRoot<TId> {
  private _domainEvents: DomainEvent[] = []

  constructor(protected readonly id: TId) {}

  getId(): TId {
    return this.id
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents]
  }

  public clearDomainEvents(): void {
    this._domainEvents = []
  }

  public equals(other: AggregateRoot<TId>): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false
    }
    return this.id === other.id
  }
}
