/**
 * Composable global pour le formatage cohérent des données
 * Évite les problèmes d'hydration SSR/Client
 */
export function useFormatting() {
  /**
   * Formate un nombre de manière cohérente entre serveur et client
   * Utilise toujours la locale française pour éviter les différences d'hydration
   */
  const formatNumber = (value: number): string => {
    return value.toLocaleString('fr-FR')
  }

  /**
   * Formate les points W40K
   * Alias de formatNumber pour la cohérence
   */
  const formatPoints = (points: number): string => {
    return formatNumber(points)
  }

  /**
   * Formate un score (peut être null/undefined)
   */
  const formatScore = (score?: number | null): string => {
    return score != null ? formatNumber(score) : '0'
  }

  /**
   * Formate une date pour l'affichage cohérent
   */
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj)
  }

  /**
   * Formate une date relative (il y a X temps)
   */
  const formatRelativeDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()

    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? "À l'instant" : `Il y a ${diffMinutes}min`
    }
    if (diffHours < 24) {
      return `Il y a ${diffHours}h`
    }
    if (diffDays < 7) {
      return `Il y a ${diffDays}j`
    }

    return formatDate(dateObj)
  }

  return {
    formatNumber,
    formatPoints,
    formatScore,
    formatDate,
    formatRelativeDate,
  }
}