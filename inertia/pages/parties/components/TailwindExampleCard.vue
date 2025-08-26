<template>
  <div class="bg-w40k-bg-secondary border-2 border-w40k-red-500 rounded-lg p-6 shadow-w40k-lg">
    <!-- Header avec icône -->
    <div class="flex items-center space-x-3 mb-4">
      <div class="w-10 h-10 bg-w40k-red-500 rounded-full flex items-center justify-center">
        <span class="text-white font-bold">{{ icon }}</span>
      </div>
      <h3 class="text-xl font-semibold text-w40k-text-primary">{{ title }}</h3>
    </div>

    <!-- Contenu -->
    <p class="text-w40k-text-secondary mb-6 leading-relaxed">
      {{ description }}
    </p>

    <!-- Actions -->
    <div class="flex flex-col sm:flex-row gap-3">
      <button
        @click="onPrimaryAction"
        class="px-4 py-2 bg-w40k-red-500 hover:bg-w40k-red-600 text-white rounded transition-colors duration-200 font-medium"
      >
        {{ primaryActionText }}
      </button>
      <button
        @click="onSecondaryAction"
        class="px-4 py-2 bg-transparent border-2 border-w40k-gold-500 text-w40k-gold-400 hover:bg-w40k-gold-500 hover:text-w40k-bg-primary rounded transition-colors duration-200 font-medium"
      >
        {{ secondaryActionText }}
      </button>
    </div>

    <!-- Status indicator -->
    <div v-if="status" class="mt-4 pt-4 border-t border-w40k-text-subtle">
      <div class="flex items-center space-x-2">
        <div
          class="w-3 h-3 rounded-full"
          :class="{
            'bg-green-500': status === 'success',
            'bg-w40k-gold-500': status === 'warning',
            'bg-w40k-red-500': status === 'error',
          }"
        ></div>
        <span
          class="text-sm font-medium"
          :class="{
            'text-green-400': status === 'success',
            'text-w40k-gold-400': status === 'warning',
            'text-w40k-red-400': status === 'error',
          }"
        >
          {{ statusText }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: string
  title: string
  description: string
  primaryActionText: string
  secondaryActionText: string
  status?: 'success' | 'warning' | 'error'
  statusText?: string
}

defineProps<Props>()

const emit = defineEmits<{
  'primary-action': []
  'secondary-action': []
}>()

const onPrimaryAction = () => {
  emit('primary-action')
}

const onSecondaryAction = () => {
  emit('secondary-action')
}
</script>
