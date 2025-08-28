import User from '#models/user'
import Role from '#models/role'
import AdminActionLog from '#models/admin_action_log'
import { DateTime } from 'luxon'

/**
 * Service pour les statistiques administrateur
 * Fournit des métriques et analyses pour le panel admin
 */
export default class AdminStatsService {
  /**
   * Récupère les statistiques des utilisateurs
   */
  async getUserStats() {
    const [totalUsers, activeUsers, newUsers, usersByRole, recentActivity] = await Promise.all([
      // Total d'utilisateurs
      User.query().count('*').first(),

      // Utilisateurs actifs (connectés dans les 30 derniers jours)
      User.query()
        .where('lastLoginAt', '>=', DateTime.now().minus({ days: 30 }).toSQL())
        .count('*')
        .first(),

      // Nouveaux utilisateurs (créés dans les 7 derniers jours)
      User.query()
        .where('createdAt', '>=', DateTime.now().minus({ days: 7 }).toSQL())
        .count('*')
        .first(),

      // Distribution par rôle
      User.query()
        .select('roleId')
        .count('* as total')
        .preload('role')
        .groupBy('roleId')
        .orderBy('roleId'),

      // Activité récente (actions des 24 dernières heures)
      AdminActionLog.query()
        .where('createdAt', '>=', DateTime.now().minus({ hours: 24 }).toSQL())
        .count('*')
        .first(),
    ])

    // Transformation des statistiques par rôle
    const roleStats = await Promise.all(
      usersByRole.map(async (stat) => {
        const role = await Role.find(stat.roleId)
        return {
          roleId: stat.roleId,
          roleName: role?.name || 'Unknown',
          permissionLevel: role?.permissionLevel || 0,
          userCount: Number(stat.$extras.total),
        }
      })
    )

    return {
      total: Number(totalUsers?.$extras['count(*)'] || 0),
      active: Number(activeUsers?.$extras['count(*)'] || 0),
      new: Number(newUsers?.$extras['count(*)'] || 0),
      recentActions: Number(recentActivity?.$extras['count(*)'] || 0),
      roleDistribution: roleStats.sort((a, b) => a.permissionLevel - b.permissionLevel),
    }
  }

  /**
   * Récupère les actions d'audit récentes avec détails
   */
  async getRecentAuditActions(limit: number = 10) {
    const actions = await AdminActionLog.query()
      .preload('admin', (query) => {
        query.select('id', 'username', 'email')
      })
      .orderBy('createdAt', 'desc')
      .limit(limit)

    return actions.map((action) => ({
      id: action.id,
      action: action.action,
      actionDescription: action.actionDescription,
      targetType: action.targetType,
      targetId: action.targetId,
      admin: {
        id: action.admin.id,
        username: action.admin.username,
        email: action.admin.email,
      },
      severity: action.severity,
      createdAt: action.createdAt.toFormat('dd/MM/yyyy HH:mm:ss'),
      ipAddress: action.ipAddress,
      userAgent: action.userAgent,
    }))
  }

  /**
   * Récupère les métriques d'activité par période
   */
  async getActivityMetrics() {
    const now = DateTime.now()

    const [last24h, last7days, last30days] = await Promise.all([
      AdminActionLog.query()
        .where('createdAt', '>=', now.minus({ hours: 24 }).toSQL())
        .count('*')
        .first(),

      AdminActionLog.query()
        .where('createdAt', '>=', now.minus({ days: 7 }).toSQL())
        .count('*')
        .first(),

      AdminActionLog.query()
        .where('createdAt', '>=', now.minus({ days: 30 }).toSQL())
        .count('*')
        .first(),
    ])

    return {
      last24Hours: Number(last24h?.$extras['count(*)'] || 0),
      last7Days: Number(last7days?.$extras['count(*)'] || 0),
      last30Days: Number(last30days?.$extras['count(*)'] || 0),
    }
  }

  /**
   * Récupère les actions critiques récentes
   */
  async getCriticalActions(limit: number = 5) {
    const actions = await AdminActionLog.query()
      .preload('admin', (query) => {
        query.select('id', 'username', 'email')
      })
      .whereIn('action', [
        'user.delete',
        'user.update_role',
        'user.reset_password',
        'system.config',
        'system.maintenance',
      ])
      .orderBy('createdAt', 'desc')
      .limit(limit)

    return actions.map((action) => ({
      id: action.id,
      action: action.action,
      actionDescription: action.actionDescription,
      targetId: action.targetId,
      admin: action.admin.username,
      severity: action.severity,
      createdAt: action.createdAt.toFormat('dd/MM/yyyy HH:mm:ss'),
    }))
  }

  /**
   * Analyse des tendances utilisateurs
   */
  async getUserTrends() {
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 })
    const sevenDaysAgo = DateTime.now().minus({ days: 7 })

    const [userGrowth30Days, userGrowth7Days, activeUserTrend] = await Promise.all([
      // Croissance utilisateurs sur 30 jours
      User.query()
        .whereBetween('createdAt', [thirtyDaysAgo.toSQL(), DateTime.now().toSQL()])
        .count('*')
        .first(),

      // Croissance utilisateurs sur 7 jours
      User.query()
        .whereBetween('createdAt', [sevenDaysAgo.toSQL(), DateTime.now().toSQL()])
        .count('*')
        .first(),

      // Tendance utilisateurs actifs
      User.query().where('lastLoginAt', '>=', sevenDaysAgo.toSQL()).count('*').first(),
    ])

    const growth30 = Number(userGrowth30Days?.$extras['count(*)'] || 0)
    const growth7 = Number(userGrowth7Days?.$extras['count(*)'] || 0)
    const activeWeekly = Number(activeUserTrend?.$extras['count(*)'] || 0)

    return {
      growth30Days: growth30,
      growth7Days: growth7,
      growthRate: growth30 > 0 ? ((growth7 / growth30) * 100).toFixed(1) : '0.0',
      weeklyActiveUsers: activeWeekly,
    }
  }
}
