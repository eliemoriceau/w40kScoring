# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


Tu es un développeur expert. Pour toute production de code, tu dois appliquer les principes suivants :
1. **Architecture hexagonale**
     
     * Structure le code selon le pattern "ports & adapters" :
            >
            >  * Distingue clairement les couches **domaine** (core), **application**, **infrastructure/adapters** et **interface utilisateur** si besoin.
    * Le domaine ne doit jamais dépendre des autres couches.
    * Les entrées/sorties (API, bases de données, services externes, etc.) doivent passer par des ports définis dans le domaine, implémentés via des adapters.
2. **Trunk based development**
     * Tout développement doit viser des incréments petits et testables.
* Préfère le découpage en petites branches de courte durée, intégrées fréquemment dans le tronc principal (branche principale).
* Evite les longues branches parallèles ou les intégrations tardives.
* Intègre les tests automatisés dès la création de chaque fonctionnalité/incrément.

 Pour chaque code généré :

 * Respecte la séparation des responsabilités.
 * Propose des exemples de structure de dossiers si pertinent.
 * Rédige des tests unitaires associés.
 * Documente brièvement les choix d’architecture appliqués.

 Ne jamais coupler le code métier directement à l’infrastructure ou à un framework externe.

## Development Commands

- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build the application for production
- `npm test` - Run all tests using Japa test runner
- `npm run lint` - Run ESLint for code quality checks
- `npm run format` - Format code using Prettier
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm start` - Start the production server
- `npm run commit` - Use commitizen for guided conventional commits

## Project Architecture

This is an AdonisJS 6 application with the following key architectural patterns:

### Backend Structure

- **Framework**: AdonisJS 6 with TypeScript
- **ORM**: Lucid ORM for database operations with PostgreSQL
- **Authentication**: Built-in AdonisJS auth system with Lucid provider
- **Validation**: VineJS for form data validation
- **Middleware Stack**: CORS, Shield, Session, Auth, and custom middleware
- **Path Mapping**: Uses `#` imports for clean module resolution (e.g., `#models/*`, `#controllers/*`)

### Frontend Structure

- **Framework**: Vue 3 with Inertia.js for SPA-like experience without building an API
- **Build Tool**: Vite with Vue plugin and AdonisJS integration
- **SSR**: Server-side rendering enabled via `inertia/app/ssr.ts`
- **Styling**: CSS with utility-first approach (appears to use Tailwind-style classes)
- **Path Mapping**: Uses `~/` for frontend imports pointing to `inertia/` directory

### Key Directories

- `app/` - Backend application code (models, middleware, exceptions)
- `inertia/` - Frontend Vue.js application code
- `config/` - Application configuration files
- `database/migrations/` - Database schema migrations
- `start/` - Application bootstrap files (routes, kernel)
- `tests/` - Test suites with unit and functional test support

### Database

- Uses PostgreSQL with Lucid ORM
- Migrations stored in `database/migrations/`
- Connection configured via environment variables

### Testing

- **Framework**: Japa test runner with AdonisJS plugin
- **Suites**: Unit tests (2s timeout) and functional tests (30s timeout)
- **Configuration**: Tests bootstrap from `tests/bootstrap.ts`
- **Test Files**: `tests/unit/**/*.spec(.ts|.js)` and `tests/functional/**/*.spec(.ts|.js)`

## Commit Standards

This project enforces Conventional Commits using:
- **Commitlint**: Validates commit messages against conventional commit format
- **Husky**: Git hooks for automatic commit message validation
- **Commitizen**: Interactive commit message creation with `npm run commit`
- ne t'attribue pas les commits

### Commit Types
- `feat`: New features
- `fix`: Bug fixes  
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Maintenance tasks
