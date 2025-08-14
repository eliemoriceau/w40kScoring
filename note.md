1. Architecture Domain Layer

- Username vs Pseudo unifier
- Entité User Domain :  créer une entité User dans le domain layer

2. Rôles et Permissions

- Enum Roles :  USER, ADMIN, MODERATOR
- Table séparée : Rôles dans une table roles avec relation

3. Validation Business Rules

- Username unique globalement : Ou juste unique
- Email format : Validation simple
- Password policy : Juste 8 chars minimum

4. UX/UI Flow

- Page register : Formulaire simple
- Après registration : Redirection /parties
- Terms of Service : modal inline
