/**
 * Types et interfaces pour la gestion des utilisateurs admin
 * Définitions TypeScript pour une meilleure sécurité de types
 */

/**
 * Structure de requête pour la liste des utilisateurs
 */
export interface AdminUsersListRequest {
  search?: string
  roleId?: number
  status?: 'active' | 'inactive' | 'locked'
  registeredAfter?: Date
  registeredBefore?: Date
  lastActivityAfter?: Date
  limit?: number
  cursor?: string
  sort?: 'username' | 'email' | 'fullName' | 'createdAt' | 'updatedAt'
  order?: 'asc' | 'desc'
}

/**
 * Structure de données pour la création d'utilisateur
 */
export interface AdminUserCreateRequest {
  username: string
  email: string
  fullName?: string
  roleId: number
  sendWelcomeEmail?: boolean
}

/**
 * Structure de données pour la mise à jour d'utilisateur
 */
export interface AdminUserUpdateRequest {
  username?: string
  email?: string
  fullName?: string | null
  roleId?: number
  newsletterConsent?: boolean
  forcePasswordReset?: boolean
}

/**
 * Structure de réponse pour un utilisateur formaté
 */
export interface AdminUserResponse {
  id: number
  username: string
  email: string
  fullName: string | null
  role: {
    id: number
    name: string
    permissionLevel: number
  }
  newsletterConsent: boolean
  termsAcceptedAt?: string
  createdAt: string
  updatedAt: string
  stats?: {
    totalParties: number
    partiesWon: number
    winRate: number
    lastActivity: Date
  }
  isCurrentUser?: boolean
}

/**
 * Structure de pagination pour les listes
 */
export interface PaginationMeta {
  hasMore: boolean
  nextCursor: string | null
  limit: number
  total: number
  active: number
}

/**
 * Structure de réponse pour la liste d'utilisateurs
 */
export interface AdminUsersListResponse {
  users: AdminUserResponse[]
  pagination: PaginationMeta
  filters: {
    search: string
    roleId: number | null
    status: string | null
    sort: string
    order: string
  }
  roles: Array<{
    id: number
    name: string
    permissionLevel: number
  }>
}

/**
 * Structure pour le changement de rôle
 */
export interface AdminUserRoleChangeRequest {
  roleId: number
  reason?: string
}

/**
 * Structure pour les actions en lot
 */
export interface AdminUsersBulkActionRequest {
  action: 'delete' | 'changeRole' | 'resetPassword' | 'export'
  userIds: number[]
  roleId?: number // Pour changeRole
  reason?: string // Pour justification
  sendNotification?: boolean
}

/**
 * Structure pour la recherche avancée
 */
export interface AdminUsersSearchRequest {
  query: string
  searchFields?: ('username' | 'email' | 'fullName')[]
  filters?: {
    roleIds?: number[]
    createdAfter?: Date
    createdBefore?: Date
    lastActivityAfter?: Date
    hasParties?: boolean
    newsletterConsent?: boolean
  }
  page?: number
  limit?: number
  sort?: 'relevance' | 'username' | 'email' | 'createdAt' | 'lastActivity'
  order?: 'asc' | 'desc'
}

/**
 * Structure pour l'export d'utilisateurs
 */
export interface AdminUsersExportRequest {
  format: 'csv' | 'excel' | 'json'
  fields: (
    | 'id'
    | 'username'
    | 'email'
    | 'fullName'
    | 'role'
    | 'createdAt'
    | 'updatedAt'
    | 'lastActivity'
    | 'partiesCount'
  )[]
  filters?: {
    roleIds?: number[]
    createdAfter?: Date
    createdBefore?: Date
    lastActivityAfter?: Date
  }
  includeStats?: boolean
  includePartiesData?: boolean
}

/**
 * Structure des statistiques utilisateurs
 */
export interface AdminUserStats {
  total: number
  byRole: { [roleName: string]: number }
  active: number // Actifs dans les 30 derniers jours
  recent: number // Inscrits dans les 7 derniers jours
  growth: {
    daily: number
    weekly: number
    monthly: number
  }
}

/**
 * Structure pour l'audit des actions utilisateurs
 */
export interface AdminUserAuditLog {
  id: number
  adminId: number
  adminUsername: string
  action: string
  targetUserId: number
  targetUsername: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  reason?: string
  ipAddress: string
  userAgent?: string
  createdAt: string
}

/**
 * Structure des filtres avancés pour l'interface
 */
export interface AdminUserFilters {
  search: string
  roles: number[]
  status: string[]
  dateRange: {
    start?: Date
    end?: Date
  }
  activity: {
    recentOnly?: boolean
    inactiveOnly?: boolean
  }
  sorting: {
    field: string
    direction: 'asc' | 'desc'
  }
}

/**
 * Structure des permissions pour les actions utilisateur
 */
export interface AdminUserPermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canChangeRole: boolean
  canResetPassword: boolean
  canExport: boolean
  canBulkAction: boolean
}

/**
 * Structure pour les données de breadcrumb
 */
export interface BreadcrumbItem {
  label: string
  href?: string
}

/**
 * Énumérations pour améliorer la sécurité des types
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
  SUSPENDED = 'suspended',
}

export enum UserSortField {
  USERNAME = 'username',
  EMAIL = 'email',
  FULL_NAME = 'fullName',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_ACTIVITY = 'lastActivity',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum BulkActionType {
  DELETE = 'delete',
  CHANGE_ROLE = 'changeRole',
  RESET_PASSWORD = 'resetPassword',
  EXPORT = 'export',
  SUSPEND = 'suspend',
  ACTIVATE = 'activate',
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
  PDF = 'pdf',
}
