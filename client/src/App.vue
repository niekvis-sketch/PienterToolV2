<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2 min-w-0">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2 text-pienter-700 hover:text-pienter-600 shrink-0">
          <svg class="w-7 h-7" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="currentColor"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui" font-weight="700" font-size="18">P</text></svg>
        </router-link>

        <!-- Breadcrumb -->
        <nav class="flex items-center gap-1 text-sm min-w-0">
          <router-link to="/" class="font-semibold text-pienter-700 hover:text-pienter-600 shrink-0">Klanten</router-link>

          <!-- Klant niveau -->
          <template v-if="currentKlant">
            <span class="text-gray-300 mx-1">›</span>
            <router-link
              v-if="isProjectRoute"
              :to="`/klanten/${currentKlant.id}`"
              class="text-gray-600 hover:text-gray-900 truncate max-w-[180px]"
            >{{ currentKlant.naam }}</router-link>
            <span v-else class="text-gray-900 font-medium truncate max-w-[220px]">{{ currentKlant.naam }}</span>
          </template>

          <!-- Project niveau -->
          <template v-if="isProjectRoute && projectStore.currentProject">
            <span class="text-gray-300 mx-1">›</span>
            <span class="text-gray-900 font-medium truncate max-w-[220px]">{{ projectStore.currentProject.name }}</span>
          </template>
        </nav>
      </div>

      <div class="flex items-center gap-4 shrink-0">
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
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from './stores/projectStore'
import { useKlantenStore } from './stores/klantenStore'

const route = useRoute()
const projectStore = useProjectStore()
const klantenStore = useKlantenStore()

const isProjectRoute = computed(() => route.name === 'project-detail')
const isKlantRoute = computed(() => route.name === 'klant-detail')

// Zorg dat de klantenlijst altijd geladen is voor breadcrumb-lookups
watch(() => route.name, async () => {
  if (klantenStore.klanten.length === 0) {
    await klantenStore.fetchKlanten()
  }
}, { immediate: true })

const currentKlant = computed(() => {
  if (isKlantRoute.value) {
    return klantenStore.currentKlant
  }
  if (isProjectRoute.value && projectStore.currentProject) {
    return klantenStore.klanten.find(k => k.naam === projectStore.currentProject!.clientName) ?? null
  }
  return null
})
</script>
