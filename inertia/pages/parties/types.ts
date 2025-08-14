/**
 * Types TypeScript pour les pages Parties
 * Définit les interfaces pour les props Inertia et les données de parties
 */

// Import des types de base du DTO
import type { PartieResponseDto, PartieListResponseDto } from '#application/dto/partie_response_dto'

/**
 * Props reçues par la page Index.vue via Inertia
 */
export interface PartiesIndexProps {
  parties: PartieListResponseDto
  filters: {
    current: {
      status?: string
      gameType?: string
    }
    available: {
      statuses: string[]
      gameTypes: string[]
    }
  }
  user: {
    id: number
    fullName: string
  }
}

/**
 * Filtres locaux pour l'état Vue réactif
 */
export interface PartiesFilters {
  status?: string
  gameType?: string
  search?: string
}

/**
 * État de chargement pour les opérations asynchrones
 */
export interface LoadingState {
  loading: boolean
  error: string | null
  operation?: 'filter' | 'pagination' | 'refresh' | 'delete'
}

/**
 * Partie enrichie pour l'affichage UI
 */
export interface PartieUI extends PartieResponseDto {
  // Propriétés calculées pour l'UI
  statusColor: 'gray' | 'blue' | 'green' | 'red'
  statusLabel: string
  gameTypeLabel: string
  duration?: string
  playersText: string
  canContinue: boolean
  canDelete: boolean
}

/**
 * Configuration des actions disponibles sur une partie
 */
export interface PartieActions {
  canView: boolean
  canContinue: boolean
  canDelete: boolean
  canDuplicate: boolean
  canShare: boolean
}

/**
 * Données d'événement pour les actions partie
 */
export interface PartieActionEvent {
  partieId: string
  action: 'view' | 'continue' | 'delete' | 'duplicate' | 'share'
  partie: PartieResponseDto
}

/**
 * Configuration de pagination pour Vue
 */
export interface PaginationConfig {
  hasMore: boolean
  nextCursor?: string
  currentPage: number
  totalCount?: number
  loading: boolean
}

/**
 * Types pour les émissions d'événements des composants
 */
export interface ComponentEvents {
  // Événements PartieCard
  'partie-action': [event: PartieActionEvent]
  'view-details': [partieId: string]
  
  // Événements PartieFilters
  'filter-change': [filters: PartiesFilters]
  'clear-filters': []
  
  // Événements PartieList
  'load-more': []
  'refresh': []
  
  // Événements globaux
  'create-new': []
  'error': [message: string]
}

/**
 * Utilitaires de type pour Vue
 */
export type EmitFunction = (event: keyof ComponentEvents, ...args: any[]) => void

/**
 * Configuration du composant pour les slots
 */
export interface SlotProps {
  partie: PartieUI
  loading: boolean
  error: string | null
}