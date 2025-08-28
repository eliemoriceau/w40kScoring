<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <!-- Total Utilisateurs -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-400 text-sm">Total Utilisateurs</p>
          <p class="text-xl font-bold text-white">{{ stats.users.total }}</p>
          <p v-if="stats.trends.growth7Days > 0" class="text-green-400 text-xs mt-1">
            +{{ stats.trends.growth7Days }} cette semaine
          </p>
        </div>
        <div class="bg-blue-600 p-2 rounded-full">
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Utilisateurs Actifs -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-400 text-sm">Utilisateurs Actifs</p>
          <p class="text-xl font-bold text-white">{{ stats.users.active }}</p>
          <p class="text-slate-500 text-xs mt-1">30 derniers jours</p>
        </div>
        <div class="bg-green-600 p-2 rounded-full">
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Nouveaux Utilisateurs -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-400 text-sm">Nouveaux</p>
          <p class="text-xl font-bold text-white">{{ stats.users.new }}</p>
          <p class="text-slate-500 text-xs mt-1">7 derniers jours</p>
        </div>
        <div class="bg-purple-600 p-2 rounded-full">
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Activité Récente -->
    <div class="bg-slate-800 border border-red-800/50 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-400 text-sm">Actions Admin</p>
          <p class="text-xl font-bold text-white">{{ stats.activity.last24Hours }}</p>
          <p class="text-slate-500 text-xs mt-1">24 dernières heures</p>
        </div>
        <div class="bg-orange-600 p-2 rounded-full">
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>

  <!-- Distribution par rôle -->
  <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6 mb-6">
    <h3 class="text-lg font-semibold text-red-400 mb-4">Distribution par Rôle</h3>
    <div class="space-y-4">
      <div
        v-for="role in stats.users.roleDistribution"
        :key="role.roleId"
        class="flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            :class="[
              'w-3 h-3 rounded-full',
              role.permissionLevel === 3
                ? 'bg-red-500'
                : role.permissionLevel === 2
                  ? 'bg-yellow-500'
                  : 'bg-blue-500',
            ]"
          ></div>
          <span class="text-slate-300 font-medium">{{ role.roleName }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-white font-bold">{{ role.userCount }}</span>
          <div class="w-20 bg-slate-700 rounded-full h-2">
            <div
              class="h-2 rounded-full"
              :class="[
                role.permissionLevel === 3
                  ? 'bg-red-500'
                  : role.permissionLevel === 2
                    ? 'bg-yellow-500'
                    : 'bg-blue-500',
              ]"
              :style="{ width: `${Math.max((role.userCount / stats.users.total) * 100, 5)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Métriques d'activité -->
  <div class="bg-slate-800 border border-red-800/50 rounded-lg p-6">
    <h3 class="text-lg font-semibold text-red-400 mb-4">Activité Administrative</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="text-center">
        <p class="text-slate-400 text-sm">24 heures</p>
        <p class="text-2xl font-bold text-white">{{ stats.activity.last24Hours }}</p>
        <p class="text-slate-500 text-xs">actions</p>
      </div>
      <div class="text-center">
        <p class="text-slate-400 text-sm">7 jours</p>
        <p class="text-2xl font-bold text-white">{{ stats.activity.last7Days }}</p>
        <p class="text-slate-500 text-xs">actions</p>
      </div>
      <div class="text-center">
        <p class="text-slate-400 text-sm">30 jours</p>
        <p class="text-2xl font-bold text-white">{{ stats.activity.last30Days }}</p>
        <p class="text-slate-500 text-xs">actions</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
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
}

defineProps<Props>()
</script>
