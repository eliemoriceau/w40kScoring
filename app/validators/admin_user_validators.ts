import vine from '@vinejs/vine'

/**
 * Validator pour la liste des utilisateurs admin
 * Utilisé pour valider les paramètres de requête de filtrage et pagination
 */
export const adminUsersListValidator = vine.compile(
  vine.object({
    // Recherche textuelle sur username, email, fullName
    search: vine.string().trim().minLength(1).maxLength(255).optional(),

    // Filtre par rôle
    roleId: vine.number().min(1).max(3).optional(),

    // Filtre par statut (pour extension future)
    status: vine.enum(['active', 'inactive', 'locked']).optional(),

    // Filtres de date (pour extension future)
    registeredAfter: vine.date().optional(),
    registeredBefore: vine.date().optional(),
    lastActivityAfter: vine.date().optional(),

    // Pagination
    limit: vine.number().min(1).max(100).optional(),
    cursor: vine.string().trim().optional(),

    // Tri
    sort: vine.enum(['username', 'email', 'fullName', 'createdAt', 'updatedAt']).optional(),
    order: vine.enum(['asc', 'desc']).optional(),
  })
)

/**
 * Validator pour la création d'un utilisateur
 * Validation complète des données requises
 */
export const adminUserCreateValidator = vine.compile(
  vine.object({
    // Nom d'utilisateur - unique, format spécifique
    username: vine
      .string()
      .trim()
      .minLength(3)
      .maxLength(50)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .transform((value) => value.toLowerCase()),

    // Email - unique, format email valide
    email: vine.string().trim().email().maxLength(255).normalizeEmail(),

    // Nom complet - optionnel
    fullName: vine.string().trim().minLength(1).maxLength(255).optional(),

    // Rôle - doit exister dans la base (1=USER, 2=MODERATOR, 3=ADMIN)
    roleId: vine.number().min(1).max(3),

    // Options de création
    sendWelcomeEmail: vine.boolean().optional(),
  })
)

/**
 * Validator pour la mise à jour d'un utilisateur
 * Tous les champs sont optionnels sauf validation des contraintes
 */
export const adminUserUpdateValidator = vine.compile(
  vine.object({
    // Nom d'utilisateur - unique si modifié
    username: vine
      .string()
      .trim()
      .minLength(3)
      .maxLength(50)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .transform((value) => value.toLowerCase())
      .optional(),

    // Email - unique si modifié
    email: vine.string().trim().email().maxLength(255).normalizeEmail().optional(),

    // Nom complet
    fullName: vine.string().trim().minLength(1).maxLength(255).nullable().optional(),

    // Rôle - contrôlé par sécurité dans le contrôleur
    roleId: vine.number().min(1).max(3).optional(),

    // Consentement newsletter
    newsletterConsent: vine.boolean().optional(),

    // Force la réinitialisation du mot de passe au prochain login
    forcePasswordReset: vine.boolean().optional(),
  })
)

/**
 * Validator pour le changement de rôle spécifique
 * Action sensible avec validation renforcée
 */
export const adminUserRoleUpdateValidator = vine.compile(
  vine.object({
    roleId: vine.number().min(1).max(3),
    reason: vine.string().trim().minLength(5).maxLength(500).optional(),
  })
)

/**
 * Validator pour les actions en lot (bulk actions)
 * Pour les opérations sur plusieurs utilisateurs
 */
export const adminUsersBulkActionValidator = vine.compile(
  vine.object({
    action: vine.enum(['delete', 'changeRole', 'resetPassword', 'export']),
    userIds: vine.array(vine.number().min(1)).minLength(1).maxLength(50),

    // Paramètres spécifiques selon l'action
    roleId: vine.number().min(1).max(3).optional(), // Pour changeRole
    reason: vine.string().trim().minLength(5).maxLength(500).optional(), // Pour justification
    sendNotification: vine.boolean().optional(),
  })
)

/**
 * Validator pour la recherche avancée
 * Fonctionnalités de recherche complexe
 */
export const adminUsersSearchValidator = vine.compile(
  vine.object({
    // Terme de recherche principal
    query: vine.string().trim().minLength(1).maxLength(255),

    // Champs dans lesquels chercher
    searchFields: vine
      .array(vine.enum(['username', 'email', 'fullName']))
      .minLength(1)
      .optional(),

    // Filtres avancés
    filters: vine
      .object({
        roleIds: vine.array(vine.number().min(1).max(3)).optional(),
        createdAfter: vine.date().optional(),
        createdBefore: vine.date().optional(),
        lastActivityAfter: vine.date().optional(),
        hasParties: vine.boolean().optional(),
        newsletterConsent: vine.boolean().optional(),
      })
      .optional(),

    // Pagination et tri
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    sort: vine.enum(['relevance', 'username', 'email', 'createdAt', 'lastActivity']).optional(),
    order: vine.enum(['asc', 'desc']).optional(),
  })
)

/**
 * Validator pour l'export des utilisateurs
 * Paramètres d'export avec filtres
 */
export const adminUsersExportValidator = vine.compile(
  vine.object({
    format: vine.enum(['csv', 'excel', 'json']),

    // Champs à inclure dans l'export
    fields: vine
      .array(
        vine.enum([
          'id',
          'username',
          'email',
          'fullName',
          'role',
          'createdAt',
          'updatedAt',
          'lastActivity',
          'partiesCount',
        ])
      )
      .minLength(1),

    // Filtres d'export
    filters: vine
      .object({
        roleIds: vine.array(vine.number().min(1).max(3)).optional(),
        createdAfter: vine.date().optional(),
        createdBefore: vine.date().optional(),
        lastActivityAfter: vine.date().optional(),
      })
      .optional(),

    // Options d'export
    includeStats: vine.boolean().optional(),
    includePartiesData: vine.boolean().optional(),
  })
)

/**
 * Validator pour les paramètres avancés de pagination
 * Cursor-based pagination avec métadonnées
 */
export const adminUsersPaginationValidator = vine.compile(
  vine.object({
    // Pagination cursor-based
    cursor: vine.string().trim().optional(),
    direction: vine.enum(['forward', 'backward']).optional(),

    // Taille de page
    limit: vine.number().min(1).max(100),

    // Informations de contexte
    includeTotal: vine.boolean().optional(),
    includeStats: vine.boolean().optional(),
  })
)
