Questions pour l'Implémentation

1. Relation JoueurService ↔ GameService :
   - garder une séparation stricte via repositories
2. Validation Partie Existante :
   - cette responsabilité appartient-elle au GameService
3. Gestion des Erreurs :
   Voici une proposition “craft” (Clean Code + DDD) pour gérer **pseudo dupliqué** et **conflits concurrents d’ajout**, en restant aligné avec AdonisJS v6 (Lucid), SQLite en dev et PostgreSQL en prod.

# 1) Codes d’erreur pour “pseudo dupliqué”

## Niveaux d’erreurs (sépare bien les couches)

- **Domaine (ubiquitous language)**
  - `UserNameAlreadyTaken` (erreur métier, indépendante du transport/DB)
  - Code métier (stable) : `USERNAME_TAKEN`

- **Transport HTTP**
  - **HTTP 409 Conflict**
  - **Problem Details** (RFC 7807/9457) en `application/problem+json`
    - `type`: `"https://your.api/problems/username-taken"` (URL documentaire)
    - `title`: `"Username already taken"`
    - `status`: `409`
    - `code`: `"USERNAME_TAKEN"` (votre code métier)
    - `detail`: message lisible (localisable)
    - `instance`: l’URI de la requête
    - `violations` (optionnel) : `[{ field: "username", reason: "already_taken" }]`

### Exemple de payload d’erreur HTTP

```json
{
  "type": "https://your.api/problems/username-taken",
  "title": "Username already taken",
  "status": 409,
  "code": "USERNAME_TAKEN",
  "detail": "The username is not available.",
  "violations": [{ "field": "username", "reason": "already_taken" }]
}
```

> Remarque :
>
> - Utilise `422 Unprocessable Entity` pour **erreurs de validation** (format invalide, longueur, caractères interdits).
> - Utilise `409 Conflict` **uniquement** pour l’unicité métier (déjà pris).

## Catalogue d’erreurs (centralisé)

Crée un **catalogue** (enum/objet) pour tous les codes métier :

```ts
export const DomainErrorCodes = {
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  // ...
} as const
```

Et des **classes d’erreurs** dédiées :

```ts
export class UserNameAlreadyTaken extends Error {
  public readonly code = DomainErrorCodes.USERNAME_TAKEN
  constructor(readonly username: string) {
    super('Username already taken')
  }
}
```

# 2) Prévenir/capturer le doublon (DB & domaine)

## Unicité au niveau **domaine**

- Normalise le pseudo **avant** persistance (ex. `lowercase`, trim, NFC).
- Décide clairement de la règle : **unicité insensible à la casse** (souvent souhaitée).
- Encapsule la règle dans un **Value Object** `Username` qui valide et normalise.

```ts
export class Username {
  private constructor(
    readonly value: string,
    readonly normalized: string
  ) {}
  static create(raw: string) {
    const v = raw?.trim()
    if (!v || v.length < 3) throw new Error('Invalid username') // ou DomainValidationError
    const norm = v.normalize('NFC').toLowerCase()
    return new Username(v, norm)
  }
}
```

## Unicité au niveau **base de données** (source de vérité)

- **PostgreSQL** (prod) :
  - Colonne générée ou index fonctionnel sur `lower(username)`
  - Contrainte UNIQUE (empêche les races)

- **SQLite** (dev) :
  - Colonne `username_norm` (remplie applicativement) + index UNIQUE

### Migration PostgreSQL (exemples)

```sql
-- Option 1: index fonctionnel
CREATE UNIQUE INDEX users_username_unique ON users (lower(username));

-- Option 2: colonne générée (12+) + unique
ALTER TABLE users ADD COLUMN username_norm text GENERATED ALWAYS AS (lower(username)) STORED;
CREATE UNIQUE INDEX users_username_norm_unique ON users (username_norm);
```

### Migration SQLite (dev)

```sql
ALTER TABLE users ADD COLUMN username_norm TEXT;
-- backfill à faire si data existante
CREATE UNIQUE INDEX users_username_norm_unique ON users (username_norm);
```

# 3) Gérer la concurrence d’ajout (race conditions)

Même si tu fais un “check avant insert”, deux requêtes peuvent passer entre le check et l’insert. La **seule protection fiable** est la **contrainte UNIQUE** en base. Stratégie :

1. **Tenter l’insert** (dans une transaction si nécessaire).
2. **Catcher l’erreur de contrainte** DB.
3. **Mapper** cette erreur en `UserNameAlreadyTaken` (domaine).
4. Côté HTTP, **mapper** ensuite en `409` Problem Details.

