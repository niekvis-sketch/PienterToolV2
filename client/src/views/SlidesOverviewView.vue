<template>
  <DetailLayout>
    <div class="flex items-end justify-between mb-6">
      <div>
        <p class="eyebrow">Sales</p>
        <h1 class="text-3xl font-bold tracking-tight text-pienter-700 mt-1 flex items-baseline gap-2">
          Vrije slides<span class="accent-dot"></span>
        </h1>
        <p class="text-ink-3 text-sm mt-2">Eigen presentaties bouwen, opslaan als preset en exporteren naar .pptx</p>
      </div>
      <button class="btn btn-primary" @click="createNew">Nieuwe presentatie</button>
    </div>

    <div v-if="store.loading" class="text-center py-16 text-ink-mute">Laden...</div>

    <div v-else-if="store.presentations.length === 0" class="empty-state">
      <div class="text-4xl mb-4">🎞️</div>
      <h2 class="text-lg font-semibold text-ink-2">Nog geen presentaties</h2>
      <p>Maak een nieuwe presentatie aan om te beginnen.</p>
      <div class="mt-6 flex justify-center">
        <button class="btn btn-primary" @click="createNew">Nieuwe presentatie</button>
      </div>
    </div>

    <div v-else class="grid gap-3">
      <div
        v-for="p in store.presentations"
        :key="p.id"
        class="slide-card flex items-center justify-between"
      >
        <router-link :to="`/sales/slides/${p.id}`" class="flex-1 min-w-0">
          <div class="flex items-center gap-3">
            <div class="w-12 h-7 rounded-veld flex-shrink-0"
                 style="background: linear-gradient(135deg, var(--primary-soft) 0%, var(--primary-soft-2) 100%);"></div>
            <div class="min-w-0">
              <h3 class="font-semibold text-ink truncate">{{ p.name }}</h3>
              <p class="text-xs text-ink-3 mt-0.5">
                {{ p.slideCount }} slide{{ p.slideCount === 1 ? '' : 's' }} ·
                Bijgewerkt {{ formatDate(p.updatedAt) }}
              </p>
            </div>
          </div>
        </router-link>
        <button class="btn btn-destructive btn-sm" @click="confirmDelete(p.id, p.name)">Verwijderen</button>
      </div>
    </div>
  </DetailLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSlidesStore } from '../stores/slidesStore'
import DetailLayout from '../components/DetailLayout.vue'

const store = useSlidesStore()
const router = useRouter()

onMounted(() => { void store.fetchPresentations() })

async function createNew() {
  const name = window.prompt('Naam van de presentatie?', 'Nieuwe presentatie')
  if (!name) return
  const p = await store.createPresentation(name.trim() || 'Nieuwe presentatie')
  router.push(`/sales/slides/${p.id}`)
}

async function confirmDelete(id: string, name: string) {
  if (!window.confirm(`"${name}" verwijderen?`)) return
  await store.deletePresentation(id)
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.slide-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-3);
  padding: 14px 16px;
  transition: border-color .15s, box-shadow .15s, transform .12s;
}
.slide-card:hover {
  border-color: color-mix(in srgb, var(--primary) 30%, var(--line));
  box-shadow: var(--shadow-2, 0 6px 16px -6px rgba(20,36,27,0.10));
}
</style>
