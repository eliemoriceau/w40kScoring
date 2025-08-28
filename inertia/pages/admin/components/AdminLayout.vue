<template>
  <div class="min-h-screen bg-slate-900">
    <!-- Header Admin W40K -->
    <header class="bg-slate-800 border-b-2 border-red-800 shadow-lg">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h1 class="text-2xl font-bold text-red-400 flex items-center gap-2">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"
                />
              </svg>
              ADMINISTRATEUR W40K
            </h1>
            <AdminBreadcrumb v-if="breadcrumbItems" :items="breadcrumbItems" />
          </div>

          <div class="flex items-center gap-4">
            <div class="text-slate-300 text-sm">
              <span class="font-semibold">{{ user.username }}</span>
              <span class="text-slate-400 ml-2">({{ user.role?.name }})</span>
            </div>
            <Link
              href="/"
              class="bg-slate-600 hover:bg-slate-700 px-3 py-2 rounded text-white text-sm transition-colors"
            >
              ← Retour App
            </Link>
            <form @submit.prevent="logout">
              <button
                type="submit"
                class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white text-sm transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar Navigation -->
      <AdminNav />

      <!-- Main Content -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>

    <!-- Toast Notifications -->
    <div v-if="$page.props.flash?.success" class="fixed top-4 right-4 z-50">
      <div class="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg">
        {{ $page.props.flash.success }}
      </div>
    </div>
    <div v-if="$page.props.flash?.error" class="fixed top-4 right-4 z-50">
      <div class="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg">
        {{ $page.props.flash.error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Link, router } from '@inertiajs/vue3'
import AdminNav from './AdminNav.vue'
import AdminBreadcrumb from './AdminBreadcrumb.vue'

interface Props {
  user: {
    id: number
    username: string
    fullName: string
    email: string
    role?: {
      id: number
      name: string
      permissionLevel: number
    }
  }
  breadcrumbItems?: Array<{
    label: string
    href?: string
  }>
}

defineProps<Props>()

const logout = () => {
  router.post('/auth/logout')
}
</script>

<style scoped>
/* Animation pour les notifications toast */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
