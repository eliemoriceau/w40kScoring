import { computed } from 'vue'
import type { PartieResponseDto, PartieUI } from '../types'

/**
 * Composable pour les utilitaires et helpers des parties
 * Contient la logique de transformation et d'enrichissement des données
 */
export function usePartiesHelpers() {
  /**
   * Enrichit les données des parties avec des informations d'affichage
   */
  const enrichParties = (parties: PartieResponseDto[]): PartieUI[] => {
    return parties.map(enrichPartie)
  }

  /**
   * Enrichit une partie individuelle
   */
  const enrichPartie = (partie: PartieResponseDto): PartieUI => {
    const statusColor = getStatusColor(partie.status)
    const statusLabel = getStatusLabel(partie.status)
    const gameTypeLabel = getGameTypeLabel(partie.gameType)
    const duration = calculateDuration(partie)
    const playersText = formatPlayersText(partie)
    const canContinue = partie.metadata?.canBeModified ?? false
    const canDelete = partie.status === 'PLANNED' || partie.status === 'CANCELLED'

    return {
      ...partie,
      statusColor,
      statusLabel,
      gameTypeLabel,
      duration,
      playersText,
      canContinue,
      canDelete,
    }
  }

  /**
   * Retourne la couleur associée à un statut
   */
  const getStatusColor = (status: string): 'gray' | 'blue' | 'green' | 'red' => {
    const statusColors: Record<string, 'gray' | 'blue' | 'green' | 'red'> = {
      PLANNED: 'gray',
      IN_PROGRESS: 'blue',
      COMPLETED: 'green',
      CANCELLED: 'red',
    }
    return statusColors[status] || 'gray'
  }

  /**
   * Retourne le label français pour un statut
   */
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      PLANNED: 'Planifiée',
      IN_PROGRESS: 'En cours',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
    }
    return statusLabels[status] || status
  }

  /**
   * Retourne le label français pour un type de jeu
   */
  const getGameTypeLabel = (gameType: string): string => {
    const gameTypeLabels: Record<string, string> = {
      MATCHED_PLAY: 'Jeu Équilibré',
      NARRATIVE: 'Narratif',
      OPEN_PLAY: 'Jeu Libre',
    }
    return gameTypeLabels[gameType] || gameType
  }

  /**
   * Calcule la durée d'une partie
   */
  const calculateDuration = (partie: PartieResponseDto): string | undefined => {
    if (!partie.startedAt) return undefined

    const start = new Date(partie.startedAt)
    const end = partie.completedAt ? new Date(partie.completedAt) : new Date()

    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}min`
    }
    return `${diffMinutes}min`
  }

  /**
   * Formate le texte d'affichage des joueurs
   */
  const formatPlayersText = (partie: PartieResponseDto): string => {
    // Note: Cette logique sera adaptée quand les données joueurs seront disponibles
    if (partie.opponentId) {
      return 'Vous vs Adversaire'
    }
    return 'Partie solo'
  }

  /**
   * Formate une date pour l'affichage
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

  /**
   * Retourne l'icône SVG pour un type de jeu
   */
  const getGameTypeIcon = (gameType: string): string => {
    const icons: Record<string, string> = {
      MATCHED_PLAY: '⚔️',
      NARRATIVE: '📖',
      OPEN_PLAY: '🎮',
    }
    return icons[gameType] || '🎯'
  }

  /**
   * Calcule les statistiques de score
   */
  const getScoreStats = (partie: PartieResponseDto) => {
    const playerScore = partie.playerScore || 0
    const opponentScore = partie.opponentScore || 0
    const total = playerScore + opponentScore

    return {
      playerScore,
      opponentScore,
      total,
      playerPercentage: total > 0 ? Math.round((playerScore / total) * 100) : 0,
      winner:
        playerScore > opponentScore ? 'player' : playerScore < opponentScore ? 'opponent' : 'draw',
      margin: Math.abs(playerScore - opponentScore),
    }
  }

  return {
    enrichParties,
    enrichPartie,
    getStatusColor,
    getStatusLabel,
    getGameTypeLabel,
    formatPlayersText,
    formatDate,
    formatRelativeDate,
    getGameTypeIcon,
    getScoreStats,
    calculateDuration,
  }
}
