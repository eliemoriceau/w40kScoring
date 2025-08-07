# Player Domain Documentation

## Overview

The Player domain represents players participating in Warhammer 40K games. It follows Domain-Driven Design (DDD) patterns with hexagonal architecture, providing a clean separation between domain logic and infrastructure concerns.

## Architecture

The Player domain is implemented following these architectural patterns:

- **Domain-Driven Design (DDD)**: Tactical patterns including entities, value objects, domain events, and aggregates
- **Hexagonal Architecture**: Clean separation between domain and infrastructure layers
- **CQRS**: Command Query Responsibility Segregation for repository operations
- **Test-Driven Development**: Comprehensive unit tests with 82 passing tests

## Domain Components

### Value Objects

#### PlayerId

- **Purpose**: Unique identifier for players
- **Validation**: Must be positive integer
- **Location**: `app/domain/value-objects/player_id.ts`
- **Tests**: `tests/unit/domain/value-objects/player_id.spec.ts`

```typescript
const playerId = new PlayerId(1) // Valid
const invalidId = new PlayerId(0) // Throws error
```

#### Pseudo

- **Purpose**: Player display name with business rules
- **Validation**:
  - Length: 3-50 characters
  - Characters: Alphanumeric, spaces, hyphens, underscores
  - Automatic trimming of whitespace
- **Location**: `app/domain/value-objects/pseudo.ts`
- **Tests**: `tests/unit/domain/value-objects/pseudo.spec.ts`

```typescript
const pseudo = new Pseudo('PlayerName123') // Valid
const trimmed = new Pseudo('  Player  ') // Auto-trimmed to "Player"
const invalid = new Pseudo('AB') // Throws error (too short)
```

### Domain Events

The Player domain publishes three domain events:

#### PlayerCreatedEvent

- **Triggered**: When a new player is created
- **Data**: PlayerId, GameId, UserId (nullable), Pseudo
- **Location**: `app/domain/events/player_created_event.ts`

#### PlayerPseudoChangedEvent

- **Triggered**: When player changes their display name
- **Data**: PlayerId, OldPseudo, NewPseudo
- **Location**: `app/domain/events/player_pseudo_changed_event.ts`

#### PlayerLinkedToUserEvent

- **Triggered**: When guest player links to user account
- **Data**: PlayerId, UserId
- **Location**: `app/domain/events/player_linked_to_user_event.ts`

### Aggregate Root

#### Player Entity

- **Purpose**: Main aggregate root for player domain
- **Location**: `app/domain/entities/player.ts`
- **Tests**: `tests/unit/domain/entities/player.spec.ts`

**Factory Methods:**

```typescript
// Create registered player
const player = Player.createForRegisteredUser(
  new PlayerId(1),
  new GameId(1),
  123, // userId
  new Pseudo('PlayerName')
)

// Create guest player
const guest = Player.createForGuest(new PlayerId(2), new GameId(1), new Pseudo('GuestName'))

// Reconstruct from persistence
const reconstructed = Player.reconstruct({
  id: new PlayerId(1),
  gameId: new GameId(1),
  userId: 123,
  pseudo: new Pseudo('PlayerName'),
  createdAt: new Date(),
})
```

**Business Methods:**

```typescript
player.changePseudo(new Pseudo('NewName')) // Raises PlayerPseudoChangedEvent
player.linkToUser(456) // Raises PlayerLinkedToUserEvent (guest only)
```

**Properties:**

- `isGuest`: Boolean indicating if player is not linked to user account
- Domain event collection for publishing state changes

## Repository Pattern (CQRS)

### Interfaces (Domain Layer)

#### PlayerQueryRepository

- **Purpose**: Read-only operations
- **Location**: `app/domain/repositories/player_query_repository.ts`
- **Methods**: `findById`, `findByGameId`, `findByUserId`, `exists`, `isPseudoTakenInGame`, etc.

#### PlayerCommandRepository

- **Purpose**: Write operations
- **Location**: `app/domain/repositories/player_command_repository.ts`
- **Methods**: `save`, `delete`, `saveBatch`, `deleteByGameId`

#### PlayerRepository

- **Purpose**: Combined interface (backward compatibility)
- **Location**: `app/domain/repositories/player_repository.ts`
- **Note**: Deprecated in favor of separated CQRS repositories

### Infrastructure Implementations

#### LucidPlayerQueryRepository

- **Purpose**: Lucid ORM implementation for queries
- **Location**: `app/infrastructure/repositories/lucid_player_query_repository.ts`
- **Features**: Domain entity conversion, optimized queries

#### LucidPlayerCommandRepository

- **Purpose**: Lucid ORM implementation for commands
- **Location**: `app/infrastructure/repositories/lucid_player_command_repository.ts`
- **Features**: Transaction support, domain entity conversion

#### LucidPlayerRepository

- **Purpose**: Combined adapter (backward compatibility)
- **Location**: `app/infrastructure/repositories/lucid_player_repository.ts`

## Data Persistence

### Database Schema

#### Players Table

- **Migration**: `database/migrations/*_create_players_table.ts`
- **Model**: `app/models/player.ts`

```sql
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  pseudo VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NULL,

  UNIQUE(game_id, pseudo), -- Pseudo unique per game
  UNIQUE(game_id, user_id) -- User can only play once per game
);
```

**Indexes for Performance:**

