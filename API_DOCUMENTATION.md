# 📖 API Documentation - W40K Scoring

Guide complet de l'API W40K Scoring pour développeurs frontend et intégrations.

## 🎯 Vue d'ensemble

L'application utilise **Inertia.js** pour une approche hybride SPA/SSR, mais expose également des endpoints API pour certaines fonctionnalités.

### Architecture
- **Backend**: AdonisJS 6 avec TypeScript
- **Frontend**: Vue 3 + Inertia.js  
- **Authentification**: Session-based avec support CSRF
- **Validation**: VineJS avec messages d'erreur structurés

## 🔐 Authentification

### Session-based Authentication

```typescript
// Login endpoint
POST /login
Content-Type: application/json
X-CSRF-TOKEN: <token>

{
  "email": "player@example.com",
  "password": "securepassword"
}

// Response
{
  "success": true,
  "user": {
    "id": 1,
    "email": "player@example.com",
    "role": "PLAYER"
  }
}
```

### Protection CSRF

```javascript
// Récupération du token CSRF
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

// Headers requis
headers: {
  'X-CSRF-TOKEN': csrfToken,
  'Content-Type': 'application/json'
}
```

## 🎮 Endpoints de Jeu

### Création de Partie

```http
POST /parties/create
Authorization: Authenticated User
Content-Type: application/json

{
  "gameType": "MATCHED_PLAY",
  "pointsLimit": 2000,
  "primaryScoringMethod": "FIXED",
  "deploymentZone": "STANDARD",
  "players": [
    {
      "pseudo": "PlayerOne",
      "userId": 1
    },
    {
      "pseudo": "GuestPlayer", 
      "isGuest": true
    }
  ]
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "gameId": "01234567-89ab-cdef-0123-456789abcdef",
  "message": "Partie créée avec succès"
}
```

### Liste des Parties

```http
GET /parties/data
Authorization: Authenticated User
Query Parameters:
- page?: number (default: 1)
- limit?: number (default: 10, max: 50)
- status?: GameStatus ('DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED')
- gameType?: GameType ('MATCHED_PLAY' | 'NARRATIVE' | 'OPEN_PLAY')
```

**Response**:
```json
{
  "data": [
    {
      "id": "01234567-89ab-cdef-0123-456789abcdef",
      "gameType": "MATCHED_PLAY",
      "status": "IN_PROGRESS",
      "pointsLimit": 2000,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "players": [
        {
          "pseudo": "PlayerOne",
          "totalScore": 45,
          "isGuest": false
        }
      ],
      "currentRound": 3
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 25,
    "lastPage": 3
  }
}
```

### Détails d'une Partie

```http
GET /parties/{gameId}
Authorization: Authenticated User + Game Access
```

**Response**:
```json
{
  "game": {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "gameType": "MATCHED_PLAY",
    "status": "IN_PROGRESS",
    "pointsLimit": 2000,
    "primaryScoringMethod": "FIXED",
    "deploymentZone": "STANDARD",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:15:00.000Z"
  },
  "players": [
    {
      "id": "player-id-1",
      "pseudo": "PlayerOne", 
      "totalScore": 67,
      "isGuest": false,
      "userId": 1
    }
  ],
  "rounds": [
    {
      "id": "round-id-1",
      "roundNumber": 1,
      "status": "COMPLETED",
      "scores": [
        {
          "id": "score-id-1",
          "playerId": "player-id-1",
          "scoreType": "PRIMARY",
          "value": 15,
          "name": null
        }
      ]
    }
  ]
}
```

### Mise à jour des Scores

```http
PUT /parties/{gameId}/rounds/{roundId}/score
Authorization: Authenticated User + Game Access
Content-Type: application/json

{
  "playerId": "player-id-1",
  "scoreType": "SECONDARY", 
  "value": 12,
  "name": "Investigate Sites"
}
```

**Response**:
```json
{
  "success": true,
  "score": {
    "id": "new-score-id",
    "playerId": "player-id-1",
    "scoreType": "SECONDARY",
    "value": 12,
    "name": "Investigate Sites"
  },
  "playerTotal": 79
}
```

## 👥 Endpoints Utilisateur

### Recherche d'Utilisateurs

```http
GET /api/users/search
Authorization: Authenticated User
Query Parameters:
- q: string (minimum 2 caractères)
- limit?: number (default: 10, max: 20)
```

