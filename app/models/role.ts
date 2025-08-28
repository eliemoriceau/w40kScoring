import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Permission from './permission.js'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare permissionLevel: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => User)
  declare users: HasMany<typeof User>

  @manyToMany(() => Permission, {
    pivotTable: 'role_permissions',
    pivotTimestamps: true,
    pivotColumns: ['granted_at', 'granted_by'],
  })
  declare permissions: ManyToMany<typeof Permission>

  /**
   * Vérifie si le rôle a une permission spécifique
   */
  async hasPermission(resource: string, action: string): Promise<boolean> {
    await this.load('permissions')

    return this.permissions.some(
      (permission) => permission.isActive && permission.matches(resource, action)
    )
  }

  /**
   * Vérifie si le rôle peut effectuer une action sur une ressource
   * Utilise le niveau de permission comme fallback pour la rétrocompatibilité
   */
  async canPerform(resource: string, action: string): Promise<boolean> {
    // Vérifier d'abord les permissions granulaires
    const hasGranularPermission = await this.hasPermission(resource, action)
    if (hasGranularPermission) {
      return true
    }

    // Fallback sur le système de niveau de permission existant
    // ADMIN (level 3) peut tout faire
    if (this.permissionLevel >= 3) {
      return true
    }

    // MODERATOR (level 2) peut lire la plupart des ressources
    if (this.permissionLevel >= 2 && action === 'read') {
      return ['users', 'parties', 'notifications'].includes(resource)
    }

    return false
  }

  /**
   * Ajoute une permission au rôle
   */
  async grantPermission(permissionId: number, grantedBy: number): Promise<void> {
    await this.related('permissions').attach({
      [permissionId]: {
        granted_at: DateTime.now(),
        granted_by: grantedBy,
      },
    })
  }

  /**
   * Retire une permission du rôle
   */
  async revokePermission(permissionId: number): Promise<void> {
    await this.related('permissions').detach([permissionId])
  }

  /**
   * Retourne toutes les permissions actives du rôle
   */
  async getActivePermissions(): Promise<Permission[]> {
    await this.load('permissions', (query) => {
      query.where('is_active', true)
    })

    return this.permissions
  }
}
