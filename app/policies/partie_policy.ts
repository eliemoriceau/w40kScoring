import User from '#models/user'

/**
 * Policy pour gérer l'accès aux parties
 * Suit les bonnes pratiques AdonisJS Authorization
 */
export default class PartiePolicy {
  /**
   * Vérifie si l'utilisateur peut voir une partie
   * Seul le propriétaire de la partie peut la voir
   */
  view(user: User, partieUserId: number) {
    return user.id === partieUserId
  }

  /**
   * Vérifie si l'utilisateur peut éditer une partie
   * Seul le propriétaire peut éditer
   */
  edit(user: User, partieUserId: number) {
    return user.id === partieUserId
  }

  /**
   * Vérifie si l'utilisateur peut supprimer une partie
   * Seul le propriétaire peut supprimer
   */
  delete(user: User, partieUserId: number) {
    return user.id === partieUserId
  }
}
