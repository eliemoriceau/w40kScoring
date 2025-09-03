# 🔒 Security & Authentication Guide - W40K Scoring

Guide complet de sécurité, authentification et bonnes pratiques pour W40K Scoring.

## 🎯 Vue d'ensemble de la Sécurité

### Architecture de Sécurité
- **Authentification**: Session-based avec Lucid provider
- **Autorisation**: Role-based access control (RBAC)
- **Protection CSRF**: Tokens automatiques AdonisJS Shield
- **Rate Limiting**: Middleware personnalisé avec backoff exponentiel
- **Validation**: VineJS avec sanitisation automatique
- **Logs de Sécurité**: Winston avec rotation automatique

### Niveaux de Sécurité
```typescript
enum SecurityLevel {
  PUBLIC = 0,      // Accès libre
  AUTHENTICATED = 1, // Utilisateur connecté
  PLAYER = 2,      // Joueur standard
  MODERATOR = 3,   // Modérateur
  ADMIN = 4,       // Administrateur
  SUPER_ADMIN = 5  // Super administrateur
}
```

## 🔐 Système d'Authentification

### Session-based Authentication

```typescript
// Configuration dans config/auth.ts
guards: {
  web: {
    driver: 'session',
    provider: {
      driver: 'lucid',
      identifierKey: 'email',
      model: () => import('#models/user')
    }
  }
}
```

### Processus de Login

1. **Validation des Credentials**
2. **Vérification Rate Limiting**
3. **Vérification Account Lock**
4. **Authentication Service**
5. **Session Creation**
6. **Security Logging**

```typescript
// Service d'authentification sécurisé
class SecureUserAuthenticationService {
  async authenticate(credentials: LoginCredentials): Promise<LoginResponseDto> {
    // 1. Validation email/password
    const user = await this.validateCredentials(credentials)
    
    // 2. Vérification verrouillage compte
    await this.checkAccountLock(credentials.email)
    
    // 3. Authentification
    const result = await this.performAuthentication(user, credentials)
    
    // 4. Log sécuritaire
    await this.logSecurityEvent('USER_LOGIN_SUCCESS', user.id)
    
    return result
  }
}
```

### Protection Brute Force

```typescript
// Middleware de limitation des tentatives
class LoginBackoffMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const attempts = await this.getLoginAttempts(ctx.request.ip())
    
    if (attempts >= 5) {
      // Backoff exponentiel: 2^attempts secondes
      const backoffTime = Math.pow(2, attempts - 5) * 1000
      throw new TooManyRequestsException(`Retry in ${backoffTime}ms`)
    }
    
    await next()
  }
}
```

## 👥 Système d'Autorisation (RBAC)

### Rôles et Permissions

```typescript
// Hiérarchie des rôles
const ROLE_HIERARCHY = {
  SUPER_ADMIN: 5, // Accès total
  ADMIN: 4,       // Gestion utilisateurs, parties, analytics
  MODERATOR: 3,   // Modération contenu, gestion parties
  PLAYER: 2,      // Création parties, scores
  GUEST: 1        // Lecture seule
}

// Permissions par rôle
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'], // Toutes permissions
  ADMIN: [
    'admin.dashboard.view',
    'admin.users.manage',
    'admin.parties.manage',
    'admin.analytics.view'
  ],
  MODERATOR: [
    'parties.moderate',
    'users.moderate',
    'reports.handle'
  ],
  PLAYER: [
    'parties.create',
    'parties.join', 
    'scores.update'
  ]
}
```

### Middleware d'Autorisation

```typescript
// Vérification des permissions
class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, permission: string) {
    const user = ctx.auth.user!
    const hasPermission = await this.checkPermission(user, permission)
    
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions')
    }
    
    await next()
  }
}

// Utilisation dans les routes
router
  .group(() => {
    router.get('/admin/users', [AdminUsersController, 'index'])
  })
  .middleware([
    middleware.auth(),
    middleware.permission('admin.users.view')
  ])
```

