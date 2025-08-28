<template>
  <AdminLayout :user="user" :breadcrumb-items="breadcrumbItems">
    <div class="space-y-8">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-red-400">Tableau de Bord Administrateur</h1>
          <p class="text-slate-300 mt-2">
            Bienvenue {{ user.fullName || user.username }}, voici un aperçu de l'activité du
            système.
          </p>
        </div>
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-slate-300 text-sm font-medium">Système Opérationnel</span>
          </div>
          <div class="text-xs text-slate-400 mt-1">Phase 1 - Infrastructure de Base</div>
        </div>
      </div>

      <!-- Métriques Principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Utilisateurs -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-slate-400 text-sm">Total Utilisateurs</p>
              <p class="text-2xl font-bold text-white">{{ metrics.totalUsers }}</p>
            </div>
            <div class="bg-blue-600 p-3 rounded-full">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div class="mt-4 text-xs text-slate-400">Inscriptions totales sur la plateforme</div>
        </div>

        <!-- Utilisateurs Actifs -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-slate-400 text-sm">Utilisateurs Actifs</p>
              <p class="text-2xl font-bold text-white">{{ metrics.activeUsers }}</p>
            </div>
            <div class="bg-green-600 p-3 rounded-full">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-4 text-xs text-slate-400">Activité dans les 30 derniers jours</div>
        </div>

        <!-- Total Parties -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-slate-400 text-sm">Total Parties</p>
              <p class="text-2xl font-bold text-white">{{ metrics.totalParties }}</p>
            </div>
            <div class="bg-purple-600 p-3 rounded-full">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
          <div class="mt-4 text-xs text-slate-400">Parties créées sur la plateforme</div>
        </div>

        <!-- Santé du Système -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-slate-400 text-sm">Santé Système</p>
              <p class="text-2xl font-bold text-white">{{ metrics.systemHealth }}%</p>
            </div>
            <div class="bg-red-600 p-3 rounded-full">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div class="mt-4 text-xs text-slate-400">Performance globale du système</div>
        </div>
      </div>

      <!-- Activité Récente -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Actions Récentes -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg">
          <div class="p-6 border-b border-slate-700">
            <h3 class="text-xl font-semibold text-red-300 flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Actions Récentes
            </h3>
          </div>
          <div class="p-6">
            <div v-if="recentActions.length === 0" class="text-center py-8 text-slate-400">
              <svg
                class="w-12 h-12 mx-auto mb-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p class="font-medium">Aucune action récente</p>
              <p class="text-sm text-slate-500 mt-1">Les actions administrateur apparaîtront ici</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="action in recentActions"
                :key="action.id"
                class="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50"
              >
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  :class="getSeverityClasses(action.severity)"
                >
                  {{ action.admin.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-slate-200">{{ action.action }}</p>
                  <p class="text-xs text-slate-400">
                    par <span class="font-medium">{{ action.admin }}</span> • {{ action.createdAt }}
                  </p>
                </div>
                <div
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="getSeverityBadgeClasses(action.severity)"
                >
                  {{ getSeverityLabel(action.severity) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Informations Système -->
        <div class="bg-slate-800 border border-red-800/50 rounded-lg">
          <div class="p-6 border-b border-slate-700">
            <h3 class="text-xl font-semibold text-red-300 flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informations Système
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <!-- Version & Phase -->
            <div class="flex items-center justify-between py-2 border-b border-slate-700">
              <span class="text-slate-400">Phase de Développement</span>
              <span class="text-slate-200 font-medium">Phase 1 - Infrastructure</span>
            </div>

            <!-- Fonctionnalités Disponibles -->
            <div>
              <h4 class="text-slate-300 font-medium mb-2">Fonctionnalités Actives</h4>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span class="text-sm text-slate-300">Dashboard Administrateur</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span class="text-sm text-slate-300">Audit Trail des Actions</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span class="text-sm text-slate-300">Contrôle d'Accès Sécurisé</span>
                </div>
              </div>
            </div>

            <!-- Prochaines Étapes -->
            <div>
              <h4 class="text-slate-300 font-medium mb-2">Prochaines Phases</h4>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span class="text-sm text-slate-400">Phase 2 - Gestion Utilisateurs</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span class="text-sm text-slate-400">Phase 3 - Modération Parties</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span class="text-sm text-slate-400">Phase 4 - Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from './components/AdminLayout.vue'

interface User {
  id: number
  username: string
  fullName: string | null
  email: string
  role: {
    id: number
    name: string
    permissionLevel: number
  } | null
}

interface Metrics {
  totalUsers: number
  activeUsers: number
  totalParties: number
  recentActionsCount: number
  systemHealth: number
}

interface RecentAction {
  id: number
  action: string
  admin: string
  targetType: string
  targetId: number | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
}

interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  user: User
  metrics: Metrics
  recentActions: RecentAction[]
  breadcrumbItems: BreadcrumbItem[]
}

defineProps<Props>()

const getSeverityClasses = (severity: string) => {
  const classes = {
    low: 'bg-slate-600 text-slate-200',
    medium: 'bg-blue-600 text-blue-100',
    high: 'bg-yellow-600 text-yellow-100',
    critical: 'bg-red-600 text-red-100',
  }
  return classes[severity as keyof typeof classes] || classes.low
}

const getSeverityBadgeClasses = (severity: string) => {
  const classes = {
    low: 'bg-slate-700 text-slate-300',
    medium: 'bg-blue-900 text-blue-300',
    high: 'bg-yellow-900 text-yellow-300',
    critical: 'bg-red-900 text-red-300',
  }
  return classes[severity as keyof typeof classes] || classes.low
}

const getSeverityLabel = (severity: string) => {
  const labels = {
    low: 'Info',
    medium: 'Normal',
    high: 'Important',
    critical: 'Critique',
  }
  return labels[severity as keyof typeof labels] || 'Info'
}
</script>
