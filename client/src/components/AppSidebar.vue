<template>
  <aside class="w-64 bg-white border-r border-gray-200 shrink-0 flex flex-col h-screen">
    <!-- Header -->
    <div class="p-4 border-b border-gray-100 flex items-center gap-2">
      <svg class="w-7 h-7 text-pienter-700" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="currentColor"/>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui" font-weight="700" font-size="18">P</text>
      </svg>
      <span class="font-bold text-gray-900">Pienter Dashboard</span>
    </div>

    <!-- Sections -->
    <nav class="flex-1 overflow-y-auto p-2 space-y-1">
      <!-- Klanten -->
      <SidebarSection
        label="Klanten"
        icon="👤"
        :open="klantenOpen"
        :active="route.path.startsWith('/klanten')"
        @toggle="klantenOpen = !klantenOpen"
      >
        <router-link
          to="/klanten"
          class="block px-3 py-1.5 rounded-lg text-sm transition-colors"
          :class="route.path === '/klanten' ? 'bg-pienter-50 text-pienter-700 font-medium' : 'text-gray-600 hover:bg-gray-50'"
        >Alle klanten</router-link>

        <!-- Active klant -->
        <div v-if="activeKlant" class="mt-0.5">
          <router-link
            :to="`/klanten/${activeKlant.id}`"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
            :class="isKlantRoot ? 'bg-pienter-50 text-pienter-700 font-medium' : 'text-gray-700 hover:bg-gray-50'"
          >
            <span class="text-base">📄</span>
            <span class="truncate">{{ activeKlant.naam }}</span>
          </router-link>
          <div class="ml-3 pl-3 border-l border-gray-200 mt-0.5 space-y-0.5">
            <router-link
              v-for="item in klantSubItems"
              :key="item.segment"
              :to="`/klanten/${activeKlant.id}/${item.segment}`"
              class="block px-3 py-1.5 rounded-lg text-sm transition-colors"
              :class="activeSegment === item.segment ? 'bg-pienter-50 text-pienter-700 font-medium' : 'text-gray-600 hover:bg-gray-50'"
            >{{ item.label }}</router-link>
          </div>
        </div>
      </SidebarSection>

      <!-- Medewerkers -->
      <SidebarSection
        label="Medewerkers"
        icon="👥"
        :open="medewerkersOpen"
        :active="route.path.startsWith('/medewerkers')"
        @toggle="toggleMedewerkers"
      >
        <router-link
          to="/medewerkers"
          class="block px-3 py-1.5 rounded-lg text-sm transition-colors"
          :class="route.path === '/medewerkers' ? 'bg-pienter-50 text-pienter-700 font-medium' : 'text-gray-600 hover:bg-gray-50'"
        >Overzicht</router-link>
      </SidebarSection>

      <!-- Sales -->
      <SidebarSection
        label="Sales"
        icon="💼"
        :open="salesOpen"
        :active="route.path.startsWith('/sales')"
        @toggle="toggleSales"
      >
        <router-link
          to="/sales"
          class="block px-3 py-1.5 rounded-lg text-sm transition-colors"
          :class="route.path === '/sales' ? 'bg-pienter-50 text-pienter-700 font-medium' : 'text-gray-600 hover:bg-gray-50'"
        >Overzicht</router-link>
        <router-link
          to="/sales/slides"
          class="block px-3 py-1.5 rounded-lg text-sm transition-colors"
          :class="route.path.startsWith('/sales/slides') ? 'bg-pienter-50 text-pienter-700 font-medium' : 'text-gray-600 hover:bg-gray-50'"
        >🎞️ Vrije slides</router-link>
      </SidebarSection>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useKlantenStore } from '../stores/klantenStore'
import SidebarSection from './SidebarSection.vue'

const route = useRoute()
const klantenStore = useKlantenStore()

const klantSubItems = [
  { segment: 'advertising', label: 'Advertising' },
  { segment: 'seo', label: 'SEO' },
  { segment: 'content', label: 'Content' },
  { segment: 'website', label: 'Website' },
] as const

const activeKlantId = computed(() => {
  const m = route.path.match(/^\/klanten\/([^/]+)/)
  if (!m) return null
  if (m[1] === 'new') return null
  return m[1]
})

const activeKlant = computed(() =>
  activeKlantId.value
    ? klantenStore.klanten.find(k => k.id === activeKlantId.value) ?? null
    : null,
)

const isKlantRoot = computed(() =>
  activeKlantId.value !== null && route.path === `/klanten/${activeKlantId.value}`,
)

const activeSegment = computed(() => {
  if (!activeKlantId.value) return null
  const m = route.path.match(/^\/klanten\/[^/]+\/([^/]+)/)
  return m ? m[1] : null
})

const klantenOpen = ref(true)

function loadCollapsed(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v === 'true'
  } catch {
    return fallback
  }
}

const medewerkersOpen = ref(loadCollapsed('sidebar.medewerkers.open', false))
const salesOpen = ref(loadCollapsed('sidebar.sales.open', false))

function toggleMedewerkers() {
  medewerkersOpen.value = !medewerkersOpen.value
  try { localStorage.setItem('sidebar.medewerkers.open', String(medewerkersOpen.value)) } catch {}
}
function toggleSales() {
  salesOpen.value = !salesOpen.value
  try { localStorage.setItem('sidebar.sales.open', String(salesOpen.value)) } catch {}
}

// Auto-open de juiste sectie bij route-wijziging
watch(() => route.path, (path) => {
  if (path.startsWith('/medewerkers')) medewerkersOpen.value = true
  if (path.startsWith('/sales')) salesOpen.value = true
}, { immediate: true })
</script>