### Policies de Sécurité

```typescript
// Politique d'accès aux parties
class PartiePolicy {
  async canView(user: User, partie: Game): Promise<boolean> {
    // 1. Admin peut tout voir
    if (user.role >= UserRole.ADMIN) return true
    
    // 2. Joueur peut voir ses parties
    const isPlayer = await this.isPlayerInGame(user.id, partie.id)
    if (isPlayer) return true
    
    // 3. Parties publiques visibles
    return partie.isPublic
  }
  
  async canEdit(user: User, partie: Game): Promise<boolean> {
    // Seuls les joueurs de la partie peuvent modifier
    return await this.isPlayerInGame(user.id, partie.id)
  }
}
```

## 🛡️ Protection CSRF

### Configuration Shield

```typescript
// config/shield.ts
csrf: {
  enabled: true,
  exceptRoutes: [
    '/api/webhook/*', // Exceptions pour webhooks
  ],
  enableXsrfCookie: true,
  methods: ['POST', 'PUT', 'PATCH', 'DELETE']
}
```

### Usage Frontend (Vue/Inertia)

```typescript
// Récupération automatique du token CSRF
import { usePage } from '@inertiajs/vue3'

export function useCsrfToken() {
  const page = usePage()
  return page.props.csrfToken || 
         document.querySelector('meta[name="csrf-token"]')?.content
}

// Usage dans les requêtes
const csrfToken = useCsrfToken()
await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-TOKEN': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
```

## 🚦 Rate Limiting

### Configuration Multi-niveaux

```typescript
// Différents types de rate limiting
const RATE_LIMITS = {
  // Authentification stricte
  LOGIN: {
    max: 5,           // 5 tentatives
    windowMs: 60000,  // par minute
    skipSuccessful: false
  },
  
  // API standard
  API: {
    max: 100,         // 100 requêtes
    windowMs: 60000,  // par minute
    skipSuccessful: true
  },
  
  // Opérations sensibles
  SCORE_UPDATE: {
    max: 30,          // 30 mises à jour
    windowMs: 60000,  // par minute
    delayAfter: 15,   // Delay après 15 requêtes
    delayMs: 500      // 500ms de délai
  }
}
```

### Rate Limiter Personnalisé

```typescript
class EnhancedRateLimitMiddleware {
  private store = new Map<string, RateLimitInfo>()
  
  async handle(ctx: HttpContext, next: NextFn, options: RateLimitOptions) {
    const key = this.generateKey(ctx)
    const limit = this.getOrCreateLimit(key, options)
    
    // Vérification limite
    if (limit.count >= options.max) {
      // Backoff exponentiel pour attaques répétées
      const backoffMs = this.calculateBackoff(limit.violations)
      
      ctx.response.header('X-RateLimit-Limit', options.max)
      ctx.response.header('X-RateLimit-Remaining', 0)
      ctx.response.header('Retry-After', Math.ceil(backoffMs / 1000))
      
      throw new TooManyRequestsException(`Rate limit exceeded. Retry in ${backoffMs}ms`)
    }
    
    // Incrémenter compteur
    limit.count++
    ctx.response.header('X-RateLimit-Limit', options.max)
    ctx.response.header('X-RateLimit-Remaining', options.max - limit.count)
    
    await next()
  }
  
  private calculateBackoff(violations: number): number {
    // Backoff exponentiel: min(2^violations * 1000, 60000)
    return Math.min(Math.pow(2, violations) * 1000, 60000)
  }
}
```

## 🔍 Validation et Sanitisation

### Validation VineJS Sécurisée

```typescript
// Validateur pour création de partie
export const gameCreationValidator = vine.compile(
  vine.object({
    gameType: vine.enum(GameType),
    pointsLimit: vine.number()
      .min(500)    // Minimum W40K standard
      .max(5000),  // Maximum raisonnable
    
    // Sanitisation des pseudos
    players: vine.array(
      vine.object({
        pseudo: vine.string()
          .trim()                    // Suppression espaces
          .minLength(2)
          .maxLength(30)
          .regex(/^[a-zA-Z0-9_\-\s]+$/), // Caractères autorisés seulement
        
        isGuest: vine.boolean().optional()
      })
    ).minLength(2).maxLength(8) // 2-8 joueurs max
  })
)
```

