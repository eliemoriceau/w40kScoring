<template>
  <div class="step-indicator">
    <div class="steps-container">
      <div
        v-for="step in totalSteps"
        :key="`step-${step}`"
        class="step-item"
        :class="getStepClass(step)"
      >
        <!-- Icône ou numéro de l'étape -->
        <div class="step-icon">
          <span v-if="validation[`step${step}` as keyof StepValidation]" class="completed-icon">
            ✅
          </span>
          <span v-else-if="step === currentStep" class="current-icon"> ⚔️ </span>
          <span v-else class="step-number">
            {{ step }}
          </span>
        </div>

        <!-- Label de l'étape -->
        <div class="step-label">
          {{ getStepLabel(step) }}
        </div>

        <!-- Ligne de connexion vers l'étape suivante -->
        <div
          v-if="step < totalSteps"
          class="step-connector"
          :class="{ completed: validation[`step${step}` as keyof StepValidation] }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StepValidation } from '../types/wizard'

interface Props {
  currentStep: number
  totalSteps: number
  validation: StepValidation
}

defineProps<Props>()

const getStepClass = (step: number) => {
  const props = getCurrentInstance()?.props as Props

  return {
    completed: props.validation[`step${step}` as keyof StepValidation],
    current: step === props.currentStep,
    pending: step > props.currentStep && !props.validation[`step${step}` as keyof StepValidation],
    accessible:
      step <= props.currentStep || props.validation[`step${step - 1}` as keyof StepValidation],
  }
}

const getStepLabel = (step: number): string => {
  const labels = {
    1: 'Configuration',
    2: 'Adversaire',
    3: 'Joueurs',
    4: 'Rounds',
    5: 'Récapitulatif',
  }
  return labels[step as keyof typeof labels] || `Étape ${step}`
}
</script>

<script lang="ts">
import { getCurrentInstance } from 'vue'
</script>

<style scoped>
.step-indicator {
  margin: 2rem 0;
}

.steps-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 100px;
}

/* Icône de l'étape */
.step-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  background-clip: padding-box;
}

/* États des étapes */
.step-item.completed .step-icon {
  background: linear-gradient(135deg, #228b22, #32cd32);
  color: white;
  box-shadow: 0 0 20px rgba(34, 139, 34, 0.5);
  border-color: #228b22;
}

.step-item.current .step-icon {
  background: linear-gradient(135deg, #dc143c, #8b0000);
  color: #ffd700;
  box-shadow:
    0 0 25px rgba(220, 20, 60, 0.6),
    0 0 40px rgba(220, 20, 60, 0.3);
  border-color: #ffd700;
  animation: pulse-current 2s infinite;
}

.step-item.pending .step-icon {
  background: linear-gradient(135deg, #2d3748, #4a5568);
  color: #a0aec0;
  border-color: #4a5568;
}

.step-item.accessible:not(.current):not(.completed) .step-icon:hover {
  background: linear-gradient(135deg, #4a5568, #2d3748);
  border-color: #dc143c;
  cursor: pointer;
  transform: scale(1.05);
}

/* Labels des étapes */
.step-label {
  margin-top: 0.8rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  transition: color 0.3s ease;
}

.step-item.completed .step-label {
  color: #32cd32;
}

.step-item.current .step-label {
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.step-item.pending .step-label {
  color: #a0aec0;
}

/* Connecteurs entre étapes */
.step-connector {
  position: absolute;
  top: 30px;
  left: 100%;
  width: calc(100% - 30px);
  height: 4px;
  background: linear-gradient(90deg, #4a5568, #2d3748);
  z-index: 1;
  transition: background 0.3s ease;
}

.step-connector.completed {
  background: linear-gradient(90deg, #228b22, #32cd32);
  box-shadow: 0 0 10px rgba(34, 139, 34, 0.4);
}

/* Animations */
@keyframes pulse-current {
  0%,
  100% {
    box-shadow:
      0 0 25px rgba(220, 20, 60, 0.6),
      0 0 40px rgba(220, 20, 60, 0.3);
  }
  50% {
    box-shadow:
      0 0 35px rgba(220, 20, 60, 0.8),
      0 0 50px rgba(220, 20, 60, 0.5);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .steps-container {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .step-item {
    min-width: 80px;
  }

  .step-icon {
    width: 50px;
    height: 50px;
    font-size: 1rem;
  }

  .step-label {
    font-size: 0.8rem;
  }

  .step-connector {
    display: none; /* Masquer les connecteurs sur mobile */
  }
}

@media (max-width: 480px) {
  .steps-container {
    justify-content: space-around;
  }

  .step-item {
    min-width: 60px;
  }

  .step-icon {
    width: 40px;
    height: 40px;
    font-size: 0.9rem;
  }

  .step-label {
    font-size: 0.75rem;
    margin-top: 0.5rem;
  }
}
</style>
