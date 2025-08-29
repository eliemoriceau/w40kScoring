import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import AdminStatsService from '#application/services/admin_stats_service'
import {
  adminUsersListValidator,
  adminUserCreateValidator,
  adminUserUpdateValidator,
} from '#validators/admin_user_validators'

export default class AdminUsersController {
  /**
   * Liste paginée des utilisateurs avec filtres et recherche
   * GET /admin/users
   */
  async index({ request, inertia }: HttpContext) {
    // Les permissions admin sont vérifiées par le middleware AdminAccessMiddleware

    // Validation des paramètres de requête
    const {
      search,
      roleId,
      status,
      limit = 20,
      cursor,
      sort = 'createdAt',
      order = 'desc',
    } = await request.validateUsing(adminUsersListValidator)

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

    // Chargement des rôles pour les filtres
    const roles = await Role.query().orderBy('permissionLevel', 'asc')

    // Statistiques enrichies
    const statsService = new AdminStatsService()
    const userStats = await statsService.getUserStats()
    const activityMetrics = await statsService.getActivityMetrics()
    const userTrends = await statsService.getUserTrends()

    return inertia.render('admin/users/Index', {
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: {
          id: user.role.id,
          name: user.role.name,
          permissionLevel: user.role.permissionLevel,
        },
        createdAt: user.createdAt.toFormat('dd/MM/yyyy HH:mm'),
        updatedAt: user.updatedAt.toFormat('dd/MM/yyyy HH:mm'),
        isCurrentUser: false, // Will be set in frontend
      })),
      pagination: {
        hasMore,
        nextCursor,
        limit,
        total: userStats.total,
        active: userStats.active,
      },
      stats: {
        users: userStats,
        activity: activityMetrics,
        trends: userTrends,
      },
      filters: {
        search: search || '',
        roleId: roleId || null,
        status: status || null,
        sort,
        order,
      },
      roles,
      breadcrumbItems: [{ label: 'Dashboard', href: '/admin' }, { label: 'Gestion Utilisateurs' }],
    })
  }

  /**
   * Affichage du détail d'un utilisateur
   * GET /admin/users/:id
   */
  async show({ params, inertia }: HttpContext) {
    // Les permissions admin sont vérifiées par le middleware AdminAccessMiddleware

    const user = await User.query().where('id', params.id).preload('role').firstOrFail()

    // Statistiques utilisateur (à implémenter avec les parties)
    const userStats = {
      totalParties: 0, // await user.related('parties').query().count('*').first()
      partiesWon: 0,
      winRate: 0,
      lastActivity: user.updatedAt,
    }

    return inertia.render('admin/users/Show', {
      user: {
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
        termsAcceptedAt: user.termsAcceptedAt?.toFormat('dd/MM/yyyy HH:mm'),
        createdAt: user.createdAt.toFormat('dd/MM/yyyy HH:mm'),
        updatedAt: user.updatedAt.toFormat('dd/MM/yyyy HH:mm'),
        stats: userStats,
      },
      roles: await Role.query().orderBy('permissionLevel', 'asc'),
      breadcrumbItems: [
        { label: 'Dashboard', href: '/admin' },
        { label: 'Utilisateurs', href: '/admin/users' },
        { label: user.username },
      ],
    })
  }

  /**
   * Création d'un nouvel utilisateur
   * POST /admin/users
   */
  async store({ request, response, session }: HttpContext) {
    // Les permissions admin sont vérifiées par le middleware AdminAccessMiddleware

    const data = await request.validateUsing(adminUserCreateValidator)

    // Vérification de l'unicité
    const existingUser = await User.query()
      .where('username', data.username)
      .orWhere('email', data.email)
      .first()

    if (existingUser) {
      session.flash('error', "Un utilisateur avec ce nom d'utilisateur ou email existe déjà")
      return response.redirect().back()
    }

    // Génération d'un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-12)

    const user = await User.create({
      username: data.username,
      email: data.email,
      fullName: data.fullName || null,
      password: tempPassword, // Sera hashé automatiquement par le modèle
      roleId: data.roleId,
      newsletterConsent: false,
      termsAcceptedAt: new Date(),
    })

    // TODO: Envoyer email avec mot de passe temporaire si sendWelcomeEmail = true

    session.flash(
      'success',
      `Utilisateur ${user.username} créé avec succès. Mot de passe temporaire: ${tempPassword}`
    )
    return response.redirect('/admin/users')
  }

  /**
   * Mise à jour d'un utilisateur
   * PUT /admin/users/:id
   */
  async update({ params, request, response, session, auth }: HttpContext) {
    // Les permissions admin sont vérifiées par le middleware AdminAccessMiddleware

    const user = await User.findOrFail(params.id)
    const data = await request.validateUsing(adminUserUpdateValidator)
    const currentUser = auth.user!

    // Protection: empêcher l'auto-modification du rôle
    if (user.id === currentUser.id && data.roleId && data.roleId !== user.roleId) {
      session.flash('error', 'Vous ne pouvez pas modifier votre propre rôle')
      return response.redirect().back()
    }

    // Protection: s'assurer qu'il reste au moins un admin
    if (data.roleId && data.roleId < 3 && user.roleId === 3) {
      const adminCount = await User.query()
        .join('roles', 'users.roleId', 'roles.id')
        .where('roles.permissionLevel', 3)
        .count('*')
        .first()

      if (Number(adminCount?.$extras.count || 0) <= 1) {
        session.flash('error', 'Il doit rester au moins un administrateur')
        return response.redirect().back()
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
        session.flash('error', "Ce nom d'utilisateur ou email est déjà utilisé")
        return response.redirect().back()
      }
    }

    // Mise à jour des données
    user.merge(data)
    await user.save()

    session.flash('success', `Utilisateur ${user.username} mis à jour avec succès`)
    return response.redirect(`/admin/users/${user.id}`)
  }

  /**
   * Suppression/désactivation d'un utilisateur
   * DELETE /admin/users/:id
   */
  async destroy({ params, response, session, auth }: HttpContext) {
    // Les permissions admin sont vérifiées par le middleware AdminAccessMiddleware

    const user = await User.query().preload('role').where('id', params.id).firstOrFail()
    const currentUser = auth.user!

    // Protection: empêcher l'auto-suppression
    if (user.id === currentUser.id) {
      session.flash('error', 'Vous ne pouvez pas supprimer votre propre compte')
      return response.redirect().back()
    }

    // Protection: s'assurer qu'il reste au moins un admin
    if (user.role.permissionLevel === 3) {
      const adminCount = await User.query()
        .join('roles', 'users.roleId', 'roles.id')
        .where('roles.permissionLevel', 3)
        .count('*')
        .first()

      if (Number(adminCount?.$extras.count || 0) <= 1) {
        session.flash('error', 'Impossible de supprimer le dernier administrateur')
        return response.redirect().back()
      }
    }

    // Soft delete: on pourrait ajouter un champ isActive au lieu de supprimer
    // Pour l'instant, suppression directe mais avec gestion des contraintes
    await user.delete()

    session.flash('success', `Utilisateur ${user.username} supprimé avec succès`)
    return response.redirect('/admin/users')
  }

  /**
   * Changement de rôle d'un utilisateur
   * PUT /admin/users/:id/role
   */
  async updateRole({ params, request, response, session, auth }: HttpContext) {
    // Les permissions admin sont vérifiées par le middleware AdminAccessMiddleware

    const user = await User.query().preload('role').where('id', params.id).firstOrFail()
    const { roleId } = request.only(['roleId'])
    const currentUser = auth.user!

    // Validation du rôle
    const newRole = await Role.findOrFail(roleId)

    // Protection: empêcher l'auto-modification du rôle
    if (user.id === currentUser.id) {
      session.flash('error', 'Vous ne pouvez pas modifier votre propre rôle')
      return response.redirect().back()
    }

    // Protection: s'assurer qu'il reste au moins un admin
    if (newRole.permissionLevel < 3 && user.role.permissionLevel === 3) {
      const adminCount = await User.query()
        .join('roles', 'users.roleId', 'roles.id')
        .where('roles.permissionLevel', 3)
        .count('*')
        .first()

      if (Number(adminCount?.$extras.count || 0) <= 1) {
        session.flash('error', 'Il doit rester au moins un administrateur')
        return response.redirect().back()
      }
    }

    const oldRole = user.role.name
    user.roleId = roleId
    await user.save()

    session.flash('success', `Rôle de ${user.username} changé de ${oldRole} vers ${newRole.name}`)
    return response.redirect(`/admin/users/${user.id}`)
  }

  /**
   * Réinitialisation du mot de passe
   * POST /admin/users/:id/reset-password
   */
  async resetPassword({ params, response, session }: HttpContext) {
    // Les permissions admin sont vérifiées par le middleware AdminAccessMiddleware

    const user = await User.findOrFail(params.id)

    // Génération d'un nouveau mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-12)

    user.password = tempPassword // Sera hashé automatiquement
    await user.save()

    // TODO: Envoyer email avec nouveau mot de passe

    session.flash(
      'success',
      `Mot de passe réinitialisé pour ${user.username}. Nouveau mot de passe: ${tempPassword}`
    )
    return response.redirect(`/admin/users/${user.id}`)
  }
}
