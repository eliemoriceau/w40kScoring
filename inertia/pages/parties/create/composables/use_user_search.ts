/**
 * Composable pour la recherche d'utilisateurs en temps réel
 */

import { ref, readonly } from 'vue'
import { router } from '@inertiajs/vue3'
import type { User } from '../types/wizard'

export const useUserSearch = () => {
  const searchResults = ref<User[]>([])
  const isSearching = ref(false)
  const searchQuery = ref('')
  const selectedUser = ref<User | null>(null)

  // Debounce function
  let searchTimeout: number | null = null

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      searchResults.value = []
      return
    }

    isSearching.value = true

    try {
      // Utiliser Inertia pour la recherche avec préservation de l'état
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`)

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      searchResults.value = data.users || []
    } catch (error) {
      console.error('User search failed:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  const debouncedSearch = (query: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    searchTimeout = window.setTimeout(() => {
      searchUsers(query)
    }, 300)
  }

  const selectUser = (user: User) => {
    selectedUser.value = user
    searchQuery.value = user.pseudo
    searchResults.value = []
  }

  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    selectedUser.value = null
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  }

  const handleSearchInput = (query: string) => {
    searchQuery.value = query
    selectedUser.value = null

    if (query.length < 2) {
      searchResults.value = []
      return
    }

    debouncedSearch(query)
  }

  return {
    // État (readonly)
    searchResults: readonly(searchResults),
    isSearching: readonly(isSearching),
    searchQuery,
    selectedUser: readonly(selectedUser),

    // Actions
    searchUsers,
    selectUser,
    clearSearch,
    handleSearchInput,
  }
}
