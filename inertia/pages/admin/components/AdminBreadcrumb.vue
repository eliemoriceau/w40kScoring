<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="flex items-center space-x-2">
      <li v-for="(item, index) in items" :key="index" class="flex items-center">
        <!-- Séparateur (sauf pour le premier élément) -->
        <svg
          v-if="index > 0"
          class="w-4 h-4 text-slate-500 mx-2"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M9.293 16.707a1 1 0 010-1.414L13.586 12 9.293 7.707a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
          />
        </svg>

        <!-- Element du breadcrumb -->
        <Link
          v-if="item.href && index < items.length - 1"
          :href="item.href"
          class="text-slate-400 hover:text-slate-300 transition-colors text-sm"
        >
          {{ item.label }}
        </Link>
        <span
          v-else
          class="text-slate-300 text-sm font-medium"
          :class="{ 'text-red-400': index === items.length - 1 }"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { Link } from '@inertiajs/vue3'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
}

defineProps<Props>()
</script>
