<template>
  <DetailLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Vrije slides</h1>
        <p class="text-gray-500 text-sm mt-1">Eigen presentaties bouwen, opslaan als preset en exporteren naar .pptx</p>
      </div>
      <button class="btn-primary" @click="createNew">Nieuwe presentatie</button>
    </div>

    <div v-if="store.loading" class="text-center py-16 text-gray-400">Laden...</div>

    <div v-else-if="store.presentations.length === 0" class="text-center py-12">
      <div class="text-4xl mb-4">🎞️</div>
      <h2 class="text-lg font-semibold text-gray-700">Nog geen presentaties</h2>
      <p class="text-gray-500 mt-1">Maak een nieuwe presentatie aan om te beginnen.</p>
      <div class="mt-6 flex justify-center">
        <button class="btn-primary" @click="createNew">Nieuwe presentatie</button>
      </div>
    </div>

    <div v-else class="grid gap-3">
      <div
        v-for="p in store.presentations"
        :key="p.id"
        class="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:border-pienter-300 hover:shadow-sm transition-all"
      >
        <router-link :to="`/sales/slides/${p.id}`" class="flex-1 min-w-0">
          <div class="flex items-center gap-3">
            <div class="w-12 h-7 rounded bg-gradient-to-br from-pienter-100 to-pienter-200 flex-shrink-0"></div>
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">{{ p.name }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ p.slideCount }} slide{{ p.slideCount === 1 ? '' : 's' }} ·
                Bijgewerkt {{ formatDate(p.updatedAt) }}
              </p>
            </div>
          </div>
        </router-link>
        <button
          class="btn-secondary btn-sm text-red-600 hover:bg-red-50"
          @click="confirmDelete(p.id, p.name)"
        >Verwijderen</button>
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
