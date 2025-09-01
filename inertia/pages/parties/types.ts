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
  errorParam?: string | null
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

// ================================
// Types pour l'édition inline des scores (Phase 2)
// ================================

export interface RoundDto {
  id: number
  roundNumber: number
  playerScore: number // Score du joueur principal (défaut 0)
  opponentScore: number // Score de l'adversaire (défaut 0)
  isCompleted: boolean
  gameId: number
  createdAt: string
  updatedAt: string
  // Nouveau mapping pour associer correctement les joueurs à leurs scores
  playerScores: { [playerId: number]: number } // Map playerId -> score
}

export interface SecondaryScoreDto {
  id: number
  roundId: number
  playerId: number
  scoreName: string
  scoreValue: number // Score secondaire (0-15)
  createdAt: string
  updatedAt: string
}

export interface GameDetailDto {
  id: number
  userId: number
  gameType: string
  pointsLimit: number
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  mission?: string
  deployment?: string
  primaryScoringMethod?: string
  notes?: string
  winner?: 'PLAYER' | 'OPPONENT' | 'DRAW'
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export interface PlayerDto {
  id: number
  pseudo: string
  userId?: number
  isMainPlayer?: boolean // Optionnel car calculé côté backend
  totalScore: number
  gameId: number
}

export interface GameMetaDto {
  title: string
  statusLabel: string
  gameTypeLabel: string
  canEdit: boolean
}

// Events pour la communication entre composants
export interface ScoreUpdateEvent {
  roundId: number
  playerId: number
  score: number
  scoreType: 'primary' | 'secondary'
}

export interface SecondaryScoreUpdateEvent {
  roundId: number
  playerId: number
  scoreName: string
  scoreValue: number
}

// Propriétés pour les composants
export interface ScoreCellProps {
  round: RoundDto
  player: PlayerDto
  gameId: number
  editable: boolean
  current?: boolean
  scoreType?: 'primary' | 'secondary'
}

export interface RoundRowProps {
  round: RoundDto
  players: PlayerDto[]
  gameId: number
  canEdit: boolean
  currentRound: number
  allowEditCompleted?: boolean
}

export interface GameScoreBoardProps {
  game: GameDetailDto
  players: PlayerDto[]
  rounds: RoundDto[]
  secondaryScores: SecondaryScoreDto[]
  canEdit: boolean
}

export interface SecondaryScoresProps {
  players: PlayerDto[]
  secondaryScores: SecondaryScoreDto[]
  rounds: RoundDto[]
  canEdit: boolean
}

// États locaux pour les composants
export interface ScoreCellState {
  isEditing: boolean
  editValue: number
  isSaving: boolean
  hasError: boolean
}

export interface RoundRowState {
  isEditing: boolean
  editingCellId: string | null
}

// Utilitaires
export interface ScoreValidation {
  isValid: boolean
  message?: string
  min: number
  max: number
}

export interface OptimisticUpdate {
  roundId: number
  playerId: number
  oldValue: number | null
  newValue: number
  timestamp: number
}

// ================================
// Types pour la modal de sélection des secondaires
// ================================

export interface SecondaryObjective {
  id: string
  name: string
  description: string
  maxPoints: number
  category: 'tactical' | 'strategic' | 'warden' | 'custom'
}

export interface PredefinedSecondaryObjectives {
  tactical: SecondaryObjective[]
  strategic: SecondaryObjective[]
  warden: SecondaryObjective[]
}

export interface SelectedSecondaryScore {
  id: string // UUID temporaire pour la session
  objectiveId: string // Référence à l'objectif
  name: string
  score: number
  maxPoints: number
}

export interface SecondarySelectionModalProps {
  isOpen: boolean
  playerId: number
  playerName: string
  roundId: number
  roundNumber: number
  existingScores: SecondaryScoreDto[]
  onSave: (scores: SelectedSecondaryScore[]) => void
  onClose: () => void
}

export interface SecondarySelectionModalState {
  selectedObjectives: SelectedSecondaryScore[]
  customObjectiveName: string
  customObjectiveScore: number
  searchFilter: string
  activeCategory: 'tactical' | 'strategic' | 'warden' | 'all'
  isSaving: boolean
  validationErrors: Record<string, string>
}

// ================================
// Types pour les selects inline des secondaires
// ================================

export interface SecondaryObjectiveOption {
  value: string
  label: string
  category: 'tactical' | 'strategic' | 'warden' | 'custom'
  maxPoints: number
}

export interface SecondaryScoreRow {
  id: string // UUID temporaire pour la ligne
  objectiveId: string
  objectiveName: string
  score: number
  isNew: boolean
  isEditing: boolean
  isSaving: boolean
}

export interface SecondaryInlineState {
  rows: SecondaryScoreRow[]
  availableObjectives: SecondaryObjectiveOption[]
  customObjectiveName: string
}

// ================================
// Types pour le compteur de round courant
// ================================

export interface RoundCounterState {
  currentRound: number
  totalRounds: number
  canNavigate: boolean
  roundHistory: number[]
}

export interface RoundNavigationEvent {
  previousRound: number
  currentRound: number
  roundId: number
}
