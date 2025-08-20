/**
 * Composable principal pour la gestion du wizard de création de game
 */

import { ref, computed, readonly } from 'vue'
import type {
  WizardState,
  WizardStep,
  GameCreationWizardData,
  StepValidation,
  GameType,
  OpponentType,
} from '../types/wizard'

const STORAGE_KEY = 'w40k_game_wizard_data'

export const useGameWizard = () => {
  // État initial du wizard
  const getInitialData = (): GameCreationWizardData => ({
    // Étape 1
    gameType: 'MATCHED_PLAY' as GameType,
    pointsLimit: 2000,
    mission: undefined,

    // Étape 2
    opponentType: 'existing' as OpponentType,
    opponentId: undefined,
    opponentEmail: undefined,
    opponentPseudo: undefined,

    // Étape 3
    players: [],

    // Rounds supprimés du wizard - seront ajoutés après création
    enableRounds: false,
    rounds: [],
  })

  const getInitialValidation = (): StepValidation => ({
    step1: false,
    step2: false,
    step3: false,
    step4: false, // Step4 devient summary (anciennement step5)
  })

  // État réactif du wizard
  const wizardState = ref<WizardState>({
    currentStep: 1,
    data: getInitialData(),
    validation: getInitialValidation(),
    errors: {},
    loading: false,
  })

  // Computed properties
  const currentStep = computed(() => wizardState.value.currentStep)
  const wizardData = computed(() => wizardState.value.data)
  const validation = computed(() => wizardState.value.validation)
  const isLoading = computed(() => wizardState.value.loading)
  const hasErrors = computed(() => Object.keys(wizardState.value.errors).length > 0)

  const canGoNext = computed(() => {
    const currentStepNumber = wizardState.value.currentStep
    return wizardState.value.validation[`step${currentStepNumber}` as keyof StepValidation]
  })

  const canGoPrevious = computed(() => wizardState.value.currentStep > 1)
  const isLastStep = computed(() => wizardState.value.currentStep === 4)

  const completionProgress = computed(() => {
    const completed = Object.values(wizardState.value.validation).filter(Boolean).length
    return Math.round((completed / 4) * 100)
  })

  // Actions de navigation
  const goToStep = (step: WizardStep) => {
    if (step >= 1 && step <= 4) {
      wizardState.value.currentStep = step
      saveToStorage()
    }
  }

  const goToNextStep = () => {
    if (canGoNext.value && !isLastStep.value) {
      wizardState.value.currentStep = Math.min(4, wizardState.value.currentStep + 1) as WizardStep
      saveToStorage()
    }
  }

  const goToPreviousStep = () => {
    if (canGoPrevious.value) {
      wizardState.value.currentStep = Math.max(1, wizardState.value.currentStep - 1) as WizardStep
      saveToStorage()
    }
  }

  // Mise à jour des données
  const updateData = (data: Partial<GameCreationWizardData>) => {
    wizardState.value.data = { ...wizardState.value.data, ...data }
    validateCurrentStep()
    saveToStorage()
  }

  const resetData = () => {
    wizardState.value.data = getInitialData()
    wizardState.value.validation = getInitialValidation()
    wizardState.value.currentStep = 1
    wizardState.value.errors = {}
    clearStorage()
  }

  // Validation des étapes
  const validateStep1 = (): boolean => {
    const { gameType, pointsLimit } = wizardState.value.data
    return !!(gameType && pointsLimit >= 500 && pointsLimit <= 5000 && pointsLimit % 50 === 0)
  }

  const validateStep2 = (): boolean => {
    const { opponentType, opponentId, opponentEmail, opponentPseudo } = wizardState.value.data

    if (opponentType === 'existing') {
      return !!opponentId && opponentId > 0
    }

    if (opponentType === 'invite') {
      return !!opponentEmail && opponentEmail.includes('@')
    }

    if (opponentType === 'guest') {
      return !!opponentPseudo && opponentPseudo.trim().length >= 3
    }

    return false
  }

  const validateStep3 = (): boolean => {
    const { players } = wizardState.value.data
    return players.length === 2 && players.every((p) => p.pseudo && p.pseudo.trim().length >= 3)
  }

  const validateStep4 = (): boolean => {
    // Step4 devient summary - valide si toutes les étapes précédentes sont valides
    return validateStep1() && validateStep2() && validateStep3()
  }

  const validateCurrentStep = () => {
    const validators = {
      1: validateStep1,
      2: validateStep2,
      3: validateStep3,
      4: validateStep4,
    }

    const currentStepNumber = wizardState.value.currentStep
    const isValid = validators[currentStepNumber]()

    wizardState.value.validation[`step${currentStepNumber}` as keyof StepValidation] = isValid

    // Mettre à jour la validation de l'étape 4 si on n'y est pas encore
    if (currentStepNumber !== 4) {
      wizardState.value.validation.step4 = validateStep4()
    }
  }

  const validateAllSteps = () => {
    wizardState.value.validation = {
      step1: validateStep1(),
      step2: validateStep2(),
      step3: validateStep3(),
      step4: validateStep4(),
    }
  }

  // Gestion des erreurs
  const setError = (field: string, messages: string[]) => {
    wizardState.value.errors[field] = messages
  }

  const clearError = (field: string) => {
    delete wizardState.value.errors[field]
  }

  const clearAllErrors = () => {
    wizardState.value.errors = {}
  }

  // Persistance en session storage
  const saveToStorage = () => {
    try {
      const dataToSave = {
        currentStep: wizardState.value.currentStep,
        data: wizardState.value.data,
        validation: wizardState.value.validation,
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.warn('Failed to save wizard data to storage:', error)
    }
  }

  const loadFromStorage = () => {
    try {
      const savedData = sessionStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        wizardState.value.currentStep = parsed.currentStep || 1
        wizardState.value.data = { ...getInitialData(), ...parsed.data }
        wizardState.value.validation = { ...getInitialValidation(), ...parsed.validation }
      }
    } catch (error) {
      console.warn('Failed to load wizard data from storage:', error)
    }
  }

  const clearStorage = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear wizard storage:', error)
    }
  }

  // Actions de gestion
  const setLoading = (loading: boolean) => {
    wizardState.value.loading = loading
  }

  // Initialisation
  const initialize = (initialData?: Partial<GameCreationWizardData>) => {
    if (initialData) {
      wizardState.value.data = { ...wizardState.value.data, ...initialData }
    }
    loadFromStorage()
    validateAllSteps()
  }

  return {
    // État (readonly)
    wizardState: readonly(wizardState),
    currentStep,
    wizardData,
    validation,
    isLoading,
    hasErrors,
    canGoNext,
    canGoPrevious,
    isLastStep,
    completionProgress,

    // Actions
    goToStep,
    goToNextStep,
    goToPreviousStep,
    updateData,
    resetData,
    validateCurrentStep,
    validateAllSteps,
    setError,
    clearError,
    clearAllErrors,
    setLoading,
    initialize,

    // Storage
    saveToStorage,
    loadFromStorage,
    clearStorage,
  }
}
