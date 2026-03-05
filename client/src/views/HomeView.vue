<template>
  <div class="max-w-5xl mx-auto px-6 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Projecten</h1>
        <p class="text-gray-500 text-sm mt-1">Overzicht van alle websiteprojecten</p>
      </div>
      <div class="flex gap-3">
        <button class="btn-secondary btn-sm" @click="handleSeed">Laad demo-data</button>
        <router-link to="/projects/new" class="btn-primary">Nieuw project</router-link>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="text-center py-16 text-gray-400">Laden...</div>

    <!-- Lege staat -->
    <div v-else-if="store.projects.length === 0" class="empty-state card p-12">
      <div class="text-4xl mb-4">📂</div>
      <h2 class="text-lg font-semibold text-gray-700">Nog geen projecten</h2>
      <p>Maak een nieuw project aan of laad de demo-data om te beginnen.</p>
      <div class="mt-6 flex justify-center gap-3">
        <button class="btn-secondary" @click="handleSeed">Laad demo-data</button>
        <router-link to="/projects/new" class="btn-primary">Nieuw project</router-link>
      </div>
    </div>

    <!-- Project cards -->
    <div v-else class="grid gap-4">
      <router-link
        v-for="project in store.projects"
        :key="project.id"
        :to="`/projects/${project.id}`"
        class="card p-5 hover:border-pienter-300 hover:shadow-md transition-all block"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-gray-900">{{ project.name }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ project.clientName }}</p>
          </div>
          <div class="text-right text-xs text-gray-400">
            <div v-if="project.goLiveDate">Go-live: {{ formatDate(project.goLiveDate) }}</div>
            <div>Aangemaakt: {{ formatDate(project.createdAt) }}</div>
          </div>
        </div>
        <div class="mt-3 flex gap-3 text-xs text-gray-500">
          <span>{{ project.domainNew || 'Geen domein' }}</span>
          <span>·</span>
          <span>{{ project.languages.join(', ').toUpperCase() }}</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

onMounted(() => {
  store.fetchProjects()
})

async function handleSeed() {
  await store.seed()
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