**Response**:
```json
{
  "users": [
    {
      "id": 1,
      "email": "player@example.com",
      "pseudo": "PlayerOne",
      "lastLoginAt": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

## 🔧 Admin API

### Statistiques de Partie

```http
GET /admin/parties/stats  
Authorization: Admin User (role >= ADMIN)
```

**Response**:
```json
{
  "totalGames": 145,
  "activeGames": 23,
  "completedGames": 122,
  "averageGameDuration": "2.5 hours",
  "popularGameTypes": {
    "MATCHED_PLAY": 89,
    "NARRATIVE": 34,
    "OPEN_PLAY": 22
  }
}
```

### Gestion des Utilisateurs

```http
GET /admin/users
Authorization: Admin User
Query Parameters:
- page?: number
- search?: string
- role?: UserRole
```

```http
PUT /admin/users/{userId}/role
Authorization: Admin User
Content-Type: application/json

{
  "role": "MODERATOR"
}
```

## 📊 Types de Données

### GameStatus
```typescript
type GameStatus = 
  | 'DRAFT'      // Partie en cours de création
  | 'IN_PROGRESS'// Partie en cours
  | 'COMPLETED'  // Partie terminée  
  | 'CANCELLED'  // Partie annulée
```

### GameType
```typescript
type GameType = 
  | 'MATCHED_PLAY'  // Compétitif
  | 'NARRATIVE'     // Narratif
  | 'OPEN_PLAY'     // Libre
```

### ScoreType
```typescript
type ScoreType = 
  | 'PRIMARY'     // Score principal
  | 'SECONDARY'   // Objectif secondaire
  | 'OBJECTIVE'   // Objectif de mission
  | 'BONUS'       // Points bonus
  | 'PENALTY'     // Pénalité
```

### UserRole
```typescript
type UserRole = 
  | 'PLAYER'      // Joueur standard
  | 'MODERATOR'   // Modérateur
  | 'ADMIN'       // Administrateur
  | 'SUPER_ADMIN' // Super administrateur
```

## ⚠️ Codes d'Erreur

### Codes HTTP Standards
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation échouée)
- `401` - Unauthorized (non connecté)
- `403` - Forbidden (permissions insuffisantes)
- `404` - Not Found
- `422` - Unprocessable Entity (données invalides)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Erreurs Métier
```json
{
  "error": {
    "code": "PSEUDO_ALREADY_TAKEN",
    "message": "Ce pseudo est déjà utilisé dans cette partie",
    "field": "pseudo"
  }
}
```

**Codes d'erreur spécifiques**:
- `PSEUDO_ALREADY_TAKEN` - Pseudo déjà pris
- `GAME_NOT_FOUND` - Partie non trouvée
- `UNAUTHORIZED_GAME_ACCESS` - Accès non autorisé
- `ROUND_NOT_FOUND` - Round non trouvé
- `INVALID_SCORE_VALUE` - Valeur de score invalide
- `ROUND_ALREADY_COMPLETED` - Round déjà terminé

## 🔒 Rate Limiting

### Limites par Endpoint
- **Login**: 5 tentatives/minute
- **API Calls**: 100 requêtes/minute
- **Search**: 20 requêtes/minute
- **Score Updates**: 30 requêtes/minute

### Headers de Rate Limiting
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642234567
```

## 🧪 Exemples d'Usage

### JavaScript/TypeScript Client

```typescript
class W40KApiClient {
  private baseUrl: string;
  private csrfToken: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.csrfToken = this.getCsrfToken();
  }

  private getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.content || '';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-CSRF-TOKEN': this.csrfToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important pour les sessions
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async createGame(gameData: GameCreationData) {
    return this.request('/parties/create', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  async updateScore(gameId: string, roundId: string, scoreData: ScoreUpdateData) {
    return this.request(`/parties/${gameId}/rounds/${roundId}/score`, {
      method: 'PUT', 
      body: JSON.stringify(scoreData),
    });
  }
}
```

### Vue 3 Composable

```typescript
import { ref, computed } from 'vue'
import { router } from '@inertiajs/vue3'

export function useGameApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const updateScore = async (gameId: string, roundId: string, scoreData: any) => {
    loading.value = true
    error.value = null
    
    try {
      await router.put(`/parties/${gameId}/rounds/${roundId}/score`, scoreData, {
        preserveState: true,
        preserveScroll: true,
        onError: (errors) => {
          error.value = Object.values(errors)[0] as string
        }
      })
    } finally {
      loading.value = false
    }
  }

  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    updateScore
  }
}
```

## 📚 Ressources Complémentaires

### Validation Schemas

Voir `app/validators/` pour les schémas de validation VineJS complets.

### Types TypeScript

Voir `app/types/` et `inertia/pages/parties/types.ts` pour les définitions de types.

### Tests d'API

Voir `tests/functional/` pour des exemples d'utilisation et de tests.

---

**Documentation API W40K Scoring** - Version 1.0  
*Mise à jour: Janvier 2025*