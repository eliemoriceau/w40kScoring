import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import AdminActionLog from '#models/admin_action_log'
import db from '@adonisjs/lucid/services/db'

export default class AdminDashboardsController {
  /**
   * Affiche le tableau de bord administrateur avec les métriques de base
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.user!
    await user.load('role')

    // Récupérer les métriques de base
    const [totalUsers, activeUsers, totalParties, recentActions] = await Promise.all([
      // Total des utilisateurs
      User.query().count('*').first(),

      // Utilisateurs actifs (connectés dans les 30 derniers jours)
      User.query()
        .where('updated_at', '>=', db.rawQuery("datetime('now', '-30 days')"))
        .count('*')
        .first(),

      // Total des parties (en utilisant la table games si elle existe)
      db.rawQuery('SELECT COUNT(*) as total FROM games').catch(() => ({ total: 0 })),

      // Actions récentes des administrateurs
      AdminActionLog.query()
        .preload('admin', (query) => {
          query.select(['id', 'username'])
        })
        .orderBy('created_at', 'desc')
        .limit(5),
    ])

    const metrics = {
      totalUsers: totalUsers?.$extras.count || 0,
      activeUsers: activeUsers?.$extras.count || 0,
      totalParties: totalParties?.total || 0,
      recentActionsCount: recentActions.length,
      systemHealth: 98, // Placeholder - sera calculé plus tard
    }

    return inertia.render('admin/Dashboard', {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role
          ? {
              id: user.role.id,
              name: user.role.name,
              permissionLevel: user.role.permissionLevel,
            }
          : null,
      },
      metrics,
      recentActions: recentActions.map((action) => ({
        id: action.id,
        action: action.actionDescription,
        admin: action.admin.username,
        targetType: action.targetType,
        targetId: action.targetId,
        severity: action.severity,
        createdAt: action.createdAt.toFormat('dd/MM/yyyy HH:mm'),
      })),
      breadcrumbItems: [{ label: 'Administration' }, { label: 'Tableau de Bord' }],
    })
  }
}