- `game_id` - Find players by game
- `user_id` - Find games by user
- `(game_id, pseudo)` - Unique constraint and search
- `(game_id, user_id)` - Unique constraint

### Relationships

```typescript
// Player belongs to Game
@belongsTo(() => Game)
declare game: BelongsTo<typeof Game>

// Player belongs to User (nullable for guests)
@belongsTo(() => User)
declare user: BelongsTo<typeof User>
```

## Business Rules

1. **Pseudo Uniqueness**: Player pseudos must be unique within each game
2. **User Participation**: A user can only participate once per game
3. **Guest Players**: Players can exist without user accounts
4. **Pseudo Validation**: Display names must be 3-50 characters with valid characters
5. **Player Linking**: Guest players can be linked to user accounts

## Testing Strategy

### Test Coverage

- **Unit Tests**: 82 passing tests covering all domain logic
- **Test Factory**: Helper class for creating test data
- **Integration Tests**: Repository implementations (require database)

### Test Helpers

#### PlayerFactory

- **Location**: `tests/helpers/player_factory.ts`
- **Features**: Convenient methods for creating test players

```typescript
// Create registered player with defaults
const player = PlayerFactory.createRegisteredPlayer()

// Create guest player
const guest = PlayerFactory.createGuestPlayer()

// Create batch of players
const players = PlayerFactory.createBatch(5, {
  gameId: new GameId(1),
  pseudoPrefix: 'TestPlayer',
})
```

## Usage Examples

### Creating Players

```typescript
import Player from '#domain/entities/player'
import PlayerId from '#domain/value-objects/player_id'
import GameId from '#domain/value-objects/game_id'
import Pseudo from '#domain/value-objects/pseudo'

// Create registered player
const registeredPlayer = Player.createForRegisteredUser(
  new PlayerId(1),
  new GameId(1),
  123, // userId
  new Pseudo('WarhammerFan42')
)

// Create guest player
const guestPlayer = Player.createForGuest(new PlayerId(2), new GameId(1), new Pseudo('GuestPlayer'))
```

### Repository Operations

```typescript
import LucidPlayerQueryRepository from '#infrastructure/repositories/lucid_player_query_repository'
import LucidPlayerCommandRepository from '#infrastructure/repositories/lucid_player_command_repository'

const queryRepo = new LucidPlayerQueryRepository()
const commandRepo = new LucidPlayerCommandRepository()

// Save player
const savedPlayer = await commandRepo.save(player)

// Find by ID
const foundPlayer = await queryRepo.findById(new PlayerId(1))

// Find players in game
const gamePlayers = await queryRepo.findByGameId(new GameId(1))

// Check if pseudo is taken
const isTaken = await queryRepo.isPseudoTakenInGame(new GameId(1), 'TakenPseudo')
```

### Domain Events

```typescript
// Listen for domain events
const player = Player.createForRegisteredUser(id, gameId, userId, pseudo)
const events = player.getUncommittedEvents()

events.forEach((event) => {
  if (event.eventType === 'PlayerCreated') {
    console.log(`Player ${event.pseudo} created for game ${event.gameId}`)
  }
})
```

## File Structure

```
app/
├── domain/
│   ├── entities/
│   │   └── player.ts                    # Player aggregate root
│   ├── events/
│   │   ├── player_created_event.ts      # Domain events
│   │   ├── player_pseudo_changed_event.ts
│   │   └── player_linked_to_user_event.ts
│   ├── repositories/
│   │   ├── player_repository.ts         # Combined interface
│   │   ├── player_query_repository.ts   # Query operations
│   │   └── player_command_repository.ts # Command operations
│   └── value-objects/
│       ├── player_id.ts                 # Player identifier
│       └── pseudo.ts                    # Player display name
├── infrastructure/
│   └── repositories/
│       ├── lucid_player_repository.ts         # Combined adapter
│       ├── lucid_player_query_repository.ts   # Query adapter
│       └── lucid_player_command_repository.ts # Command adapter
├── models/
│   └── player.ts                        # Lucid ORM model
├── database/
│   └── migrations/
│       └── *_create_players_table.ts    # Database migration
└── tests/
    ├── unit/domain/
    │   ├── entities/player.spec.ts      # Entity tests
    │   └── value-objects/
    │       ├── player_id.spec.ts        # Value object tests
    │       └── pseudo.spec.ts
    ├── functional/repositories/
    │   └── player_repository.spec.ts    # Integration tests
    └── helpers/
        └── player_factory.ts            # Test data factory
```

## Performance Considerations

1. **Database Indexes**: Strategically placed on frequently queried columns
2. **Query Optimization**: Separate read/write repositories for CQRS benefits
3. **Batch Operations**: `saveBatch()` method for bulk inserts
4. **Lazy Loading**: Relationships loaded only when needed

## Security Considerations

1. **Input Validation**: All player inputs validated through value objects
2. **SQL Injection**: Protection via Lucid ORM parameterized queries
3. **Business Rules**: Domain logic prevents invalid state transitions
4. **Access Control**: Repository layer can be extended with authorization

## Future Enhancements

1. **Application Layer**: Commands and queries for use cases
2. **Event Sourcing**: Store domain events for audit trail
3. **Performance Metrics**: Player statistics and achievements
4. **Internationalization**: Multi-language support for pseudos
5. **Player Profiles**: Extended player information and preferences
