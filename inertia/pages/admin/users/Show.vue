<template>
  <AdminLayout :user="pageUser" :breadcrumb-items="breadcrumbItems">
    <div class="space-y-6">
      <!-- En-tête utilisateur -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-4">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div
                class="h-16 w-16 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center text-white font-bold text-xl shadow-lg"
              >
                {{ user.username.charAt(0).toUpperCase() }}
              </div>
            </div>

            <!-- Informations principales -->
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-2xl font-bold text-white">{{ user.username }}</h1>
                <span
                  class="inline-flex px-3 py-1 text-sm font-semibold rounded-full"
                  :class="getRoleBadgeClasses(user.role.permissionLevel)"
                >
                  {{ user.role.name }}
                </span>
              </div>

              <div class="space-y-1 text-sm">
                <p class="text-slate-300">{{ user.email }}</p>
                <p v-if="user.fullName" class="text-slate-400">{{ user.fullName }}</p>
                <div class="flex items-center gap-4 text-slate-500">
                  <span>Membre depuis {{ user.createdAt }}</span>
                  <span>•</span>
                  <span>Dernière activité {{ user.updatedAt }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="flex items-center gap-2">
            <button
              @click="showEditModal = true"
              class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Modifier
            </button>

            <button
              @click="resetPassword"
              class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
              :disabled="resettingPassword"
            >
              <svg
                v-if="resettingPassword"
                class="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v-2l-4.257-4.257A6 6 0 0111 7m0-5c0-1.105-.895-2-2-2s-2 .895-2 2c0 1.105.895 2 2 2s2-.895 2-2z"
                />
              </svg>
              {{ resettingPassword ? 'Reset...' : 'Reset Password' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Statistiques utilisateur -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-slate-400 text-sm">Parties Jouées</p>
              <p class="text-xl font-bold text-white">{{ user.stats.totalParties }}</p>
            </div>
            <div class="bg-purple-600 p-2 rounded-full">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-slate-400 text-sm">Victoires</p>
              <p class="text-xl font-bold text-white">{{ user.stats.partiesWon }}</p>
            </div>
            <div class="bg-green-600 p-2 rounded-full">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-slate-400 text-sm">Taux de Victoire</p>
              <p class="text-xl font-bold text-white">
                {{ Math.round(user.stats.winRate * 100) }}%
              </p>
            </div>
            <div class="bg-blue-600 p-2 rounded-full">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-slate-400 text-sm">Dernière Activité</p>
              <p class="text-sm font-medium text-white">
                {{ formatDate(user.stats.lastActivity) }}
              </p>
            </div>
            <div class="bg-yellow-600 p-2 rounded-full">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu principal avec onglets -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg">
        <!-- Navigation des onglets -->
        <div class="border-b border-slate-700">
          <nav class="flex px-6">
            <button
              @click="activeTab = 'profile'"
              class="py-4 px-6 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === 'profile'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
              "
            >
              Profil
            </button>
            <button
              @click="activeTab = 'permissions'"
              class="py-4 px-6 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === 'permissions'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
              "
            >
              Permissions
            </button>
            <button
              @click="activeTab = 'activity'"
              class="py-4 px-6 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === 'activity'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
              "
            >
              Activité
            </button>
            <button
              @click="activeTab = 'security'"
              class="py-4 px-6 text-sm font-medium border-b-2 transition-colors"
              :class="
                activeTab === 'security'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
              "
            >
              Sécurité
            </button>
          </nav>
        </div>

        <!-- Contenu des onglets -->
        <div class="p-6">
          <!-- Onglet Profil -->
          <div v-show="activeTab === 'profile'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Informations de base -->
              <div>
                <h3 class="text-lg font-semibold text-red-300 mb-4">Informations personnelles</h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-400"
                      >Nom d'utilisateur</label
                    >
                    <p class="text-white">{{ user.username }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-400">Adresse email</label>
                    <p class="text-white">{{ user.email }}</p>
                  </div>
                  <div v-if="user.fullName">
                    <label class="block text-sm font-medium text-slate-400">Nom complet</label>
                    <p class="text-white">{{ user.fullName }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-400">Newsletter</label>
                    <p class="text-white">
                      {{ user.newsletterConsent ? 'Abonné' : 'Non abonné' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Métadonnées -->
              <div>
                <h3 class="text-lg font-semibold text-red-300 mb-4">Métadonnées du compte</h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-400">Date de création</label>
                    <p class="text-white">{{ user.createdAt }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-400"
                      >Dernière modification</label
                    >
                    <p class="text-white">{{ user.updatedAt }}</p>
                  </div>
                  <div v-if="user.termsAcceptedAt">
                    <label class="block text-sm font-medium text-slate-400">CGU acceptées le</label>
                    <p class="text-white">{{ user.termsAcceptedAt }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-400">ID système</label>
                    <p class="text-white font-mono text-sm">{{ user.id }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Onglet Permissions -->
          <div v-show="activeTab === 'permissions'" class="space-y-6">
            <!-- Rôle actuel -->
            <div>
              <h3 class="text-lg font-semibold text-red-300 mb-4">Rôle et Niveau de Permission</h3>
              <div class="bg-slate-700/50 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="flex items-center gap-3 mb-2">
                      <span
                        class="inline-flex px-3 py-1 text-sm font-semibold rounded-full"
                        :class="getRoleBadgeClasses(user.role.permissionLevel)"
                      >
                        {{ user.role.name }}
                      </span>
                      <span class="text-slate-400 text-sm"
                        >Niveau {{ user.role.permissionLevel }}</span
                      >
                    </div>
                    <p class="text-sm text-slate-400">
                      {{ getRoleDescription(user.role.permissionLevel) }}
                    </p>
                  </div>
                  <button
                    @click="showRoleChangeModal = true"
                    class="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded text-white text-sm transition-colors"
                  >
                    Modifier le rôle
                  </button>
                </div>
              </div>
            </div>

            <!-- Permissions détaillées -->
            <div>
              <h3 class="text-lg font-semibold text-red-300 mb-4">Permissions Accordées</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="permission in getPermissions(user.role.permissionLevel)"
                  :key="permission.name"
                  class="bg-slate-700/50 rounded-lg p-4 flex items-start space-x-3"
                >
                  <div class="flex-shrink-0">
                    <svg
                      class="w-5 h-5 mt-0.5"
                      :class="permission.granted ? 'text-green-400' : 'text-red-400'"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        v-if="permission.granted"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path
                        v-else
                        d="M18.364 5.636l-1.414 1.414L12 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12 5.636 7.05l1.414-1.414L12 10.586l4.95-4.95z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">{{ permission.name }}</p>
                    <p class="text-xs text-slate-400">{{ permission.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Onglet Activité -->
          <div v-show="activeTab === 'activity'" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-red-300 mb-4">Activité Récente</h3>
              <div class="text-center py-12">
                <svg
                  class="mx-auto h-12 w-12 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-slate-300">Aucune activité récente</h3>
                <p class="mt-1 text-sm text-slate-500">
                  L'historique d'activité sera affiché ici une fois implémenté.
                </p>
              </div>
            </div>
          </div>

          <!-- Onglet Sécurité -->
          <div v-show="activeTab === 'security'" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-red-300 mb-4">Options de Sécurité</h3>

              <!-- Actions de sécurité -->
              <div class="space-y-4">
                <!-- Réinitialisation mot de passe -->
                <div class="bg-slate-700/50 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-medium text-white">
                        Réinitialisation du mot de passe
                      </h4>
                      <p class="text-sm text-slate-400">
                        Générer un nouveau mot de passe temporaire
                      </p>
                    </div>
                    <button
                      @click="resetPassword"
                      class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-white text-sm transition-colors"
                      :disabled="resettingPassword"
                    >
                      {{ resettingPassword ? 'Reset...' : 'Réinitialiser' }}
                    </button>
                  </div>
                </div>

                <!-- Statut du compte -->
                <div class="bg-slate-700/50 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-medium text-white">Statut du compte</h4>
                      <p class="text-sm text-slate-400">
                        <span class="inline-flex items-center">
                          <span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                          Actif
                        </span>
                      </p>
                    </div>
                    <button
                      class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white text-sm transition-colors"
                      :disabled="user.role.permissionLevel >= 3"
                      title="Impossible de suspendre un administrateur"
                    >
                      Suspendre
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <UserEditModal
      v-if="showEditModal"
      :user="user"
      :roles="roles"
      @close="showEditModal = false"
      @updated="handleUserUpdated"
    />

    <RoleChangeModal
      v-if="showRoleChangeModal"
      :user="user"
      :roles="roles"
      @close="showRoleChangeModal = false"
      @updated="handleUserUpdated"
    />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'
import AdminLayout from '../components/AdminLayout.vue'
import UserEditModal from './components/UserEditModal.vue'
import RoleChangeModal from './components/RoleChangeModal.vue'

// Props
interface Props {
  pageUser: any // L'utilisateur connecté (pour AdminLayout)
  user: {
    id: number
    username: string
    email: string
    fullName: string | null
    role: {
      id: number
      name: string
      permissionLevel: number
    }
    newsletterConsent: boolean
    termsAcceptedAt?: string
    createdAt: string
    updatedAt: string
    stats: {
      totalParties: number
      partiesWon: number
      winRate: number
      lastActivity: Date
    }
  }
  roles: Array<{
    id: number
    name: string
    permissionLevel: number
  }>
  breadcrumbItems: Array<{
    label: string
    href?: string
  }>
}

defineProps<Props>()

// État du composant
const activeTab = ref<'profile' | 'permissions' | 'activity' | 'security'>('profile')
const showEditModal = ref(false)
const showRoleChangeModal = ref(false)
const resettingPassword = ref(false)

// Handlers
const handleUserUpdated = () => {
  showEditModal.value = false
  showRoleChangeModal.value = false
  router.reload({ only: ['user'] })
}

const resetPassword = () => {
  if (resettingPassword.value) return

  resettingPassword.value = true

  router.post(
    `/admin/users/${user.id}/reset-password`,
    {},
    {
      onFinish: () => {
        resettingPassword.value = false
      },
    }
  )
}

// Utilitaires
const getRoleBadgeClasses = (permissionLevel: number) => {
  const classes = {
    1: 'bg-slate-100 text-slate-800', // USER
    2: 'bg-blue-100 text-blue-800', // MODERATOR
    3: 'bg-red-100 text-red-800', // ADMIN
  }
  return classes[permissionLevel as keyof typeof classes] || classes[1]
}

const getRoleDescription = (permissionLevel: number) => {
  const descriptions = {
    1: "Accès basique à l'application et gestion de ses propres parties",
    2: 'Peut voir et modérer les utilisateurs, accès aux outils de modération',
    3: 'Accès complet au panel administrateur et toutes les fonctionnalités',
  }
  return descriptions[permissionLevel as keyof typeof descriptions] || descriptions[1]
}

const getPermissions = (permissionLevel: number) => {
  const allPermissions = [
    {
      name: 'Créer des parties',
      description: 'Peut créer et gérer ses parties',
      granted: permissionLevel >= 1,
    },
    {
      name: 'Voir le profil',
      description: 'Accès à son profil utilisateur',
      granted: permissionLevel >= 1,
    },
    {
      name: 'Voir les utilisateurs',
      description: 'Peut consulter la liste des utilisateurs',
      granted: permissionLevel >= 2,
    },
    {
      name: 'Modérer le contenu',
      description: 'Peut modérer les parties et commentaires',
      granted: permissionLevel >= 2,
    },
    {
      name: 'Panel administrateur',
      description: 'Accès complet au panel admin',
      granted: permissionLevel >= 3,
    },
    {
      name: 'Gérer les utilisateurs',
      description: 'Créer, modifier, supprimer des utilisateurs',
      granted: permissionLevel >= 3,
    },
    {
      name: 'Gérer les rôles',
      description: 'Modifier les rôles et permissions',
      granted: permissionLevel >= 3,
    },
    {
      name: 'Configuration système',
      description: 'Modifier la configuration du système',
      granted: permissionLevel >= 3,
    },
  ]

  return allPermissions
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
