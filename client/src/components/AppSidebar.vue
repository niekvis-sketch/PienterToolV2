<template>
  <aside class="w-64 bg-white border-r border-cream-400 shrink-0 flex flex-col h-screen">
    <!-- Header -->
    <div class="h-12 px-5 border-b border-cream-400 flex items-center gap-2.5">
      <svg class="w-7 h-7" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="var(--primary)"/>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Space Grotesk, system-ui" font-weight="700" font-size="16">P</text>
      </svg>
      <span class="font-semibold text-ink tracking-tight">Pienter Dashboard</span>
      <span class="accent-dot ml-auto"></span>
    </div>

    <!-- Sections -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
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
          class="nav-item"
          :class="{ 'is-active': route.path === '/klanten' }"
        >Alle klanten</router-link>

        <!-- Active klant -->
        <div v-if="activeKlant" class="mt-0.5">
          <router-link
            :to="`/klanten/${activeKlant.id}`"
            class="nav-item"
            :class="{ 'is-active': isKlantRoot }"
          >
            <span class="text-base">📄</span>
            <span class="truncate">{{ activeKlant.naam }}</span>
          </router-link>
          <div class="ml-3 pl-3 border-l border-cream-400 mt-0.5 space-y-0.5">
            <router-link
              v-for="item in klantSubItems"
              :key="item.segment"
              :to="`/klanten/${activeKlant.id}/${item.segment}`"
              class="nav-item nav-item-sm"
              :class="{ 'is-active': activeSegment === item.segment }"
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
          class="nav-item"
          :class="{ 'is-active': route.path === '/medewerkers' }"
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
          class="nav-item"
          :class="{ 'is-active': route.path === '/sales' }"
        >Overzicht</router-link>
        <router-link
          to="/sales/slides"
          class="nav-item"
          :class="{ 'is-active': route.path.startsWith('/sales/slides') }"
        >
          <span class="text-base">🎞️</span>
          Vrije slides
        </router-link>
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
  try { localStorage.setItem('sidebar.medewerkers.open', String(medewerkersOpen.value)) } catch { /* empty */ }
}
function toggleSales() {
  salesOpen.value = !salesOpen.value
  try { localStorage.setItem('sidebar.sales.open', String(salesOpen.value)) } catch { /* empty */ }
}

// Auto-open de juiste sectie bij route-wijziging
watch(() => route.path, (path) => {
  if (path.startsWith('/medewerkers')) medewerkersOpen.value = true
  if (path.startsWith('/sales')) salesOpen.value = true
}, { immediate: true })
</script>

<style scoped>
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 34px;
  padding: 0 12px;
  border-radius: var(--r-2);
  color: var(--ink-2);
  font-weight: 500;
  font-size: 13.5px;
  cursor: pointer;
  transition: background .12s, color .12s;
}
.nav-item:hover {
  background: color-mix(in srgb, var(--primary) 5%, transparent);
  color: var(--ink);
}
.nav-item.is-active {
  background: var(--surface-2);
  color: var(--primary);
  box-shadow: var(--shadow-1, 0 1px 0 rgba(20,36,27,0.04));
  font-weight: 600;
}
.nav-item.is-active::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: var(--accent);
  border-radius: 2px;
}
.nav-item-sm {
  height: 30px;
  font-size: 13px;
}
</style>