### AdonisJS (Lucid) — mapping d’erreurs DB

- **PostgreSQL** : code SQLSTATE `23505` (unique_violation).
- **SQLite** : erreur `SQLITE_CONSTRAINT_UNIQUE`.

```ts
import { DatabaseError } from 'pg' // si tu utilises le driver pg directement

async function createUser(repo: UserRepository, input: { username: string }) {
  const username = Username.create(input.username)
  try {
    return await repo.insert({ username: username.value, usernameNorm: username.normalized })
  } catch (e) {
    // Postgres
    if ((e as any).code === '23505') {
      throw new UserNameAlreadyTaken(username.value)
    }
    // SQLite
    if ((e as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new UserNameAlreadyTaken(username.value)
    }
    throw e
  }
}
```

### Pattern “upsert” contrôlé

- **PostgreSQL** : `INSERT ... ON CONFLICT (lower(username)) DO NOTHING RETURNING id`
  - Si `RETURNING` vide ⇒ déjà pris ⇒ lever `UserNameAlreadyTaken`.

- **SQLite** : `INSERT OR IGNORE` + vérification.

# 4) (Optionnel) Réduction du conflit applicatif

Selon la charge, tu peux **réduire** la probabilité de conflit :

- **Advisory lock** (PostgreSQL) sur le hash du pseudo pendant la transaction :

  ```sql
  SELECT pg_advisory_xact_lock(hashtext(lower($1)));
  -- puis INSERT
  ```

  Dans Adonis : un `db.rawQuery` au début du use-case.

- **Idempotency-Key** HTTP (utile contre les doublons suite à retries réseau)
  - Le client envoie un `Idempotency-Key` unique.
  - Tu stockes le couple `(key, result)` dans une table avec index UNIQUE sur `key`.
  - Une relivraison de la même requête retourne **le même résultat**, sans réexécuter la création.

# 5) DDD — structure claire (ports/adapters)

- **Domaine**
  - `Username` (VO), `User` (Aggregate), `UserRepository` (port)
  - `RegisterUser` (use case/service d’application) lève `UserNameAlreadyTaken`

- **Infrastructure (Adapter DB)**
  - `LucidUserRepository` implémente `UserRepository`
  - Mappe les erreurs DB ⇒ erreurs domaine

- **Interface (HTTP Controller)**
  - Mappe erreurs domaine ⇒ **Problem Details** HTTP

### Exemple rapide de contrôleur

```ts
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  constructor(private registerUser: RegisterUser) {}

  async store({ request, response }: HttpContext) {
    try {
      const { username } = request.only(['username'])
      const user = await this.registerUser.execute({ username })
      return response.created({ id: user.id })
    } catch (e) {
      if (e instanceof UserNameAlreadyTaken) {
        return response
          .status(409)
          .type('application/problem+json')
          .send({
            type: 'https://your.api/problems/username-taken',
            title: 'Username already taken',
            status: 409,
            code: 'USERNAME_TAKEN',
            detail: 'The username is not available.',
            violations: [{ field: 'username', reason: 'already_taken' }],
          })
      }
      throw e
    }
  }
}
```

# 6) Tests (TDD)

- **Unitaires (domaine)** :
  - `Username.create` (validation/normalisation)
  - `RegisterUser` lève `UserNameAlreadyTaken` si repo simule un conflit

- **Intégration (infra)** :
  - Contrainte UNIQUE effective (migrations)
  - Deux créations concurrentes ⇒ une seule réussit, l’autre ⇒ `USERNAME_TAKEN`

- **End-to-end (HTTP)** :
  - 1er POST `/users` ⇒ 201
  - 2e POST (même pseudo) ⇒ 409 Problem Details
  - Teste **Idempotency-Key** si activé

---

## TL;DR

- **Code métier** stable : `USERNAME_TAKEN` + erreur `UserNameAlreadyTaken`.
- **HTTP** : `409 Conflict` avec **Problem Details**.
- **Unicité** : normaliser au domaine **et** imposer **UNIQUE** en DB (`lower(username)`).
- **Concurrence** : se reposer sur la contrainte UNIQUE (mapper l’erreur DB), éventuellement advisory lock/idempotency.
- **DDD** : règle d’unicité dans un **VO**, mapping d’erreurs en **repository adapter**, contrôleur qui rend **Problem Details**.

4. Performance :
   - Pagination nécessaire pour listJoueurs() oui simple
   - Cache des pseudos par partie oui
5. Sécurité :
   - Autorisation : qui peut ajouter des joueurs à une partie l'owner de la partie
   - validation côté application
