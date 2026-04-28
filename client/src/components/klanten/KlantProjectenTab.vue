<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">Projecten</h2>
      <router-link :to="{ path: '/projects/new', query: { clientName: klant.naam } }" class="btn-primary btn-sm">Nieuw project</router-link>
    </div>

    <div v-if="projektVoorKlant.length === 0" class="card p-10 text-center">
      <div class="text-3xl mb-3">📁</div>
      <p class="text-gray-500">Nog geen projecten gekoppeld aan deze klant.</p>
      <p class="text-xs text-gray-400 mt-2">Maak een nieuw project aan en gebruik <strong>{{ klant.naam }}</strong> als klantnaam.</p>
    </div>

    <div v-else class="grid gap-3">
      <router-link
        v-for="project in projektVoorKlant"
        :key="project.id"
        :to="`/klanten/${klant.id}/website`"
        class="card p-4 hover:border-pienter-300 hover:shadow-md transition-all block"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-gray-900">{{ project.name }}</h3>
            <p class="text-sm text-gray-500 mt-0.5">{{ project.domainNew || project.domainCurrent || 'Geen domein' }}</p>
          </div>
          <div class="text-right text-xs text-gray-400">
            <div v-if="project.goLiveDate">Go-live: {{ formatDate(project.goLiveDate) }}</div>
            <div>Aangemaakt: {{ formatDate(project.createdAt) }}</div>
          </div>
        </div>
        <div class="mt-2 flex gap-2 text-xs text-gray-500">
          <span>{{ project.languages.join(', ').toUpperCase() }}</span>
          <span v-if="project.stagingNoindex">· Staging noindex</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'
import { useProjectStore } from '../../stores/projectStore'

const store = useKlantenStore()
const projectStore = useProjectStore()

const klant = computed(() => store.currentKlant!)

const projektVoorKlant = computed(() =>
  projectStore.projects.filter(p => p.clientName === klant.value.naam)
)

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
