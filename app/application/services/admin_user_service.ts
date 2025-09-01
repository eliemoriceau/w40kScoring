import User from '#models/user'
import Role from '#models/role'
import {
  AdminUserCreateRequest,
  AdminUserUpdateRequest,
  AdminUsersListRequest,
} from '#types/admin_user_types'

/**
 * Service métier pour la gestion des utilisateurs par l'admin
 * Implémente la logique business et les règles de sécurité
 */
export class AdminUserService {
  /**
   * Liste paginée des utilisateurs avec filtres
   */
  async listUsers(filters: AdminUsersListRequest): Promise<{
    users: any[]
    pagination: {
      hasMore: boolean
      nextCursor: string | null
      total: number
      active: number
    }
  }> {
    const {
      search,
      roleId,
      status,
      limit = 20,
      cursor,
      sort = 'createdAt',
      order = 'desc',
    } = filters

    // Construction de la requête avec filtres
    let query = User.query().preload('role')

    // Filtres
    if (search) {
      query = query.where((q) => {
        q.whereILike('username', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('fullName', `%${search}%`)
      })
    }

    if (roleId) {
      query = query.where('roleId', roleId)
    }

    // TODO: Implémenter les filtres de statut quand le modèle le supportera
    // if (status) {
    //   query = query.where('status', status)
    // }

    // Tri
    query = query.orderBy(sort, order)

    // Pagination cursor-based
    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8')
      query = query.where('id', '>', decodedCursor)
    }

    // Limitation des résultats
    const users = await query.limit(limit + 1)
    const hasMore = users.length > limit
    if (hasMore) users.pop()

    // Génération du curseur suivant
    const nextCursor =
      hasMore && users.length > 0
        ? Buffer.from(users[users.length - 1].id.toString()).toString('base64')
        : null

    // Statistiques
    const totalUsers = await User.query().count('*').first()
    const activeUsers = await User.query()
      .where('updatedAt', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .count('*')
      .first()

    return {
      users: users.map((user) => this.formatUserForList(user)),
      pagination: {
        hasMore,
        nextCursor,
        total: Number(totalUsers?.$extras.count || 0),
        active: Number(activeUsers?.$extras.count || 0),
      },
    }
  }

  /**
   * Création d'un nouvel utilisateur
   */
  async createUser(data: AdminUserCreateRequest, adminId: number): Promise<User> {
    // Vérification de l'unicité
    const existingUser = await User.query()
      .where('username', data.username)
      .orWhere('email', data.email)
      .first()

    if (existingUser) {
      throw new Error("Un utilisateur avec ce nom d'utilisateur ou email existe déjà")
    }

    // Validation du rôle
    const role = await Role.findOrFail(data.roleId)

    // Génération d'un mot de passe temporaire
    const tempPassword = this.generateTemporaryPassword()

    const user = await User.create({
      username: data.username,
      email: data.email,
      fullName: data.fullName || null,
      password: tempPassword, // Sera hashé automatiquement par le modèle
      roleId: data.roleId,
      newsletterConsent: false,
      termsAcceptedAt: new Date(),
    })

    // TODO: Envoyer email avec mot de passe temporaire si demandé
    if (data.sendWelcomeEmail) {
      await this.sendWelcomeEmail(user, tempPassword)
    }

    return user
  }

  /**
   * Mise à jour d'un utilisateur avec validations de sécurité
   */
  async updateUser(userId: number, data: AdminUserUpdateRequest, adminId: number): Promise<User> {
    const user = await User.findOrFail(userId)

    // Protection: empêcher l'auto-modification du rôle
    if (user.id === adminId && data.roleId && data.roleId !== user.roleId) {
      throw new Error('Vous ne pouvez pas modifier votre propre rôle')
    }

    // Protection: s'assurer qu'il reste au moins un admin
    if (data.roleId && data.roleId < 3 && user.roleId === 3) {
      const adminCount = await this.countAdmins()
      if (adminCount <= 1) {
        throw new Error('Il doit rester au moins un administrateur')
      }
    }

    // Vérification de l'unicité pour les changements d'username/email
    if (
      (data.username && data.username !== user.username) ||
      (data.email && data.email !== user.email)
    ) {
      const existing = await User.query()
        .where('id', '!=', user.id)
        .where((query) => {
          if (data.username && data.username !== user.username) {
            query.orWhere('username', data.username)
          }
          if (data.email && data.email !== user.email) {
            query.orWhere('email', data.email)
          }
        })
        .first()

      if (existing) {
        throw new Error("Ce nom d'utilisateur ou email est déjà utilisé")
      }
    }

    // Mise à jour des données
    user.merge(data)
    await user.save()

    return user
  }

  /**
   * Changement de rôle d'un utilisateur
   */
  async changeUserRole(
    userId: number,
    newRoleId: number,
    adminId: number,
    reason?: string
  ): Promise<User> {
    const user = await User.query().preload('role').where('id', userId).firstOrFail()

    // Protection: empêcher l'auto-modification du rôle
    if (user.id === adminId) {
      throw new Error('Vous ne pouvez pas modifier votre propre rôle')
    }

    // Validation du nouveau rôle
    const newRole = await Role.findOrFail(newRoleId)

    // Protection: s'assurer qu'il reste au moins un admin
    if (newRole.permissionLevel < 3 && user.role.permissionLevel === 3) {
      const adminCount = await this.countAdmins()
      if (adminCount <= 1) {
        throw new Error('Il doit rester au moins un administrateur')
      }
    }

    user.roleId = newRoleId
    await user.save()

    // TODO: Log de l'action avec raison dans AdminActionLog
    // await this.logRoleChange(user, user.role, newRole, adminId, reason)

    return user
  }

  /**
   * Suppression sécurisée d'un utilisateur
   */
  async deleteUser(userId: number, adminId: number): Promise<void> {
    const user = await User.query().preload('role').where('id', userId).firstOrFail()

    // Protection: empêcher l'auto-suppression
    if (user.id === adminId) {
      throw new Error('Vous ne pouvez pas supprimer votre propre compte')
    }

    // Protection: s'assurer qu'il reste au moins un admin
    if (user.role.permissionLevel === 3) {
      const adminCount = await this.countAdmins()
      if (adminCount <= 1) {
        throw new Error('Impossible de supprimer le dernier administrateur')
      }
    }

    // TODO: Implémentation d'un soft delete plutôt qu'une suppression
    // user.deletedAt = new Date()
    // await user.save()

    // Pour l'instant, suppression directe
    await user.delete()
  }

  /**
   * Réinitialisation du mot de passe d'un utilisateur
   */
  async resetUserPassword(
    userId: number,
    adminId: number
  ): Promise<{ user: User; tempPassword: string }> {
    const user = await User.findOrFail(userId)

    // Génération d'un nouveau mot de passe temporaire
    const tempPassword = this.generateTemporaryPassword()

    user.password = tempPassword // Sera hashé automatiquement
    await user.save()

    // TODO: Envoyer email avec nouveau mot de passe
    // await this.sendPasswordResetEmail(user, tempPassword)

    return { user, tempPassword }
  }

  /**
   * Recherche avancée d'utilisateurs
   */
  async searchUsers(query: string, filters: any = {}): Promise<User[]> {
    let searchQuery = User.query().preload('role')

    // Recherche textuelle
    searchQuery = searchQuery.where((q) => {
      q.whereILike('username', `%${query}%`)
        .orWhereILike('email', `%${query}%`)
        .orWhereILike('fullName', `%${query}%`)
    })

    // Application des filtres
    if (filters.roleIds && filters.roleIds.length > 0) {
      searchQuery = searchQuery.whereIn('roleId', filters.roleIds)
    }

    if (filters.createdAfter) {
      searchQuery = searchQuery.where('createdAt', '>=', filters.createdAfter)
    }

    if (filters.createdBefore) {
      searchQuery = searchQuery.where('createdAt', '<=', filters.createdBefore)
    }

    return searchQuery.limit(50)
  }

  /**
   * Statistiques des utilisateurs
   */
  async getUserStats(): Promise<{
    total: number
    byRole: { [key: string]: number }
    active: number
    recent: number
  }> {
    const total = await User.query().count('*').first()

    const byRole = await User.query()
      .join('roles', 'users.roleId', 'roles.id')
      .groupBy('roles.name')
      .select('roles.name as role')
      .count('users.id as count')

    const active = await User.query()
      .where('updatedAt', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .count('*')
      .first()

    const recent = await User.query()
      .where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .count('*')
      .first()

    return {
      total: Number(total?.$extras.count || 0),
      byRole: byRole.reduce(
        (acc, item) => {
          acc[item.$extras.role] = Number(item.$extras.count)
          return acc
        },
        {} as { [key: string]: number }
      ),
      active: Number(active?.$extras.count || 0),
      recent: Number(recent?.$extras.count || 0),
    }
  }

  /**
   * Utilitaires privés
   */

  private formatUserForList(user: User): any {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: {
        id: user.role.id,
        name: user.role.name,
        permissionLevel: user.role.permissionLevel,
      },
      newsletterConsent: user.newsletterConsent,
      createdAt: user.createdAt.toFormat('dd/MM/yyyy HH:mm'),
      updatedAt: user.updatedAt.toFormat('dd/MM/yyyy HH:mm'),
    }
  }

  private generateTemporaryPassword(): string {
    // Génération sécurisée d'un mot de passe temporaire
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  private async countAdmins(): Promise<number> {
    const adminCount = await User.query()
      .join('roles', 'users.roleId', 'roles.id')
      .where('roles.permissionLevel', 3)
      .count('*')
      .first()

    return Number(adminCount?.$extras.count || 0)
  }

  private async sendWelcomeEmail(user: User, tempPassword: string): Promise<void> {
    // TODO: Implémentation de l'envoi d'email
    logger.info('Welcome email queued for new user', {
      userId: user.id,
      userEmail: this.maskEmail(user.email),
      action: 'welcome_email',
      timestamp: DateTime.now().toISO(),
    })
  }

  private async sendPasswordResetEmail(user: User, tempPassword: string): Promise<void> {
    // TODO: Implémentation de l'envoi d'email
    logger.info('Password reset email queued for user', {
      userId: user.id,
      userEmail: this.maskEmail(user.email),
      action: 'password_reset_email',
      timestamp: DateTime.now().toISO(),
    })
  }

  /**
   * Masque l'email pour les logs (garde premières lettres + domaine)
   * ex: john.doe@example.com → jo***@example.com
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@')
    if (localPart.length <= 2) return `${localPart[0]}***@${domain}`
    return `${localPart.substring(0, 2)}***@${domain}`
  }
}
