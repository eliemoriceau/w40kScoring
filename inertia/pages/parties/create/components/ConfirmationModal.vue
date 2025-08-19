<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div class="modal-overlay" @click="$emit('cancel')">
        <div class="modal-container" @click.stop>
          <!-- Header -->
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button @click="$emit('cancel')" class="modal-close" title="Fermer">✕</button>
          </div>

          <!-- Contenu -->
          <div class="modal-body">
            <div class="modal-icon">⚠️</div>
            <p class="modal-message">{{ message }}</p>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button @click="$emit('cancel')" class="btn-cancel">
              {{ cancelLabel }}
            </button>
            <button @click="$emit('confirm')" class="btn-confirm">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirmer',
  cancelLabel: 'Annuler',
})

defineEmits<{
  confirm: void
  cancel: void
}>()
</script>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

/* Container principal */
.modal-container {
  background: linear-gradient(135deg, #1a0000 0%, #000000 50%, #1a0000 100%);
  border: 2px solid #dc143c;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.7),
    0 0 20px rgba(220, 20, 60, 0.3);
  overflow: hidden;
  position: relative;
}

.modal-container::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #dc143c, #ffd700, #dc143c);
  border-radius: 14px;
  z-index: -1;
  opacity: 0.6;
}

/* Header */
.modal-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(220, 20, 60, 0.5);
}

.modal-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

/* Corps du modal */
.modal-body {
  padding: 2rem 1.5rem;
  text-align: center;
}

.modal-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: pulse-warning 2s infinite;
}

.modal-message {
  margin: 0;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

/* Actions */
.modal-actions {
  padding: 0 1.5rem 1.5rem 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 100px;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.btn-confirm {
  background: linear-gradient(135deg, #dc143c, #8b0000);
  border: 1px solid #ffd700;
  color: white;
}

.btn-confirm:hover {
  background: linear-gradient(135deg, #8b0000, #dc143c);
  box-shadow: 0 0 20px rgba(220, 20, 60, 0.5);
  transform: translateY(-1px);
}

/* Animations */
@keyframes pulse-warning {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Transitions d'entrée/sortie */
.modal-enter-active {
  transition: all 0.3s ease-out;
}

.modal-leave-active {
  transition: all 0.2s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.8) translateY(-50px);
}

/* Responsive */
@media (max-width: 480px) {
  .modal-container {
    margin: 1rem;
  }

  .modal-header {
    padding: 1rem 1rem 0 1rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .modal-body {
    padding: 1.5rem 1rem;
  }

  .modal-message {
    font-size: 1rem;
  }

  .modal-actions {
    padding: 0 1rem 1rem 1rem;
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
  }
}
</style>
