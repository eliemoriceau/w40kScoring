import Permission from '#models/permission'
import Role from '#models/role'
import User from '#models/user'
import type { PermissionResource, PermissionAction } from '#models/permission'

/**
 * Service pour la gestion des permissions granulaires
 */
export default class PermissionService {
  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  async userHasPermission(user: User, resource: PermissionResource, action: PermissionAction): Promise<boolean> {
    if (!user.role) {
      await user.load('role')
    }

    if (!user.role) {
      return false
    }

    return await user.role.canPerform(resource, action)
  }

  /**
   * Vérifie si un utilisateur peut effectuer une action sur une ressource
   * Inclut les vérifications d'autorisation spéciales
   */
  async userCanPerform(userId: number, resource: PermissionResource, action: PermissionAction, resourceId?: number): Promise<boolean> {
    const user = await User.find(userId)
    if (!user) {
      return false
    }

    const hasBasePermission = await this.userHasPermission(user, resource, action)
    if (!hasBasePermission) {
      return false
    }

    // Règles d'autorisation spéciales selon la ressource
    switch (resource) {
      case 'users':
        // Un utilisateur ne peut pas se supprimer lui-même
        if (action === 'delete' && resourceId === userId) {
          return false
        }
        // Un utilisateur peut modifier ses propres données (lecture seule)
        if (action === 'read' && resourceId === userId) {
          return true
        }
        break

      case 'parties':
        // Les règles métier des parties sont gérées dans le domain
        break

      case 'notifications':
        // Les utilisateurs peuvent marquer leurs propres notifications comme lues
        if (action === 'update' && user.role?.permissionLevel >= 2) {
          return true
        }
        break
    }

    return hasBasePermission
  }

  /**
   * Crée une nouvelle permission
   */
  async createPermission(data: {
    name: string
    description: string
    resource: PermissionResource
    action: PermissionAction
    isActive?: boolean
  }): Promise<Permission> {
    return await Permission.create({
      name: data.name,
      description: data.description,
      resource: data.resource,
      action: data.action,
      isActive: data.isActive ?? true
    })
  }

  /**
   * Assigne une permission à un rôle
   */
  async assignPermissionToRole(permissionId: number, roleId: number, grantedBy: number): Promise<void> {
    const role = await Role.find(roleId)
    const permission = await Permission.find(permissionId)

    if (!role || !permission) {
      throw new Error('Rôle ou permission introuvable')
    }

    await role.grantPermission(permissionId, grantedBy)
  }

  /**
   * Retire une permission d'un rôle
   */
  async removePermissionFromRole(permissionId: number, roleId: number): Promise<void> {
    const role = await Role.find(roleId)
    if (!role) {
      throw new Error('Rôle introuvable')
    }

    await role.revokePermission(permissionId)
  }

  /**
   * Récupère toutes les permissions disponibles
   */
  async getAllPermissions(): Promise<Permission[]> {
    return await Permission.query().where('isActive', true).orderBy('resource').orderBy('action')
  }

  /**
   * Récupère les permissions d'un rôle
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const role = await Role.find(roleId)
    if (!role) {
      throw new Error('Rôle introuvable')
    }

    return await role.getActivePermissions()
  }

  /**
   * Récupère les permissions d'un utilisateur (via son rôle)
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    const user = await User.query()
      .where('id', userId)
      .preload('role', (roleQuery) => {
        roleQuery.preload('permissions', (permQuery) => {
          permQuery.where('isActive', true)
        })
      })
      .first()

    if (!user || !user.role) {
      return []
    }

    return user.role.permissions
  }

  /**
   * Initialise les permissions par défaut du système
   */
  async seedDefaultPermissions(): Promise<void> {
    const permissions = [
      // Permissions utilisateurs
      { name: 'users.read', description: 'Consulter les utilisateurs', resource: 'users', action: 'read' },
      { name: 'users.create', description: 'Créer des utilisateurs', resource: 'users', action: 'create' },
      { name: 'users.update', description: 'Modifier les utilisateurs', resource: 'users', action: 'update' },
      { name: 'users.delete', description: 'Supprimer les utilisateurs', resource: 'users', action: 'delete' },
      { name: 'users.manage', description: 'Gestion complète des utilisateurs', resource: 'users', action: 'manage' },

      // Permissions notifications
      { name: 'notifications.read', description: 'Consulter les notifications', resource: 'notifications', action: 'read' },
      { name: 'notifications.create', description: 'Créer des notifications', resource: 'notifications', action: 'create' },
      { name: 'notifications.update', description: 'Modifier les notifications', resource: 'notifications', action: 'update' },
      { name: 'notifications.delete', description: 'Supprimer les notifications', resource: 'notifications', action: 'delete' },
      { name: 'notifications.manage', description: 'Gestion complète des notifications', resource: 'notifications', action: 'manage' },

      // Permissions parties
      { name: 'parties.read', description: 'Consulter les parties', resource: 'parties', action: 'read' },
      { name: 'parties.create', description: 'Créer des parties', resource: 'parties', action: 'create' },
      { name: 'parties.update', description: 'Modifier les parties', resource: 'parties', action: 'update' },
      { name: 'parties.delete', description: 'Supprimer les parties', resource: 'parties', action: 'delete' },
      { name: 'parties.manage', description: 'Gestion complète des parties', resource: 'parties', action: 'manage' },

      // Permissions analytics
      { name: 'analytics.read', description: 'Consulter les analytics', resource: 'analytics', action: 'read' },
      { name: 'analytics.manage', description: 'Gestion complète des analytics', resource: 'analytics', action: 'manage' },

      // Permissions système
      { name: 'system.read', description: 'Consulter la configuration système', resource: 'system', action: 'read' },
      { name: 'system.update', description: 'Modifier la configuration système', resource: 'system', action: 'update' },
      { name: 'system.manage', description: 'Gestion complète du système', resource: 'system', action: 'manage' }
    ]

    for (const permissionData of permissions) {
      const existingPermission = await Permission.query()
        .where('name', permissionData.name)
        .first()

      if (!existingPermission) {
        await Permission.create({
          name: permissionData.name,
          description: permissionData.description,
          resource: permissionData.resource as PermissionResource,
          action: permissionData.action as PermissionAction,
          isActive: true
        })
      }
    }
  }

  /**
   * Assigne les permissions par défaut aux rôles existants
   */
  async assignDefaultRolePermissions(): Promise<void> {
    const adminRole = await Role.query().where('name', 'ADMIN').first()
    const moderatorRole = await Role.query().where('name', 'MODERATOR').first()
    
    if (adminRole) {
      // Les admins ont toutes les permissions
      const allPermissions = await Permission.query().where('isActive', true)
      const systemUserId = 1 // Système
      
      for (const permission of allPermissions) {
        try {
          await adminRole.grantPermission(permission.id, systemUserId)
        } catch (error) {
          // Permission déjà assignée, ignorer
        }
      }
    }

    if (moderatorRole) {
      // Les modérateurs ont des permissions limitées
      const moderatorPermissions = [
        'users.read',
        'notifications.read',
        'notifications.update',
        'parties.read',
        'parties.create',
        'parties.update',
        'analytics.read'
      ]
      
      const systemUserId = 1 // Système
      
      for (const permissionName of moderatorPermissions) {
        const permission = await Permission.query().where('name', permissionName).first()
        if (permission) {
          try {
            await moderatorRole.grantPermission(permission.id, systemUserId)
          } catch (error) {
            // Permission déjà assignée, ignorer
          }
        }
      }
    }
  }
}