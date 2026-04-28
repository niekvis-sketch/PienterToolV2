<template>
  <div class="flex h-screen">
    <AppSidebar />

    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar -->
      <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <nav class="flex items-center gap-1 text-sm min-w-0">
          <span v-if="!breadcrumb.length" class="text-gray-500">Pienter Portaal</span>
          <template v-for="(crumb, idx) in breadcrumb" :key="idx">
            <span v-if="idx > 0" class="text-gray-300 mx-1">›</span>
            <router-link
              v-if="crumb.to && idx < breadcrumb.length - 1"
              :to="crumb.to"
              class="text-gray-600 hover:text-gray-900 truncate max-w-[220px]"
            >{{ crumb.label }}</router-link>
            <span v-else class="text-gray-900 font-medium truncate max-w-[260px]">{{ crumb.label }}</span>
          </template>
        </nav>

        <span class="badge bg-amber-100 text-amber-700 border border-amber-300 text-xs font-semibold px-3 py-1">Demo mode</span>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto bg-gray-50">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useKlantenStore } from './stores/klantenStore'
import AppSidebar from './components/AppSidebar.vue'

const route = useRoute()
const klantenStore = useKlantenStore()

watch(() => route.name, async () => {
  if (klantenStore.klanten.length === 0) {
    await klantenStore.fetchKlanten()
  }
}, { immediate: true })

const klantSegmentLabel: Record<string, string> = {
  advertising: 'Advertising',
  seo: 'SEO',
  content: 'Content',
  website: 'Website',
}

const breadcrumb = computed(() => {
  const path = route.path
  const crumbs: Array<{ label: string; to?: string }> = []

  if (path.startsWith('/klanten')) {
    crumbs.push({ label: 'Klanten', to: '/klanten' })

    const klantMatch = path.match(/^\/klanten\/([^/]+)(?:\/([^/]+))?/)
    if (klantMatch && klantMatch[1] === 'new') {
      crumbs.push({ label: 'Nieuwe klant' })
    } else if (klantMatch) {
      const klantId = klantMatch[1]
      const klant = klantenStore.klanten.find(k => k.id === klantId)
      crumbs.push({ label: klant?.naam ?? '...', to: `/klanten/${klantId}` })

      const seg = klantMatch[2]
      if (seg && klantSegmentLabel[seg]) {
        crumbs.push({ label: klantSegmentLabel[seg] })
      }
    }
  } else if (path.startsWith('/medewerkers')) {
    crumbs.push({ label: 'Medewerkers' })
  } else if (path.startsWith('/sales')) {
    crumbs.push({ label: 'Sales', to: '/sales' })
    if (path.startsWith('/sales/slides')) {
      crumbs.push({ label: 'Vrije slides', to: '/sales/slides' })
    }
  } else if (path.startsWith('/projects/new')) {
    crumbs.push({ label: 'Nieuw project' })
  }

  return crumbs
})
</script>
