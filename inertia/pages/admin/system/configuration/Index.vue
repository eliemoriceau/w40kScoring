<template>
  <div class="min-h-screen bg-stone-900 text-stone-100">
    <!-- Header -->
    <div class="border-b border-red-800/50 bg-stone-800 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-red-500">Configuration Système</h1>
          <p class="text-stone-300 text-sm mt-1">
            Gestion des paramètres système - Accès Super Administrateur
          </p>
        </div>

        <div class="flex items-center gap-4">
          <!-- Alert for critical configurations -->
          <div
            v-if="criticalConfigurations.length > 0"
            class="flex items-center gap-2 text-yellow-400"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span class="text-sm">{{ criticalConfigurations.length }} config(s) critique(s)</span>
          </div>

          <!-- Alert for configurations requiring restart -->
          <div
            v-if="configurationsRequiringRestart.length > 0"
            class="flex items-center gap-2 text-orange-400"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span class="text-sm"
              >{{ configurationsRequiringRestart.length }} redémarrage requis</span
            >
          </div>

          <!-- Initialize defaults button -->
          <button
            @click="showInitDefaultsModal = true"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Initialiser par défaut
          </button>

          <!-- Add new configuration -->
          <button
            @click="showCreateModal = true"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
          >
            Nouvelle configuration
          </button>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="p-6">
      <!-- Configuration categories -->
      <div v-for="(categoryConfigs, category) in configurations" :key="category" class="mb-8">
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-stone-100 capitalize flex items-center gap-2">
            <div :class="getCategoryColor(category)" class="w-3 h-3 rounded-full"></div>
            {{ getCategoryDisplayName(category) }}
            <span class="text-stone-400 text-sm font-normal">({{ categoryConfigs.length }})</span>
          </h2>
        </div>

        <!-- Configuration cards -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="config in categoryConfigs"
            :key="config.key"
            class="bg-stone-800 border border-stone-700 rounded-lg p-4 hover:border-red-600/50 transition-all"
            :class="{
              'border-red-500': config.isCritical,
              'border-orange-500': config.requiresRestart,
            }"
          >
            <!-- Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-stone-100 truncate">{{ config.key }}</h3>
                <p v-if="config.description" class="text-stone-400 text-sm mt-1">
                  {{ config.description }}
                </p>
              </div>

              <div class="flex items-center gap-2 ml-2">
                <!-- Critical indicator -->
                <div
                  v-if="config.isCritical"
                  class="w-2 h-2 bg-red-500 rounded-full"
                  title="Configuration critique"
                ></div>

                <!-- Restart required indicator -->
                <div
                  v-if="config.requiresRestart"
                  class="w-2 h-2 bg-orange-500 rounded-full"
                  title="Redémarrage requis"
                ></div>

                <!-- Actions dropdown -->
                <div class="relative">
                  <button
                    @click="toggleDropdown(config.key)"
                    class="p-1 text-stone-400 hover:text-stone-200 rounded"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>

                  <!-- Dropdown menu -->
                  <div
                    v-if="activeDropdown === config.key"
                    class="absolute right-0 mt-2 w-48 bg-stone-700 rounded-lg shadow-lg border border-stone-600 z-10"
                  >
                    <button
                      @click="editConfiguration(config)"
                      class="w-full text-left px-4 py-2 text-stone-200 hover:bg-stone-600 rounded-t-lg"
                    >
                      Modifier
                    </button>
                    <button
                      @click="viewHistory(config)"
                      class="w-full text-left px-4 py-2 text-stone-200 hover:bg-stone-600"
                    >
                      Historique
                    </button>
                    <button
                      @click="confirmDelete(config)"
                      class="w-full text-left px-4 py-2 text-red-400 hover:bg-stone-600 rounded-b-lg"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Value display -->
            <div class="mb-3">
              <div class="text-stone-300 text-sm mb-1">Valeur actuelle:</div>
              <div class="bg-stone-900 rounded p-2 text-stone-100 text-sm font-mono">
                {{ formatConfigValue(config.value) }}
              </div>
            </div>

            <!-- Metadata -->
            <div class="text-xs text-stone-500 space-y-1">
              <div>Modifié le {{ formatDate(config.updatedAt) }}</div>
              <div v-if="config.updater">Par {{ config.updater.username }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <div class="bg-stone-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-semibold text-stone-100 mb-4">
          {{ showEditModal ? 'Modifier la configuration' : 'Nouvelle configuration' }}
        </h3>

        <form @submit.prevent="saveConfiguration" class="space-y-4">
          <!-- Key (only for create) -->
          <div v-if="showCreateModal">
            <label class="block text-stone-300 text-sm font-medium mb-2">Clé</label>
            <input
              v-model="configForm.key"
              type="text"
              required
              class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
              placeholder="app.example_setting"
            />
          </div>

          <!-- Category (only for create) -->
          <div v-if="showCreateModal">
            <label class="block text-stone-300 text-sm font-medium mb-2">Catégorie</label>
            <select
              v-model="configForm.category"
              required
              class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
            >
              <option value="general">Général</option>
              <option value="games">Jeux</option>
              <option value="users">Utilisateurs</option>
              <option value="notifications">Notifications</option>
              <option value="performance">Performance</option>
              <option value="security">Sécurité</option>
            </select>
          </div>

          <!-- Value -->
          <div>
            <label class="block text-stone-300 text-sm font-medium mb-2">Valeur</label>
            <div class="space-y-2">
              <select
                v-model="configForm.valueType"
                class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
              >
                <option value="string">Texte</option>
                <option value="number">Nombre</option>
                <option value="boolean">Booléen</option>
                <option value="json">JSON</option>
              </select>

              <!-- String input -->
              <input
                v-if="configForm.valueType === 'string'"
                v-model="configForm.stringValue"
                type="text"
                class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
              />

              <!-- Number input -->
              <input
                v-if="configForm.valueType === 'number'"
                v-model.number="configForm.numberValue"
                type="number"
                class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
              />

              <!-- Boolean input -->
              <select
                v-if="configForm.valueType === 'boolean'"
                v-model="configForm.booleanValue"
                class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
              >
                <option :value="true">Vrai</option>
                <option :value="false">Faux</option>
              </select>

              <!-- JSON input -->
              <textarea
                v-if="configForm.valueType === 'json'"
                v-model="configForm.jsonValue"
                class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 font-mono"
                rows="4"
                placeholder='{"exemple": "valeur"}'
              ></textarea>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-stone-300 text-sm font-medium mb-2">Description</label>
            <textarea
              v-model="configForm.description"
              class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
              rows="3"
            ></textarea>
          </div>

          <!-- Options -->
          <div class="space-y-2">
            <label class="flex items-center">
              <input v-model="configForm.is_critical" type="checkbox" class="mr-2" />
              <span class="text-stone-300">Configuration critique</span>
            </label>

            <label class="flex items-center">
              <input v-model="configForm.requires_restart" type="checkbox" class="mr-2" />
              <span class="text-stone-300">Redémarrage requis</span>
            </label>
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-stone-300 text-sm font-medium mb-2">
              Raison du changement {{ showEditModal ? '(optionnel)' : '' }}
            </label>
            <input
              v-model="configForm.change_reason"
              type="text"
              class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"
              placeholder="Description de la modification..."
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg font-medium"
            >
              {{ saving ? 'Enregistrement...' : showEditModal ? 'Mettre à jour' : 'Créer' }}
            </button>
            <button
              type="button"
              @click="closeModals"
              class="flex-1 bg-stone-600 hover:bg-stone-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Initialize Defaults Modal -->
    <div
      v-if="showInitDefaultsModal"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <div class="bg-stone-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-xl font-semibold text-stone-100 mb-4">
          Initialiser configurations par défaut
        </h3>

        <p class="text-stone-300 mb-6">
          Cette action va créer les configurations système par défaut. Les configurations existantes
          ne seront pas modifiées.
        </p>

        <div class="flex gap-4">
          <button
            @click="initializeDefaults"
            :disabled="saving"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium"
          >
            {{ saving ? 'Initialisation...' : 'Confirmer' }}
          </button>
          <button
            @click="showInitDefaultsModal = false"
            class="flex-1 bg-stone-600 hover:bg-stone-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Click outside handler -->
    <div v-if="activeDropdown" @click="activeDropdown = null" class="fixed inset-0 z-5"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { router } from '@inertiajs/vue3'

interface User {
  id: number
  username: string
  fullName: string | null
}

interface SystemSetting {
  id: number
  key: string
  value: any
  category: string
  description: string | null
  isCritical: boolean
  requiresRestart: boolean
  createdBy: number
  updatedBy: number
  createdAt: string
  updatedAt: string
  creator?: User
  updater?: User
}

// Props
const props = defineProps<{
  configurations: Record<string, SystemSetting[]>
  criticalConfigurations: SystemSetting[]
  configurationsRequiringRestart: SystemSetting[]
  user: User
}>()

// Reactive state
const activeDropdown = ref<string | null>(null)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showInitDefaultsModal = ref(false)
const saving = ref(false)

const configForm = reactive({
  key: '',
  category: 'general',
  valueType: 'string',
  stringValue: '',
  numberValue: 0,
  booleanValue: false,
  jsonValue: '',
  description: '',
  is_critical: false,
  requires_restart: false,
  change_reason: '',
})

// Methods
const toggleDropdown = (key: string) => {
  activeDropdown.value = activeDropdown.value === key ? null : key
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    general: 'bg-blue-500',
    games: 'bg-green-500',
    users: 'bg-purple-500',
    notifications: 'bg-yellow-500',
    performance: 'bg-red-500',
    security: 'bg-orange-500',
  }
  return colors[category] || 'bg-gray-500'
}

