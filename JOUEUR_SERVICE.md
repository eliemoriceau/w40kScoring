# JoueurService - Documentation Technique

## 🎯 Vue d'Ensemble

Le **JoueurService** implémente la gestion des joueurs dans les parties selon l'architecture hexagonale et les principes DDD. Il permet d'ajouter et de lister des joueurs avec validation métier stricte et autorisation par propriétaire.

## 🏗️ Architecture

### Couches DDD

- **Domain** : Erreurs métier (`PseudoAlreadyTakenError`, `UnauthorizedPartieAccessError`)
- **Application** : DTOs, Mapper, JoueurService
- **Infrastructure** : Réutilise les repositories Player/Game existants

### Flux de Données (Hexagonal)

```
HTTP Request → JoueurService → PlayerRepository → Domain Entity → DB
     ↓              ↓               ↓              ↓
  DTOs      Business Logic    Domain Rules   Contraintes UNIQUE
```

## 🚀 API du Service

### `addJoueur(dto: AddJoueurDto): Promise<JoueurResponseDto>`

Ajoute un joueur à une partie avec validation complète.

**Paramètres** :

```typescript
interface AddJoueurDto {
  partieId: string // ID de la partie
  pseudo: string // Pseudo (2-20 chars)
  userId?: number // Optionnel (null = guest)
  requestingUserId: number // Pour autorisation
}
```

**Règles Métier** :

- ✅ Autorisation : seul le propriétaire peut ajouter des joueurs
- ✅ Pseudo unique par partie (insensible à la casse)
- ✅ Guest players supportés (userId = null)
- ✅ Validation format et longueur

**Erreurs** :

- `PseudoAlreadyTakenError` : Pseudo déjà utilisé
- `UnauthorizedPartieAccessError` : Utilisateur non autorisé
- `PartieNotFoundError` : Partie inexistante

---

### `listJoueurs(partieId: string, requestingUserId: number): Promise<JoueurListResponseDto>`

Liste les joueurs d'une partie avec pagination.

**Autorisation** : Propriétaire OU participant à la partie

**Retour** :

```typescript
interface JoueurListResponseDto {
  joueurs: JoueurResponseDto[]
  pagination: {
    hasMore: boolean
    total: number
  }
}

interface JoueurResponseDto {
  id: string
  partieId: string
  pseudo: string
  userId?: number
  isGuest: boolean
  isOwner: boolean // Si c'est le créateur de la partie
  createdAt: Date
}
```

## 🔒 Sécurité & Autorisation

### Règles d'Accès

- **Ajout** : Seul le propriétaire de la partie
- **Lecture** : Propriétaire OU participant à la partie

### Gestion d'Erreurs Craft

- **HTTP 409 Conflict** + Problem Details RFC 7807 pour pseudos dupliqués
- **HTTP 403 Forbidden** pour accès non autorisé
- **HTTP 404 Not Found** pour parties inexistantes

## 🧪 Tests & Validation

### Couverture TDD Complète

- ✅ 9 tests unitaires JoueurService
- ✅ 8 tests validation DTOs
- ✅ Mocks repositories avec validation métier
- ✅ Tests autorisation et gestion d'erreurs
- ✅ Tests race conditions et edge cases

### Exécution

```bash
npm test -- --grep "JoueurService|AddJoueurDtoFactory"
```

## 🔧 Utilisation

### Exemple d'Ajout

```typescript
const joueurService = container.resolve('JoueurService')

const dto: AddJoueurDto = {
  partieId: '123',
  pseudo: 'ProPlayer',
  userId: 456, // Optionnel pour guest
  requestingUserId: 789, // Owner ID
}

try {
  const joueur = await joueurService.addJoueur(dto)
  console.log(`Joueur ${joueur.pseudo} ajouté!`)
} catch (error) {
  if (error instanceof PseudoAlreadyTakenError) {
    // Gérer pseudo dupliqué
  }
}
```

### Exemple de Liste

```typescript
const result = await joueurService.listJoueurs('123', requestingUserId)
console.log(`${result.joueurs.length} joueurs trouvés`)
```

## 🎯 Règles Métier

### Validation Pseudo

- **Longueur** : 2-20 caractères
- **Unicité** : Par partie (insensible à la casse)
- **Format** : Alphanumerique + caractères spéciaux autorisés

### Types de Joueurs

- **Registered** : userId fourni, lié à un compte utilisateur
- **Guest** : userId = null, joueur invité temporaire

### Propriété Partie

- Seul le propriétaire (creator) peut ajouter des joueurs
- Propriétaires et participants peuvent lister les joueurs

---

_Documentation générée pour l'issue #15 - Service hexagonal Joueur_