### Sanitisation Automatique

```typescript
// Middleware de sanitisation
class SanitizationMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Sanitisation des paramètres de requête
    this.sanitizeQuery(ctx.request.qs())
    
    // Sanitisation du body
    if (ctx.request.hasBody()) {
      this.sanitizeBody(ctx.request.body())
    }
    
    await next()
  }
  
  private sanitizeBody(body: any) {
    if (typeof body === 'object') {
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === 'string') {
          // Suppression caractères dangereux
          body[key] = this.sanitizeString(value)
        }
      }
    }
  }
  
  private sanitizeString(str: string): string {
    return str
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // XSS
      .replace(/[<>'"&]/g, (char) => this.escapeHtml(char))              // Escape HTML
      .substring(0, 1000) // Limitation longueur
  }
}
```

## 📊 Logging et Monitoring de Sécurité

### Events de Sécurité

```typescript
// Types d'événements sécuritaires
enum SecurityEvent {
  USER_LOGIN_SUCCESS = 'USER_LOGIN_SUCCESS',
  USER_LOGIN_FAILURE = 'USER_LOGIN_FAILURE',
  BRUTE_FORCE_DETECTED = 'BRUTE_FORCE_DETECTED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  PERMISSION_VIOLATION = 'PERMISSION_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

// Service de logging sécuritaire
class SecurityLogger {
  async logEvent(
    event: SecurityEvent,
    userId: string | null,
    metadata: Record<string, any> = {}
  ) {
    const logEntry = {
      event,
      userId,
      timestamp: new Date().toISOString(),
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      severity: this.calculateSeverity(event),
      details: metadata
    }
    
    // Log en base de données pour investigation
    await SystemEvent.create(logEntry)
    
    // Log fichier pour monitoring externe
    this.logger.warn('SECURITY_EVENT', logEntry)
    
    // Alertes pour événements critiques
    if (logEntry.severity === 'CRITICAL') {
      await this.sendSecurityAlert(logEntry)
    }
  }
}
```

### Monitoring Proactif

```typescript
// Service de détection d'anomalies
class SecurityMonitoringService {
  async detectAnomalies() {
    // Détection tentatives de brute force
    const suspiciousIps = await this.findBruteForceAttempts()
    
    // Détection comptes compromis
    const compromisedAccounts = await this.findSuspiciousLogins()
    
    // Détection patterns d'attaque
    const attackPatterns = await this.analyzeRequestPatterns()
    
    // Actions automatiques
    for (const ip of suspiciousIps) {
      await this.blockIpTemporarily(ip, '1 hour')
    }
    
    for (const account of compromisedAccounts) {
      await this.lockAccountTemporarily(account, '24 hours')
      await this.notifyUser(account, 'SUSPICIOUS_ACTIVITY_DETECTED')
    }
  }
  
  private async findBruteForceAttempts(): Promise<string[]> {
    // Plus de 20 échecs de login en 5 minutes = suspect
    return await LoginAttempt
      .query()
      .where('success', false)
      .where('created_at', '>', DateTime.now().minus({ minutes: 5 }))
      .groupBy('ip_address')
      .havingRaw('count(*) > 20')
      .select('ip_address')
      .then(results => results.map(r => r.ipAddress))
  }
}
```

## 🔧 Configuration de Sécurité

### Variables d'Environnement Sensibles

