<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'

interface Props {
  title?: string
  description?: string
}

interface User {
  id: number
  username: string
  email: string
}

interface PageProps {
  user?: User
}

const props = withDefaults(defineProps<Props>(), {
  title: 'w40kScoring',
  description: 'Application de scoring pour Warhammer 40,000',
})

const page = usePage<PageProps>()
const user = computed(() => page.props.user)
const isAuthenticated = computed(() => !!user.value)

// Mobile menu state
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 text-white">
    <Head>
      <title>{{ props.title }}</title>
      <meta name="description" :content="props.description" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Head>

    <!-- Navigation Header -->
    <header class="bg-black/20 backdrop-blur-sm border-b border-red-500/20">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo / Brand -->
          <div class="flex items-center">
            <Link href="/" class="flex items-center">
              <h1 class="text-2xl font-bold text-red-400 hover:text-red-300 transition-colors">
                w40k<span class="text-yellow-400">Scoring</span>
              </h1>
            </Link>
          </div>

          <!-- Navigation Menu -->
          <div class="hidden md:block">
            <div class="flex items-center space-x-1">
              <!-- Main Navigation Links -->
              <div class="flex items-baseline space-x-4">
                <Link
                  href="/"
                  class="text-white hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Accueil
                </Link>

                <!-- Authenticated User Links -->
                <template v-if="isAuthenticated">
                  <Link
                    href="/parties"
                    class="text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Mes Parties
                  </Link>
                  <Link
                    href="/parties/create"
                    class="text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Nouvelle Partie
                  </Link>
                </template>
              </div>

              <!-- Authentication Section -->
              <div class="flex items-center space-x-4 ml-6">
                <template v-if="isAuthenticated">
                  <!-- User Info -->
                  <div class="flex items-center space-x-3">
                    <div class="text-sm">
                      <span class="text-gray-300">Bienvenue,</span>
                      <span class="text-red-400 font-medium">{{ user?.username }}</span>
                    </div>

                    <!-- Logout Button -->
                    <Link
                      href="/logout"
                      method="post"
                      as="button"
                      class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-500 hover:border-red-400"
                    >
                      Déconnexion
                    </Link>
                  </div>
                </template>

                <template v-else>
                  <!-- Login/Register Buttons -->
                  <div class="flex items-center space-x-2">
                    <Link
                      href="/login"
                      class="text-gray-300 hover:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-600 hover:border-red-400"
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/register"
                      class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-500 hover:border-red-400"
                    >
                      S'inscrire
                    </Link>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="md:hidden">
            <button
              @click="toggleMobileMenu"
              class="text-gray-300 hover:text-white focus:outline-none focus:text-white p-2"
              :class="{ 'text-red-400': isMobileMenuOpen }"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  v-if="!isMobileMenuOpen"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div
          v-if="isMobileMenuOpen"
          class="md:hidden bg-black/30 backdrop-blur-sm border-t border-red-500/20"
          @click="closeMobileMenu"
        >
          <div class="px-4 pt-2 pb-4 space-y-2">
            <!-- Main Navigation Links -->
            <Link
              href="/"
              class="block text-white hover:text-red-400 px-3 py-2 rounded-md text-base font-medium transition-colors"
              @click="closeMobileMenu"
            >
              Accueil
            </Link>

            <!-- Authenticated User Links -->
            <template v-if="isAuthenticated">
              <Link
                href="/parties"
                class="block text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-base font-medium transition-colors"
                @click="closeMobileMenu"
              >
                Mes Parties
              </Link>
              <Link
                href="/parties/create"
                class="block text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-base font-medium transition-colors"
                @click="closeMobileMenu"
              >
                Nouvelle Partie
              </Link>
            </template>

            <!-- Authentication Section for Mobile -->
            <div class="border-t border-red-500/20 pt-4 mt-4">
              <template v-if="isAuthenticated">
                <!-- User Info -->
                <div class="px-3 py-2">
                  <p class="text-sm text-gray-300">Connecté en tant que:</p>
                  <p class="text-red-400 font-medium">{{ user?.username }}</p>
                </div>

                <!-- Logout Button -->
                <Link
                  href="/logout"
                  method="post"
                  as="button"
                  class="block w-full text-left bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-base font-medium transition-colors mt-2"
                  @click="closeMobileMenu"
                >
                  Déconnexion
                </Link>
              </template>

              <template v-else>
                <!-- Login/Register Buttons -->
                <div class="space-y-2">
                  <Link
                    href="/login"
                    class="block text-center text-gray-300 hover:text-red-400 px-3 py-2 rounded-md text-base font-medium transition-colors border border-gray-600 hover:border-red-400"
                    @click="closeMobileMenu"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    class="block text-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-base font-medium transition-colors border border-red-500 hover:border-red-400"
                    @click="closeMobileMenu"
                  >
                    S'inscrire
                  </Link>
                </div>
              </template>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-black/40 border-t border-red-500/20 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Brand Section -->
          <div>
            <h3 class="text-lg font-bold text-red-400 mb-4">w40kScoring</h3>
            <p class="text-gray-300 text-sm">
              Application de gestion et scoring pour les parties de Warhammer 40,000. Suivez vos
              victoires, analysez vos performances.
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="text-white font-semibold mb-4">Liens rapides</h4>
            <ul class="space-y-2">
              <li>
                <Link href="/" class="text-gray-300 hover:text-red-400 text-sm transition-colors"
                  >Accueil</Link
                >
              </li>
              <li v-if="isAuthenticated">
                <Link
                  href="/parties"
                  class="text-gray-300 hover:text-red-400 text-sm transition-colors"
                  >Mes parties</Link
                >
              </li>
              <li v-if="isAuthenticated">
                <Link
                  href="/parties/create"
                  class="text-gray-300 hover:text-red-400 text-sm transition-colors"
                  >Nouvelle partie</Link
                >
              </li>
              <li v-if="!isAuthenticated">
                <Link
                  href="/register"
                  class="text-gray-300 hover:text-red-400 text-sm transition-colors"
                  >Rejoindre la croisade</Link
                >
              </li>
            </ul>
          </div>

          <!-- Warhammer 40K Theme -->
          <div>
            <h4 class="text-white font-semibold mb-4">Pour l'Empereur !</h4>
            <p class="text-gray-300 text-sm">
              "Dans les sombres ténèbres du lointain futur, il n'y a que la guerre..."
            </p>
            <div class="mt-4 flex space-x-4">
              <div class="w-8 h-8 bg-red-600 rounded border border-yellow-400"></div>
              <div class="w-8 h-8 bg-blue-600 rounded border border-yellow-400"></div>
              <div class="w-8 h-8 bg-green-600 rounded border border-yellow-400"></div>
            </div>
          </div>
        </div>

        <div class="border-t border-red-500/20 mt-8 pt-8 text-center">
          <p class="text-gray-400 text-sm">
            &copy; 2025 w40kScoring. Warhammer 40,000 © Games Workshop Ltd.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Custom scrollbar for dark theme */
:global(html) {
  scrollbar-width: thin;
  scrollbar-color: #dc2626 #1f2937;
}

:global(body::-webkit-scrollbar) {
  width: 8px;
}

:global(body::-webkit-scrollbar-track) {
  background: #1f2937;
}

:global(body::-webkit-scrollbar-thumb) {
  background-color: #dc2626;
  border-radius: 4px;
}

:global(body::-webkit-scrollbar-thumb:hover) {
  background-color: #ef4444;
}
</style>
