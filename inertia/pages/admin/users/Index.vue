<template>
  <AdminLayout :user="user" :breadcrumb-items="breadcrumbItems">
    <div class="space-y-6">
      <!-- En-tête avec actions principales -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-red-400">Gestion des Utilisateurs</h1>
          <p class="text-slate-300 mt-2">Gérez les utilisateurs, leurs rôles et permissions</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Nouvel Utilisateur
        </button>
      </div>

      <!-- Statistiques enrichies -->
      <UserStatsCards :stats="stats" />

      <!-- Barre de recherche et filtres -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <!-- Recherche -->
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-slate-300 mb-2">
              Rechercher des utilisateurs
            </label>
            <div class="relative">
              <input
                v-model="searchForm.search"
                @input="debounceSearch"
                type="text"
                placeholder="Nom d'utilisateur, email ou nom complet..."
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <svg
                class="absolute right-3 top-2.5 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <!-- Filtre par rôle -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"> Filtrer par rôle </label>
            <select
              v-model="searchForm.roleId"
              @change="applyFilters"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option :value="null">Tous les rôles</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }} ({{ role.permissionLevel }})
              </option>
            </select>
          </div>

          <!-- Tri -->
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2"> Trier par </label>
            <select
              v-model="searchForm.sort"
              @change="applyFilters"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="createdAt">Date de création</option>
              <option value="updatedAt">Dernière activité</option>
              <option value="username">Nom d'utilisateur</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="flex items-center justify-between mt-4">
          <div class="flex items-center gap-2">
            <button
              @click="clearFilters"
              class="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Effacer les filtres
            </button>
          </div>
          <div class="flex items-center gap-2 text-sm text-slate-400">
            <span>{{ users.length }} utilisateurs affichés</span>
            <span v-if="pagination.total > users.length">sur {{ pagination.total }}</span>
          </div>
        </div>
      </div>

      <!-- Tableau des utilisateurs -->
      <div class="bg-slate-800 border border-red-800/50 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-700 border-b border-slate-600">
              <tr>
                <th
                  class="px-6 py-4 text-left text-sm font-medium text-slate-300 uppercase tracking-wider"
                >
                  Utilisateur
                </th>
                <th
                  class="px-6 py-4 text-left text-sm font-medium text-slate-300 uppercase tracking-wider"
                >
                  Rôle
                </th>
                <th
                  class="px-6 py-4 text-left text-sm font-medium text-slate-300 uppercase tracking-wider"
                >
                  Inscrit le
                </th>
                <th
                  class="px-6 py-4 text-left text-sm font-medium text-slate-300 uppercase tracking-wider"
                >
                  Dernière activité
                </th>
                <th
                  class="px-6 py-4 text-right text-sm font-medium text-slate-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-600">
              <tr
                v-for="user in users"
                :key="user.id"
                class="hover:bg-slate-700/50 transition-colors"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div
                        class="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold"
                      >
                        {{ user.username.charAt(0).toUpperCase() }}
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-white">
                        {{ user.username }}
                        <span v-if="user.fullName" class="text-slate-400 font-normal">
                          ({{ user.fullName }})
                        </span>
                      </div>
                      <div class="text-sm text-slate-400">
                        {{ user.email }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getRoleBadgeClasses(user.role.permissionLevel)"
                  >
                    {{ user.role.name }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-300">
                  {{ user.createdAt }}
                </td>
                <td class="px-6 py-4 text-sm text-slate-300">
                  {{ user.updatedAt }}
                </td>
                <td class="px-6 py-4 text-right text-sm font-medium">
                  <div class="flex items-center justify-end gap-2">
                    <Link
                      :href="`/admin/users/${user.id}`"
                      class="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
                      title="Voir le détail"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </Link>
                    <button
                      @click="editUser(user)"
                      class="text-yellow-400 hover:text-yellow-300 p-1 rounded transition-colors"
                      title="Modifier"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      @click="confirmDelete(user)"
                      class="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                      title="Supprimer"
                      :disabled="user.role.permissionLevel >= 3"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- État vide -->
          <div v-if="users.length === 0" class="text-center py-12">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-slate-300">Aucun utilisateur trouvé</h3>
            <p class="mt-1 text-sm text-slate-500">
              {{
                searchForm.search
                  ? 'Essayez de modifier vos critères de recherche.'
                  : 'Commencez par créer un nouvel utilisateur.'
              }}
            </p>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.hasMore" class="bg-slate-700 px-6 py-4 border-t border-slate-600">
          <div class="flex items-center justify-between">
            <div class="text-sm text-slate-400">Affichage de {{ users.length }} utilisateurs</div>
            <button
              @click="loadMore"
              class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white text-sm transition-colors"
              :disabled="loading"
            >
              {{ loading ? 'Chargement...' : 'Charger plus' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <UserCreateModal
      v-if="showCreateModal"
      :roles="roles"
      @close="showCreateModal = false"
      @created="handleUserCreated"
    />

    <UserEditModal
      v-if="showEditModal && editingUser"
      :user="editingUser"
      :roles="roles"
      @close="showEditModal = false"
      @updated="handleUserUpdated"
    />

    <ConfirmDeleteModal
      v-if="showDeleteModal && deletingUser"
      :user="deletingUser"
      @close="showDeleteModal = false"
      @confirmed="handleUserDeleted"
    />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Link, router, usePage } from '@inertiajs/vue3'
import AdminLayout from '../components/AdminLayout.vue'
import UserCreateModal from './components/UserCreateModal.vue'
import UserEditModal from './components/UserEditModal.vue'
import ConfirmDeleteModal from './components/ConfirmDeleteModal.vue'
import UserStatsCards from './components/UserStatsCards.vue'

// Props reçues du contrôleur
interface Props {
  user: any
  users: any[]
  pagination: {
    hasMore: boolean
    nextCursor: string | null
    limit: number
    total: number
    active: number
  }
  filters: {
    search: string
    roleId: number | null
    status: string | null
    sort: string
    order: string
  }
  roles: Array<{
    id: number
    name: string
    permissionLevel: number
  }>
  stats: {
    users: {
      total: number
      active: number
      new: number
      roleDistribution: Array<{
        roleId: number
        roleName: string
        permissionLevel: number
        userCount: number
      }>
    }
    activity: {
      last24Hours: number
      last7Days: number
      last30Days: number
    }
    trends: {
      growth7Days: number
      growthRate: string
    }
  }
  breadcrumbItems: Array<{
    label: string
    href?: string
  }>
}

const props = defineProps<Props>()

// État du composant
const loading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingUser = ref<any>(null)
const deletingUser = ref<any>(null)

// Formulaire de recherche et filtres
const searchForm = ref({
  search: props.filters.search,
  roleId: props.filters.roleId,
  sort: props.filters.sort,
  order: props.filters.order,
})

// Debounce pour la recherche
let searchTimeout: NodeJS.Timeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

// Application des filtres
const applyFilters = () => {
  router.get(
    '/admin/users',
    {
      search: searchForm.value.search || undefined,
      roleId: searchForm.value.roleId || undefined,
      sort: searchForm.value.sort,
      order: searchForm.value.order,
    },
    {
      preserveState: true,
      preserveScroll: true,
    }
  )
}

// Effacer les filtres
const clearFilters = () => {
  searchForm.value = {
    search: '',
    roleId: null,
    sort: 'createdAt',
    order: 'desc',
  }
  applyFilters()
}

// Charger plus d'utilisateurs
const loadMore = () => {
  if (!props.pagination.hasMore || loading.value) return

  loading.value = true

  router.get(
    '/admin/users',
    {
      ...searchForm.value,
      cursor: props.pagination.nextCursor,
    },
    {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => {
        loading.value = false
      },
    }
  )
}

// Gestion des actions utilisateurs
const editUser = (user: any) => {
  editingUser.value = user
  showEditModal.value = true
}

const confirmDelete = (user: any) => {
  deletingUser.value = user
  showDeleteModal.value = true
}

// Handlers des événements modales
const handleUserCreated = () => {
  showCreateModal.value = false
  // Recharger la liste
  router.reload({ only: ['users', 'pagination'] })
}

const handleUserUpdated = () => {
  showEditModal.value = false
  editingUser.value = null
  // Recharger la liste
  router.reload({ only: ['users', 'pagination'] })
}

const handleUserDeleted = () => {
  showDeleteModal.value = false
  deletingUser.value = null
  // Recharger la liste
  router.reload({ only: ['users', 'pagination'] })
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
</script>