```bash
# .env sécurisé
# Clé d'application (générer avec node ace generate:key)
APP_KEY=base64:VOTRE_CLE_SECURISEE_BASE64

# Base de données avec utilisateur limité
DB_USER=w40k_app_user        # PAS l'utilisateur root
DB_PASSWORD=mot_de_passe_complexe_unique

# Session sécurisée
SESSION_DRIVER=cookie
SESSION_COOKIE_NAME=w40k_session
SESSION_SECURE=true          # HTTPS uniquement en production
SESSION_HTTP_ONLY=true       # Pas d'accès JavaScript
SESSION_SAME_SITE=strict     # Protection CSRF renforcée

# Hashage des mots de passe
HASH_DRIVER=scrypt          # Plus sécurisé qu'argon2
```

### Headers de Sécurité

```typescript
// config/shield.ts - Configuration complète
export default {
  // Content Security Policy stricte
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"], // Minimal pour Vue
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "data:", "https:"],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'frame-ancestors': ["'none'"] // Pas d'iframe
    }
  },
  
  // Headers de sécurité
  hsts: {
    enabled: true,
    maxAge: '1 year',
    includeSubDomains: true
  },
  
  // Pas de sniffing MIME
  contentTypeSniffing: {
    enabled: false
  },
  
  // Protection XSS
  xss: {
    enabled: true,
    mode: 'block'
  }
}
```

## 🚨 Incident Response

### Procédures d'Urgence

```typescript
class SecurityIncidentResponse {
  async handleBreach(incident: SecurityIncident) {
    // 1. Isolation immédiate
    await this.isolateAffectedSystems(incident.affectedSystems)
    
    // 2. Notification équipe sécurité
    await this.alertSecurityTeam(incident)
    
    // 3. Collecte d'evidence
    await this.preserveEvidence(incident)
    
    // 4. Notification utilisateurs si nécessaire
    if (incident.severity === 'CRITICAL') {
      await this.notifyAffectedUsers(incident.affectedUsers)
    }
    
    // 5. Rapport d'incident
    await this.generateIncidentReport(incident)
  }
  
  async emergencyLockdown() {
    // Verrouillage d'urgence complet
    await this.disableAllLogins()
    await this.blockAllAPI()
    await this.activateMaintenanceMode()
    
    this.logger.critical('EMERGENCY_LOCKDOWN_ACTIVATED')
  }
}
```

### Playbook Sécurité

1. **Détection d'Intrusion**
   - Isolation automatique IP suspect
   - Notification équipe dans les 5 minutes
   - Analyse logs 24h précédentes

2. **Compromission de Compte**
   - Verrouillage immédiat compte
   - Révocation toutes sessions
   - Notification utilisateur par email sécurisé

3. **Attaque DDoS**
   - Activation rate limiting agressif
   - Mise en cache statique
   - Notification hébergeur si nécessaire

## 📋 Checklist Sécurité

### Développement
- [ ] Validation entrées utilisateur avec VineJS
- [ ] Sanitisation données avant stockage
- [ ] Échappement outputs pour éviter XSS  
- [ ] Usage paramètres liés SQL (pas de concaténation)
- [ ] Gestion erreurs sans révéler informations sensibles
- [ ] Tests sécurité automatisés

### Déploiement
- [ ] Variables sensibles dans secrets Kubernetes
- [ ] HTTPS forcé (TLS 1.2+ minimum)
- [ ] Headers sécurité configurés
- [ ] Rate limiting activé
- [ ] Monitoring sécurité actif
- [ ] Sauvegardes chiffrées

### Maintenance
- [ ] Mise à jour dépendances régulières
- [ ] Audit logs sécurité hebdomadaire
- [ ] Tests intrusion trimestriels
- [ ] Révision permissions utilisateurs
- [ ] Sauvegarde procédures incident response

---

## 📚 Ressources

### Standards de Référence
- **OWASP Top 10** : Guide des vulnérabilités web courantes
- **NIST Cybersecurity Framework** : Standards sécurité
- **ISO 27001** : Management sécurité information

### Outils Recommandés
- **npm audit** : Vérification vulnérabilités dépendances
- **Snyk** : Monitoring continu sécurité
- **OWASP ZAP** : Tests sécurité automatisés

---

**W40K Security Guide** - Version 1.0  
*Dernière mise à jour: Janvier 2025*