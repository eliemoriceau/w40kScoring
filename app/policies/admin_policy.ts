import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import User from '#models/user'

/**
 * Policy pour les autorisations administrateur
 * Définit qui peut effectuer quelles actions dans le panel admin
 */
export default class AdminPolicy {
  /**
   * Vérifier si l'utilisateur a un accès administrateur
   */
  adminAccess(user: User): AuthorizerResponse {
    return user.role?.permissionLevel >= 3
  }

  /**
   * Vérifier si l'utilisateur peut voir la liste des utilisateurs
   */
  viewUsers(user: User): AuthorizerResponse {
    return user.role?.permissionLevel >= 2 // MODERATOR ou ADMIN
  }

  /**
   * Vérifier si l'utilisateur peut voir le détail d'un utilisateur
   */
  viewUser(user: User, targetUser?: User): AuthorizerResponse {
    // MODERATOR peut voir, ADMIN peut voir
    if (user.role?.permissionLevel >= 2) {
      return true
    }

    // Un utilisateur peut voir son propre profil
    if (targetUser && user.id === targetUser.id) {
      return true
    }

    return false
  }

  /**
   * Vérifier si l'utilisateur peut créer des utilisateurs
   */
  createUser(user: User): AuthorizerResponse {
    return user.role?.permissionLevel >= 3 // ADMIN seulement
  }

  /**
   * Vérifier si l'utilisateur peut modifier un utilisateur
   */
  editUser(user: User, targetUser?: User): AuthorizerResponse {
    // ADMIN peut modifier n'importe qui
    if (user.role?.permissionLevel >= 3) {
      return true
    }

    // Un utilisateur peut modifier son propre profil (données limitées)
    if (targetUser && user.id === targetUser.id) {
      return true
    }

    return false
  }

  /**
   * Vérifier si l'utilisateur peut supprimer un utilisateur
   */
  deleteUser(user: User, targetUser?: User): AuthorizerResponse {
    // Seuls les ADMIN peuvent supprimer
    if (user.role?.permissionLevel < 3) {
      return false
    }

    // Ne peut pas se supprimer soi-même
    if (targetUser && user.id === targetUser.id) {
      return false
    }

    return true
  }

  /**
   * Vérifier si l'utilisateur peut changer le rôle d'un utilisateur
   */
  changeUserRole(user: User, targetUser?: User): AuthorizerResponse {
    // Seuls les ADMIN peuvent changer les rôles
    if (user.role?.permissionLevel < 3) {
      return false
    }

    // Ne peut pas changer son propre rôle
    if (targetUser && user.id === targetUser.id) {
      return false
    }

    return true
  }

  /**
   * Vérifier si l'utilisateur peut réinitialiser les mots de passe
   */
  resetPassword(user: User, targetUser?: User): AuthorizerResponse {
    // ADMIN peut réinitialiser n'importe quel mot de passe
    if (user.role?.permissionLevel >= 3) {
      return true
    }

    // MODERATOR peut réinitialiser les mots de passe des utilisateurs normaux
    if (user.role?.permissionLevel >= 2 && targetUser?.role?.permissionLevel === 1) {
      return true
    }

    return false
  }

  /**
   * Vérifier si l'utilisateur peut bannir/suspendre des utilisateurs
   */
  banUser(user: User, targetUser?: User): AuthorizerResponse {
    // MODERATOR et ADMIN peuvent bannir
    if (user.role?.permissionLevel < 2) {
      return false
    }

    // Ne peut pas se bannir soi-même
    if (targetUser && user.id === targetUser.id) {
      return false
    }

    // MODERATOR ne peut pas bannir ADMIN
    if (user.role?.permissionLevel === 2 && targetUser?.role?.permissionLevel >= 3) {
      return false
    }

    return true
  }

  /**
   * Vérifier si l'utilisateur peut exporter les données utilisateurs
   */
  exportUsers(user: User): AuthorizerResponse {
    return user.role?.permissionLevel >= 2 // MODERATOR ou ADMIN
  }

  /**
   * Vérifier si l'utilisateur peut effectuer des actions en lot
   */
  bulkActions(user: User): AuthorizerResponse {
    return user.role?.permissionLevel >= 3 // ADMIN seulement
  }

  /**
   * Vérifier si l'utilisateur peut voir les logs d'audit
   */
  viewAuditLogs(user: User): AuthorizerResponse {
    return user.role?.permissionLevel >= 3 // ADMIN seulement
  }

  /**
   * Vérifier si l'utilisateur peut voir les statistiques avancées
   */
  viewAdvancedStats(user: User): AuthorizerResponse {
    return user.role?.permissionLevel >= 2 // MODERATOR ou ADMIN
  }

  /**
   * Vérifier si l'utilisateur peut accéder aux outils système
   */
  accessSystemTools(user: User): AuthorizerResponse {
    return user.role?.permissionLevel >= 3 // ADMIN seulement
  }

  /**
   * Vérifier si l'utilisateur peut modifier la configuration système
   */
  editSystemConfig(user: User): AuthorizerResponse {
    return user.role?.permissionLevel >= 3 // ADMIN seulement
  }

  /**
   * Vérifier si l'utilisateur peut gérer les rôles et permissions
   */
  manageRoles(user: User): AuthorizerResponse {
    return user.role?.permissionLevel >= 3 // ADMIN seulement
  }

  /**
   * Vérifier si l'utilisateur peut voir les données sensibles
   */
  viewSensitiveData(user: User): AuthorizerResponse {
    return user.role?.permissionLevel >= 3 // ADMIN seulement
  }
}
