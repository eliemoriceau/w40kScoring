import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Role from './role.js'

export type PermissionResource = 'users' | 'notifications' | 'parties' | 'analytics' | 'system'
export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'manage'

/**
 * Modèle Permission pour le système de permissions granulaires
 */
export default class Permission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare resource: PermissionResource

  @column()
  declare action: PermissionAction

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Role, {
    pivotTable: 'role_permissions'
  })
  declare roles: ManyToMany<typeof Role>

  /**
   * Vérifie si la permission correspond à un pattern de ressource/action
   */
  matches(resource: string, action: string): boolean {
    return (
      this.resource === resource &&
      (this.action === action || this.action === 'manage')
    )
  }

  /**
   * Génère une clé unique pour la permission
   */
  get permissionKey(): string {
    return `${this.resource}:${this.action}`
  }

  /**
   * Retourne le nom d'affichage de la permission
   */
  get displayName(): string {
    const resourceNames = {
      users: 'Utilisateurs',
      notifications: 'Notifications',
      parties: 'Parties',
      analytics: 'Analytics',
      system: 'Système'
    }

    const actionNames = {
      read: 'Consulter',
      create: 'Créer',
      update: 'Modifier',
      delete: 'Supprimer',
      manage: 'Gérer'
    }

    return `${actionNames[this.action]} ${resourceNames[this.resource]}`
  }
}