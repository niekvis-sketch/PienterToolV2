<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3">
        <router-link to="/" class="flex items-center gap-2 text-pienter-700 font-bold text-lg hover:text-pienter-600">
          <svg class="w-8 h-8" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="currentColor"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui" font-weight="700" font-size="18">P</text></svg>
          Website Proces Portaal
        </router-link>
      </div>
      <div class="flex items-center gap-4">
        <span class="badge bg-amber-100 text-amber-700 border border-amber-300 text-xs font-semibold px-3 py-1">Demo mode</span>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// App shell – geen logica nodig
</script>
