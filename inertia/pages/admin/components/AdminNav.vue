<template>
  <nav class="w-64 bg-slate-800 border-r border-red-800/50 min-h-screen">
    <div class="p-4 space-y-2">
      <!-- Dashboard -->
      <Link href="/admin" :class="navItemClasses($page.url === '/admin')">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
        <span>Tableau de Bord</span>
      </Link>

      <!-- Gestion Utilisateurs -->
      <Link href="/admin/users" :class="navItemClasses($page.url.startsWith('/admin/users'))">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Utilisateurs</span>
        <span class="ml-auto bg-red-600 text-xs px-2 py-1 rounded-full">Bientôt</span>
      </Link>

      <!-- Gestion Parties -->
      <Link href="/admin/parties" :class="navItemClasses($page.url.startsWith('/admin/parties'))">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Parties</span>
      </Link>

      <!-- Analytics -->
      <Link
        href="/admin/analytics"
        :class="navItemClasses($page.url.startsWith('/admin/analytics'))"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span>Analytics</span>
      </Link>

      <!-- Système -->
      <div class="pt-4">
        <div class="text-xs text-slate-500 uppercase tracking-wider mb-2 px-3">Système</div>

        <Link
          href="/admin/system/config"
          :class="navItemClasses($page.url.startsWith('/admin/system/config'))"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Configuration</span>
          <span class="ml-auto bg-yellow-500 text-xs px-2 py-1 rounded-full">SUPER</span>
        </Link>

        <Link
          href="/admin/system/logs"
          :class="navItemClasses($page.url.startsWith('/admin/system/logs'))"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Logs Système</span>
          <span class="ml-auto bg-yellow-500 text-xs px-2 py-1 rounded-full">SUPER</span>
        </Link>
      </div>

      <!-- Actions Récentes (Preview) -->
      <div class="pt-6">
        <div class="text-xs text-slate-500 uppercase tracking-wider mb-2 px-3">
          Activité Récente
        </div>
        <div class="bg-slate-700 rounded-lg p-3 text-xs text-slate-400">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Système opérationnel</span>
          </div>
          <div class="text-slate-500">Panel admin en cours de développement...</div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { Link } from '@inertiajs/vue3'

const navItemClasses = (isActive: boolean) => {
  const baseClasses = 'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm'

  if (isActive) {
    return `${baseClasses} bg-red-600 text-white shadow-lg`
  }

  return `${baseClasses} text-slate-300 hover:bg-slate-700 hover:text-white`
}
</script>
