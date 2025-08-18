<template>
  <Transition name="notification" appear>
    <div 
      class="notification-toast"
      :class="notificationClass"
      @click="handleClick"
    >
      <!-- Icône selon le type -->
      <div class="notification-icon">
        <span v-if="notification.type === 'success'">✅</span>
        <span v-else-if="notification.type === 'error'">❌</span>
        <span v-else-if="notification.type === 'warning'">⚠️</span>
        <span v-else-if="notification.type === 'info'">ℹ️</span>
      </div>

      <!-- Contenu -->
      <div class="notification-content">
        <h4 class="notification-title">{{ notification.title }}</h4>
        <p class="notification-message">{{ notification.message }}</p>
        
        <!-- Action optionnelle -->
        <button 
          v-if="notification.action"
          @click.stop="handleAction"
          class="notification-action"
        >
          {{ notification.action.label }}
        </button>
      </div>

      <!-- Bouton de fermeture -->
      <button 
        @click.stop="$emit('dismiss')"
        class="notification-close"
        title="Fermer"
      >
        ✕
      </button>

      <!-- Barre de progression si durée définie -->
      <div 
        v-if="notification.duration"
        class="notification-progress"
        :style="{ animationDuration: `${notification.duration}ms` }"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NotificationData } from '../types/wizard'

interface Props {
  notification: NotificationData
}

const props = defineProps<Props>()
const emit = defineEmits<{
  dismiss: void
}>()

const notificationClass = computed(() => ({
  [`notification-${props.notification.type}`]: true,
  'has-action': !!props.notification.action
}))

const handleClick = () => {
  // Fermer en cliquant sur la notification (sauf si action)
  if (!props.notification.action) {
    emit('dismiss')
  }
}

const handleAction = () => {
  if (props.notification.action?.onClick) {
    props.notification.action.onClick()
  }
  emit('dismiss')
}
</script>

<style scoped>
.notification-toast {
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 400px;
  min-width: 300px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.3s ease;
}

.notification-toast:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.6),
    0 0 25px rgba(255, 255, 255, 0.15);
}

/* Types de notifications */
.notification-success {
  border-left: 4px solid #228b22;
  background: linear-gradient(135deg, rgba(34, 139, 34, 0.1), rgba(0, 0, 0, 0.9));
}

.notification-error {
  border-left: 4px solid #dc143c;
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.1), rgba(0, 0, 0, 0.9));
}

.notification-warning {
  border-left: 4px solid #ffa500;
  background: linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(0, 0, 0, 0.9));
}

.notification-info {
  border-left: 4px solid #4682b4;
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.1), rgba(0, 0, 0, 0.9));
}

/* Icône */
.notification-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

/* Contenu */
.notification-content {
  flex: 1;
}

.notification-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.notification-message {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

/* Action */
.notification-action {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #dc143c, #8b0000);
  border: 1px solid #ffd700;
  color: white;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.notification-action:hover {
  background: linear-gradient(135deg, #8b0000, #dc143c);
  box-shadow: 0 0 15px rgba(220, 20, 60, 0.5);
  transform: translateY(-1px);
}

/* Bouton de fermeture */
.notification-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

/* Barre de progression */
.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(90deg, #dc143c, #ffd700);
  animation: progress-countdown linear forwards;
  transform-origin: left;
}

@keyframes progress-countdown {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Animations d'entrée/sortie */
.notification-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.notification-leave-active {
  transition: all 0.3s ease-in;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.8);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}

/* Responsive */
@media (max-width: 480px) {
  .notification-toast {
    max-width: 90vw;
    min-width: 280px;
    margin: 0 1rem;
  }
  
  .notification-title {
    font-size: 1rem;
  }
  
  .notification-message {
    font-size: 0.85rem;
  }
}

/* Animation d'hover pour les notifications avec action */
.has-action:hover .notification-action {
  animation: pulse-action 1s infinite;
}

@keyframes pulse-action {
  0%, 100% {
    box-shadow: 0 0 0 rgba(220, 20, 60, 0.7);
  }
  50% {
    box-shadow: 0 0 10px rgba(220, 20, 60, 0.7);
  }
}
</style>