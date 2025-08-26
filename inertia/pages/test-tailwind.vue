<template>
  <div class="min-h-screen bg-w40k-bg-primary text-w40k-text-primary">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-w40k-red-500 mb-8">
        🛡️ Tailwind CSS v4 - W40K Theme Test
      </h1>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Test Card 1 - Red Theme -->
        <div class="bg-w40k-bg-secondary p-6 rounded-lg border-2 border-w40k-red-500">
          <h2 class="text-xl font-semibold text-w40k-red-400 mb-4">Red Theme</h2>
          <p class="text-w40k-text-secondary mb-4">
            This card demonstrates the W40K red color palette.
          </p>
          <button
            class="bg-w40k-red-500 hover:bg-w40k-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            Action Button
          </button>
        </div>

        <!-- Test Card 2 - Gold Theme -->
        <div class="bg-w40k-bg-secondary p-6 rounded-lg border-2 border-w40k-gold-500">
          <h2 class="text-xl font-semibold text-w40k-gold-400 mb-4">Gold Theme</h2>
          <p class="text-w40k-text-secondary mb-4">
            This card demonstrates the W40K gold color palette.
          </p>
          <button
            class="bg-w40k-gold-500 hover:bg-w40k-gold-600 text-w40k-bg-primary px-4 py-2 rounded transition-colors"
          >
            Action Button
          </button>
        </div>

        <!-- Test Card 3 - Combined Theme -->
        <div class="bg-w40k-bg-elevated p-6 rounded-lg border-2 border-w40k-text-subtle">
          <h2 class="text-xl font-semibold text-w40k-text-primary mb-4">Combined Theme</h2>
          <p class="text-w40k-text-muted mb-4">This card uses various W40K theme colors.</p>
          <div class="flex space-x-2">
            <span class="bg-w40k-red-500 text-white px-2 py-1 rounded text-sm">Red</span>
            <span class="bg-w40k-gold-500 text-w40k-bg-primary px-2 py-1 rounded text-sm"
              >Gold</span
            >
          </div>
        </div>
      </div>

      <div class="mt-12">
        <h2 class="text-2xl font-bold text-w40k-gold-500 mb-6">Color Palette Test</h2>

        <div class="grid grid-cols-2 gap-8">
          <!-- Red Palette -->
          <div>
            <h3 class="text-lg font-semibold text-w40k-text-primary mb-4">Red Palette</h3>
            <div class="grid grid-cols-5 gap-2">
              <div
                class="bg-w40k-red-50 h-12 rounded flex items-center justify-center text-black text-xs"
              >
                50
              </div>
              <div
                class="bg-w40k-red-100 h-12 rounded flex items-center justify-center text-black text-xs"
              >
                100
              </div>
              <div
                class="bg-w40k-red-200 h-12 rounded flex items-center justify-center text-black text-xs"
              >
                200
              </div>
              <div
                class="bg-w40k-red-300 h-12 rounded flex items-center justify-center text-black text-xs"
              >
                300
              </div>
              <div
                class="bg-w40k-red-400 h-12 rounded flex items-center justify-center text-white text-xs"
              >
                400
              </div>
              <div
                class="bg-w40k-red-500 h-12 rounded flex items-center justify-center text-white text-xs"
              >
                500
              </div>
              <div
                class="bg-w40k-red-600 h-12 rounded flex items-center justify-center text-white text-xs"
              >
                600
              </div>
              <div
                class="bg-w40k-red-700 h-12 rounded flex items-center justify-center text-white text-xs"
              >
                700
              </div>
              <div
                class="bg-w40k-red-800 h-12 rounded flex items-center justify-center text-white text-xs"
              >
                800
              </div>
              <div
                class="bg-w40k-red-900 h-12 rounded flex items-center justify-center text-white text-xs"
              >
                900
              </div>
            </div>
          </div>

          <!-- Gold Palette -->
          <div>
            <h3 class="text-lg font-semibold text-w40k-text-primary mb-4">Gold Palette</h3>
            <div class="grid grid-cols-5 gap-2">
              <div
                class="bg-w40k-gold-50 h-12 rounded flex items-center justify-center text-black text-xs"
              >
                50
              </div>
              <div
                class="bg-w40k-gold-100 h-12 rounded flex items-center justify-center text-black text-xs"
              >
                100
              </div>
              <div
                class="bg-w40k-gold-200 h-12 rounded flex items-center justify-center text-black text-xs"
              >
                200
              </div>
              <div
                class="bg-w40k-gold-300 h-12 rounded flex items-center justify-center text-black text-xs"
              >
                300
              </div>
              <div
                class="bg-w40k-gold-400 h-12 rounded flex items-center justify-center text-black text-xs"
              >
                400
              </div>
              <div
                class="bg-w40k-gold-500 h-12 rounded flex items-center justify-center text-black text-xs"
              >
                500
              </div>
              <div
                class="bg-w40k-gold-600 h-12 rounded flex items-center justify-center text-black text-xs"
              >
                600
              </div>
              <div
                class="bg-w40k-gold-700 h-12 rounded flex items-center justify-center text-white text-xs"
              >
                700
              </div>
              <div
                class="bg-w40k-gold-800 h-12 rounded flex items-center justify-center text-white text-xs"
              >
                800
              </div>
              <div
                class="bg-w40k-gold-900 h-12 rounded flex items-center justify-center text-white text-xs"
              >
                900
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-12">
        <h2 class="text-2xl font-bold text-w40k-gold-500 mb-6">Responsive Test</h2>
        <div class="bg-w40k-bg-secondary p-4 rounded-lg">
          <div class="text-center">
            <div class="block sm:hidden text-w40k-red-400">📱 Mobile View</div>
            <div class="hidden sm:block md:hidden text-w40k-gold-400">💻 Tablet View</div>
            <div class="hidden md:block text-w40k-text-primary">🖥️ Desktop View</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Test page for Tailwind CSS v4 integration
</script>
