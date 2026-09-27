<template>
  <aside class="sidebar w-64 shrink-0 flex flex-col h-screen">
    <!-- Logo -->
    <div class="h-[60px] px-5 flex items-center shrink-0">
      <router-link to="/" class="inline-flex" aria-label="Kompas — naar klanten">
        <img :src="kompasLogo" alt="Kompas" class="h-7 w-auto" />
      </router-link>
    </div>

    <!-- Secties -->
    <nav class="flex-1 overflow-y-auto px-3.5 pt-3 pb-5 flex flex-col gap-5">
      <!-- Klanten -->
      <SidebarSection
        label="Klanten"
        :open="klantenOpen"
        :active="route.path.startsWith('/klanten')"
        @toggle="klantenOpen = !klantenOpen"
      >
        <router-link
          to="/klanten"
          class="nav-item"
          :class="{ 'is-active': route.path === '/klanten' }"
        >
          <KIcon name="contacts" :size="17" />
          Alle klanten
        </router-link>

        <!-- Actieve klant -->
        <template v-if="activeKlant">
          <router-link
            :to="`/klanten/${activeKlant.id}`"
            class="nav-item"
            :class="{ 'is-active': isKlantRoot }"
          >
            <KIcon name="building" :size="17" />
            <span class="truncate">{{ activeKlant.naam }}</span>
          </router-link>
          <div class="ml-5 pl-3 border-l border-cream-400 flex flex-col gap-0.5">
            <router-link
              v-for="item in klantSubItems"
              :key="item.segment"
              :to="`/klanten/${activeKlant.id}/${item.segment}`"
              class="nav-item nav-item-sm"
              :class="{ 'is-active': activeSegment === item.segment }"
            >{{ item.label }}</router-link>
          </div>
        </template>
      </SidebarSection>

      <!-- Medewerkers -->
      <SidebarSection
        label="Medewerkers"
        :open="medewerkersOpen"
        :active="route.path.startsWith('/medewerkers')"
        @toggle="toggleMedewerkers"
      >
        <router-link
          to="/medewerkers"
          class="nav-item"
          :class="{ 'is-active': route.path === '/medewerkers' }"
        >
          <KIcon name="user" :size="17" />
          Overzicht
        </router-link>
      </SidebarSection>

      <!-- Sales -->
      <SidebarSection
        label="Sales"
        :open="salesOpen"
        :active="route.path.startsWith('/sales')"
        @toggle="toggleSales"
      >
        <router-link
          to="/sales"
          class="nav-item"
          :class="{ 'is-active': route.path === '/sales' }"
        >
          <KIcon name="deals" :size="17" />
          Overzicht
        </router-link>
        <router-link
          to="/sales/slides"
          class="nav-item"
          :class="{ 'is-active': route.path.startsWith('/sales/slides') }"
        >
          <KIcon name="slides" :size="17" />
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
import KIcon from './ui/KIcon.vue'
import kompasLogo from '../assets/kompas/kompas-logo.svg'

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
.sidebar {
  background: var(--bg-elev);
  border-right: 1px solid var(--line);
}
</style>
