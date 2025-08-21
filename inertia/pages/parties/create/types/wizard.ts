/**
 * Types TypeScript pour le Wizard de Création de Game W40K
 */

export type WizardStep = 1 | 2 | 3 | 4

export type GameType = 'MATCHED_PLAY' | 'NARRATIVE' | 'OPEN_PLAY'
export type OpponentType = 'existing' | 'invite' | 'guest'
export type ScoreType = 'PRIMARY' | 'SECONDARY' | 'CHALLENGER'

export interface GameCreationWizardData {
  // Étape 1: Configuration de base
  gameType: GameType
  pointsLimit: number
  mission?: string

  // Étape 2: Adversaire
  opponentType: OpponentType
  opponentId?: number
  opponentEmail?: string
  opponentPseudo?: string

  // Étape 3: Joueurs
  players: Array<{
    pseudo: string
    army?: string
    userId?: number
    isCurrentUser?: boolean
  }>

  // Étape 4: Rounds
  enableRounds: boolean
  rounds: Array<{
    roundNumber: number
    playerScore?: number
    opponentScore?: number
    scores?: Array<{
      playerId: string
      scoreType: ScoreType
      scoreName?: string
      scoreValue: number
    }>
  }>
}

export interface WizardProps {
  availableMissions: Array<{ id: number; name: string; description: string }>
  gameTypes: Array<{ value: GameType; displayName: string }>
  userFriends: Array<{ id: number; pseudo: string; avatar?: string }>
  currentUser: { id: number; pseudo: string; email: string }
}

export interface StepValidation {
  step1: boolean
  step2: boolean
  step3: boolean
  step4: boolean
}

export interface WizardState {
  currentStep: WizardStep
  data: GameCreationWizardData
  validation: StepValidation
  errors: Record<string, string[]>
  loading: boolean
}

export interface User {
  id: number
  pseudo: string
  email?: string
  avatar?: string
}

export interface Mission {
  id: number
  name: string
  description: string
}

export interface GameTypeOption {
  value: GameType
  displayName: string
  description?: string
}

// Types pour les événements du wizard
export interface WizardEvents {
  'next': void
  'previous': void
  'complete': void
  'step-change': WizardStep
  'data-change': Partial<GameCreationWizardData>
}

// Types pour les notifications
export interface NotificationData {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}
