<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  color?: 'primary' | 'secondary' | 'white' | 'gray'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
})

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

const colorClasses = {
  primary: 'text-yellow-500',
  secondary: 'text-red-500',
  white: 'text-white',
  gray: 'text-gray-400',
}
</script>

<template>
  <div class="flex flex-col items-center justify-center space-y-3">
    <!-- Spinner -->
    <div class="relative">
      <svg
        :class="[sizeClasses[size], colorClasses[color], 'animate-spin']"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>

    <!-- Texte de chargement -->
    <p
      v-if="text"
      :class="[
        'text-sm font-medium animate-pulse',
        colorClasses[color] === 'text-white' ? 'text-white' : 'text-gray-300',
      ]"
    >
      {{ text }}
    </p>
  </div>
</template>

<style scoped>
/* Animation personnalisée pour le spinner */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Animation pour le texte */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
