# w40kScoring

Une application de scoring pour Warhammer 40,000 construite avec AdonisJS 6 et Vue 3.

## 🚀 Technologies

- **Backend**: AdonisJS 6 avec TypeScript
- **Frontend**: Vue 3 + Inertia.js
- **Base de données**: PostgreSQL avec Lucid ORM
- **Authentification**: Système d'auth AdonisJS intégré
- **Validation**: VineJS
- **Tests**: Japa
- **Build**: Vite
- **Styling**: CSS avec approche utility-first

## 📋 Prérequis

- Node.js (version recommandée : 18+)
- PostgreSQL
- npm ou yarn

## 🛠️ Installation

1. Cloner le repository :

```bash
git clone <repository-url>
cd w40kScoring
```

2. Installer les dépendances :

```bash
npm install
```

3. Configurer les variables d'environnement :

```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos paramètres de base de données :

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_DATABASE=w40k_scoring
```

4. Exécuter les migrations :

```bash
node ace migration:run
```

## 🏃‍♂️ Commandes de développement

```bash
# Démarrer le serveur de développement avec HMR
npm run dev

# Construire l'application pour la production
npm run build

# Démarrer le serveur de production
npm start

# Exécuter les tests
npm test

# Linter le code
npm run lint

# Formater le code
npm run format

# Vérification des types TypeScript
npm run typecheck
```

## 🏗️ Architecture

### Backend

- **Models**: Stockés dans `app/models/` (actuellement User)
- **Middleware**: Authentification, CORS, Shield, Session
- **Routes**: Définies dans `start/routes.ts`
- **Configuration**: Fichiers dans `config/`

### Frontend

- **Pages Vue**: `inertia/pages/`
- **Composants**: Structure Vue 3 avec Composition API
- **SSR**: Rendu côté serveur activé
- **Assets**: Gérés par Vite avec alias `~/`

### Base de données

- **ORM**: Lucid avec support des migrations
- **Migrations**: `database/migrations/`
- **Connexion**: PostgreSQL configurée via variables d'environnement

## 🧪 Tests

Le projet utilise Japa comme framework de tests avec deux suites :

- **Tests unitaires**: `tests/unit/**/*.spec(.ts|.js)` (timeout: 2s)
- **Tests fonctionnels**: `tests/functional/**/*.spec(.ts|.js)` (timeout: 30s)

```bash
# Exécuter tous les tests
npm test

# Exécuter une suite spécifique
node ace test --suite=unit
node ace test --suite=functional
```

## 🔧 Configuration

### Path Mapping

Le projet utilise des alias pour les imports :

- Backend: `#models/*`, `#controllers/*`, `#middleware/*`, etc.
- Frontend: `~/` pointe vers `inertia/`

### Middleware Stack

- Container bindings
- Static files
- CORS
- Vite integration
- Inertia.js
- Body parser
- Session management
- Shield security
- Auth initialization

## 📝 Développement

Le projet suit les conventions AdonisJS 6 avec :

- TypeScript pour la sécurité des types
- Inertia.js pour une expérience SPA sans API REST
- Middleware de sécurité intégré (Shield, CORS)
- Hot Module Replacement pour le développement
- Support SSR pour les performances

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence privée (UNLICENSED).