const getCategoryDisplayName = (category: string) => {
  const names: Record<string, string> = {
    general: 'Général',
    games: 'Jeux',
    users: 'Utilisateurs',
    notifications: 'Notifications',
    performance: 'Performance',
    security: 'Sécurité',
  }
  return names[category] || category
}

const formatConfigValue = (value: any) => {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resetForm = () => {
  Object.assign(configForm, {
    key: '',
    category: 'general',
    valueType: 'string',
    stringValue: '',
    numberValue: 0,
    booleanValue: false,
    jsonValue: '',
    description: '',
    is_critical: false,
    requires_restart: false,
    change_reason: '',
  })
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  resetForm()
}

const getFormValue = () => {
  switch (configForm.valueType) {
    case 'string':
      return configForm.stringValue
    case 'number':
      return configForm.numberValue
    case 'boolean':
      return configForm.booleanValue
    case 'json':
      try {
        return JSON.parse(configForm.jsonValue)
      } catch {
        throw new Error('JSON invalide')
      }
    default:
      return configForm.stringValue
  }
}

const editConfiguration = (config: SystemSetting) => {
  // Populate form with existing values
  configForm.key = config.key
  configForm.description = config.description || ''
  configForm.is_critical = config.isCritical
  configForm.requires_restart = config.requiresRestart

  // Set value based on type
  const value = config.value
  if (typeof value === 'string') {
    configForm.valueType = 'string'
    configForm.stringValue = value
  } else if (typeof value === 'number') {
    configForm.valueType = 'number'
    configForm.numberValue = value
  } else if (typeof value === 'boolean') {
    configForm.valueType = 'boolean'
    configForm.booleanValue = value
  } else {
    configForm.valueType = 'json'
    configForm.jsonValue = JSON.stringify(value, null, 2)
  }

  activeDropdown.value = null
  showEditModal.value = true
}

const saveConfiguration = async () => {
  saving.value = true

  try {
    const value = getFormValue()

    if (showEditModal.value) {
      // Update existing configuration
      router.put(`/admin/system/config/${configForm.key}`, {
        value,
        description: configForm.description,
        is_critical: configForm.is_critical,
        requires_restart: configForm.requires_restart,
        change_reason: configForm.change_reason,
      })
    } else {
      // Create new configuration
      router.post('/admin/system/config', {
        key: configForm.key,
        value,
        category: configForm.category,
        description: configForm.description,
        is_critical: configForm.is_critical,
        requires_restart: configForm.requires_restart,
        change_reason: configForm.change_reason,
      })
    }

    closeModals()
  } catch (error) {
    alert('Erreur: ' + (error as Error).message)
  } finally {
    saving.value = false
  }
}

const confirmDelete = (config: SystemSetting) => {
  if (config.isCritical) {
    const reason = prompt(
      'Cette configuration est critique. Veuillez indiquer la raison de la suppression:'
    )
    if (!reason) return

    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer la configuration "${config.key}" ?\n\nRaison: ${reason}`
      )
    ) {
      router.delete(`/admin/system/config/${config.key}`, {
        data: {
          confirm: true,
          change_reason: reason,
        },
      })
    }
  } else {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la configuration "${config.key}" ?`)) {
      router.delete(`/admin/system/config/${config.key}`, {
        data: { confirm: true },
      })
    }
  }

  activeDropdown.value = null
}

const viewHistory = (config: SystemSetting) => {
  // TODO: Implement history modal
  alert('Historique - À implémenter')
  activeDropdown.value = null
}

const initializeDefaults = () => {
  saving.value = true

  router.post(
    '/admin/system/config/init-defaults',
    {
      confirm: true,
    },
    {
      onFinish: () => {
        saving.value = false
        showInitDefaultsModal.value = false
      },
    }
  )
}
</script>

<style scoped>
/* Custom styles for better UX */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease-out;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
}
</style>
