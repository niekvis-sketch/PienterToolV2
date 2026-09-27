<template>
  <div class="flex h-screen" style="background: var(--bg);">
    <AppSidebar />

    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar -->
      <header class="topbar h-[60px] px-6 flex items-center justify-between gap-4 shrink-0">
        <nav class="flex items-center gap-2 text-[13px] text-ink-3 min-w-0" aria-label="Kruimelpad">
          <span v-if="!breadcrumb.length" class="text-ink font-medium">
            Pienter Portaal
            <span class="accent-dot ml-1"></span>
          </span>
          <template v-for="(crumb, idx) in breadcrumb" :key="idx">
            <KIcon v-if="idx > 0" name="chevR" :size="13" />
            <router-link
              v-if="crumb.to && idx < breadcrumb.length - 1"
              :to="crumb.to"
              class="text-ink-3 hover:text-ink transition-colors truncate max-w-[220px]"
            >{{ crumb.label }}</router-link>
            <span v-else class="text-ink font-medium truncate max-w-[260px]">{{ crumb.label }}</span>
          </template>
        </nav>

        <span class="badge badge-highlight-soft shrink-0">
          <span class="dot"></span>
          Demo mode
        </span>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto">
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
import KIcon from './components/ui/KIcon.vue'

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

<style scoped>
.topbar {
  background: var(--bg);
  border-bottom: 1px solid var(--line);
}
</style>
