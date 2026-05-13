<template>
  <div class="flex h-screen bg-cream-200">
    <AppSidebar />

    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar -->
      <header class="bg-white border-b border-cream-400 px-6 h-12 flex items-center justify-between shrink-0">
        <nav class="flex items-center gap-1.5 text-sm min-w-0">
          <span v-if="!breadcrumb.length" class="text-ink-2 font-medium">
            Pienter Portaal
            <span class="accent-dot ml-1"></span>
          </span>
          <template v-for="(crumb, idx) in breadcrumb" :key="idx">
            <span v-if="idx > 0" class="text-ink-mute mx-1">›</span>
            <router-link
              v-if="crumb.to && idx < breadcrumb.length - 1"
              :to="crumb.to"
              class="text-ink-2 hover:text-pienter-700 truncate max-w-[220px]"
            >{{ crumb.label }}</router-link>
            <span v-else class="text-ink font-semibold truncate max-w-[260px]">{{ crumb.label }}</span>
          </template>
        </nav>

        <span class="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-[11px] font-medium uppercase tracking-wider"
              style="background: var(--highlight-soft); color: var(--highlight-press);">
          <span class="w-1.5 h-1.5 rounded-full" style="background: var(--highlight);"></span>
          Demo mode
        </span>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto" style="background: var(--bg);">
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
