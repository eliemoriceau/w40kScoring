<template>
  <div class="w40k-wizard-container">
    <!-- Header du wizard avec indicateur de progression -->
    <div class="wizard-header">
      <div class="max-w-4xl mx-auto px-4">
        <h1 class="wizard-title">⚔️ Créer une Nouvelle Bataille</h1>
        <p class="wizard-subtitle">
          Configurez votre partie Warhammer 40K en {{ totalSteps }} étapes
        </p>

        <!-- Indicateur de progression -->
        <StepIndicator
          :current-step="currentStep"
          :total-steps="totalSteps"
          :validation="validation"
        />

        <!-- Barre de progression -->
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${completionProgress}%` }" />
        </div>
      </div>
    </div>

    <!-- Contenu principal du wizard -->
    <main class="wizard-main">
      <div class="max-w-4xl mx-auto px-4">
        <Transition name="wizard-transition" mode="out-in">
          <KeepAlive>
            <component
              :is="currentStepComponent"
              :data="wizardData"
              :props="stepProps"
              :errors="wizardState.errors"
              :loading="isLoading"
              @update:data="handleDataUpdate"
              @next="handleNext"
              @previous="handlePrevious"
              @complete="handleComplete"
              @validate="handleValidation"
            />
          </KeepAlive>
        </Transition>
      </div>
    </main>

    <!-- Footer avec informations contextuelles -->
    <div class="wizard-footer">
      <div class="max-w-4xl mx-auto px-4">
        <div class="footer-content">
          <div class="step-info">
            Étape {{ currentStep }} sur {{ totalSteps }}
            <span v-if="completionProgress > 0">({{ completionProgress }}% complété)</span>
          </div>

          <div class="shortcuts">
            <button
              v-if="canGoPrevious"
              @click="handlePrevious"
              class="shortcut-btn"
              title="Précédent (Alt + ←)"
            >
              ← Précédent
            </button>

            <button @click="handleSaveProgress" class="shortcut-btn" title="Sauvegarder (Ctrl + S)">
              💾 Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications toast -->
    <div v-if="notification" class="notification-container">
      <NotificationToast :notification="notification" @dismiss="notification = null" />
    </div>

    <!-- Modal de confirmation de sortie -->
    <ConfirmationModal
      v-if="showExitConfirmation"
      title="Quitter la création ?"
      message="Vos données seront sauvegardées automatiquement."
      confirm-label="Quitter"
      cancel-label="Rester"
      @confirm="handleExit"
      @cancel="showExitConfirmation = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, onUnmounted } from 'vue'
import { router } from '@inertiajs/vue3'
import { useGameWizard } from './composables/use_game_wizard'
import { useGameValidation } from './composables/use_game_validation'
import type { WizardProps, NotificationData } from './types/wizard'

// Import des composants
import StepIndicator from './components/StepIndicator.vue'
import NotificationToast from './components/NotificationToast.vue'
import ConfirmationModal from './components/ConfirmationModal.vue'

// Props depuis le serveur
const props = defineProps<WizardProps>()

// Composables
const {
  wizardState,
  currentStep,
  wizardData,
  validation,
  isLoading,
  canGoNext,
  canGoPrevious,
  isLastStep,
  completionProgress,
  goToNextStep,
  goToPreviousStep,
  updateData,
  validateCurrentStep,
  setLoading,
  initialize,
  saveToStorage,
  clearStorage,
} = useGameWizard()

const { validateForSubmission } = useGameValidation()

// État local
const totalSteps = 5
const notification = ref<NotificationData | null>(null)
const showExitConfirmation = ref(false)

// Chargement paresseux des composants d'étapes
const currentStepComponent = computed(() => {
  const components = {
    1: defineAsyncComponent(() => import('./components/Step1GameConfig.vue')),
    2: defineAsyncComponent(() => import('./components/Step2Opponent.vue')),
    3: defineAsyncComponent(() => import('./components/Step3Players.vue')),
    4: defineAsyncComponent(() => import('./components/Step4Rounds.vue')),
    5: defineAsyncComponent(() => import('./components/Step5Summary.vue')),
  }

  return components[currentStep.value]
})

// Props spécifiques à chaque étape
const stepProps = computed(() => {
  const baseProps = { ...props }

  // Ajouter des props spécifiques selon l'étape
  switch (currentStep.value) {
    case 1:
      return {
        ...baseProps,
        defaultPointsLimit: 2000,
      }
    case 2:
      return {
        ...baseProps,
        userFriends: props.userFriends,
      }
    case 3:
      return {
        ...baseProps,
        currentUser: props.currentUser,
      }
    default:
      return baseProps
  }
})

// Gestionnaires d'événements
const handleDataUpdate = (data: any) => {
  updateData(data)
}

const handleNext = () => {
  if (canGoNext.value) {
    goToNextStep()
  }
}

const handlePrevious = () => {
  if (canGoPrevious.value) {
    goToPreviousStep()
  }
}

const handleComplete = async () => {
  if (!isLastStep.value) return

  // Validation finale
  const validation = validateForSubmission(wizardData.value)

  if (!validation.isValid) {
    showNotification({
      type: 'error',
      title: '❌ Validation échouée',
      message: 'Veuillez corriger les erreurs avant de créer la partie.',
      duration: 5000,
    })
    return
  }

  // Afficher les avertissements s'il y en a
  if (validation.warnings.length > 0) {
    showNotification({
      type: 'warning',
      title: '⚠️ Avertissements',
      message: validation.warnings.join('. '),
      duration: 6000,
    })
  }

  setLoading(true)

  try {
    // Soumettre au serveur via Inertia
    router.post('/parties/create', wizardData.value, {
      onSuccess: () => {
        clearStorage()
        showNotification({
          type: 'success',
          title: '⚔️ Bataille Créée !',
          message: "Que l'Empereur guide vos actions dans cette bataille !",
          duration: 5000,
        })
      },
      onError: (errors) => {
        console.error('Creation failed:', errors)
        showNotification({
          type: 'error',
          title: '💀 Échec de Création',
          message: 'Les forces du Chaos ont perturbé la création de la bataille.',
          duration: 8000,
        })
      },
      onFinish: () => {
        setLoading(false)
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    setLoading(false)
    showNotification({
      type: 'error',
      title: '💀 Erreur Inattendue',
      message: "Une erreur inattendue s'est produite.",
      duration: 8000,
    })
  }
}

const handleValidation = () => {
  validateCurrentStep()
}

const handleSaveProgress = () => {
  saveToStorage()
  showNotification({
    type: 'success',
    title: '💾 Progression Sauvegardée',
    message: 'Vos données ont été sauvegardées.',
    duration: 3000,
  })
}

const handleExit = () => {
  saveToStorage()
  router.visit('/parties')
}

// Notifications
const showNotification = (notif: NotificationData) => {
  notification.value = notif

  if (notif.duration) {
    setTimeout(() => {
      notification.value = null
    }, notif.duration)
  }
}

// Gestionnaires de clavier
const handleKeydown = (event: KeyboardEvent) => {
  // Navigation avec Alt + flèches
  if (event.altKey) {
    if (event.key === 'ArrowLeft' && canGoPrevious.value) {
      event.preventDefault()
      handlePrevious()
    } else if (event.key === 'ArrowRight' && canGoNext.value) {
      event.preventDefault()
      handleNext()
    }
  }

  // Sauvegarde avec Ctrl + S
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    handleSaveProgress()
  }

  // Échap pour confirmation de sortie
  if (event.key === 'Escape') {
    showExitConfirmation.value = true
  }
}

// Gestion de fermeture de l'onglet
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (completionProgress.value > 0) {
    const message = 'Êtes-vous sûr de vouloir quitter ? Vos données seront sauvegardées.'
    event.returnValue = message
    return message
  }
}

// Lifecycle
onMounted(() => {
  // Initialiser le wizard avec les données du serveur
  const initialData = {
    players: [
      {
        pseudo: props.currentUser.pseudo,
        userId: props.currentUser.id,
        isCurrentUser: true,
      },
    ],
  }

  initialize(initialData)

  // Ajouter les gestionnaires d'événements
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  // Nettoyer les gestionnaires d'événements
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<script lang="ts">
import AppLayout from '~/Layouts/AppLayout.vue'

export default {
  layout: AppLayout,
}
</script>

<style scoped>
/* Container principal avec thème W40K */
.w40k-wizard-container {
  background: linear-gradient(
    135deg,
    #000000 0%,
    #1a0000 25%,
    #000000 50%,
    #1a0000 75%,
    #000000 100%
  );
  min-height: 100vh;
  position: relative;
}

/* Effet de fond avec particules */
.w40k-wizard-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(220, 20, 60, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(139, 0, 0, 0.08) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* Header du wizard */
.wizard-header {
  position: relative;
  z-index: 1;
  padding: 2rem 0;
  border-bottom: 2px solid rgba(220, 20, 60, 0.3);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
}

.wizard-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(220, 20, 60, 0.5);
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
}

.wizard-subtitle {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

/* Barre de progression */
.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b0000, #dc143c, #ffd700);
  border-radius: 2px;
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(220, 20, 60, 0.5);
}

/* Contenu principal */
.wizard-main {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 3rem 0;
}

/* Footer */
.wizard-footer {
  position: relative;
  z-index: 1;
  padding: 1.5rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.step-info {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.shortcuts {
  display: flex;
  gap: 0.5rem;
}

.shortcut-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.shortcut-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(220, 20, 60, 0.5);
}

/* Notifications */
.notification-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
}

/* Animations de transition */
.wizard-transition-enter-active,
.wizard-transition-leave-active {
  transition: all 0.3s ease-in-out;
}

.wizard-transition-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.wizard-transition-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Responsive */
@media (max-width: 768px) {
  .wizard-title {
    font-size: 2rem;
  }

  .wizard-main {
    padding: 2rem 0;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .notification-container {
    top: 1rem;
    right: 1rem;
    left: 1rem;
  }
}

/* Animations */
@keyframes pulse-w40k {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(220, 20, 60, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(220, 20, 60, 0.6);
  }
}

/* Classes utilitaires */
.loading {
  pointer-events: none;
  opacity: 0.7;
}
</style>
