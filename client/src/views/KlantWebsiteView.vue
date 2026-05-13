<template>
  <div v-if="loading" class="text-center py-16 text-ink-mute">Laden...</div>

  <!-- Empty state: geen Website-project -->
  <DetailLayout v-else-if="!resolvedProject">
    <div class="empty-state">
      <div class="text-4xl mb-4">🌐</div>
      <h2 class="text-lg font-semibold text-ink-2">Nog geen website-project</h2>
      <p>
        Voor <strong class="text-ink">{{ klantenStore.currentKlant?.naam ?? '...' }}</strong> is nog geen website-project aangemaakt.
      </p>
      <div class="mt-6 flex justify-center">
        <router-link
          :to="{ path: '/projects/new', query: { clientName: klantenStore.currentKlant?.naam } }"
          class="btn btn-primary"
        >Nieuw project aanmaken</router-link>
      </div>
    </div>
  </DetailLayout>

  <!-- Project tabs -->
  <ProjectTabs v-else />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useKlantenStore } from '../stores/klantenStore'
import { useProjectStore } from '../stores/projectStore'
import DetailLayout from '../components/DetailLayout.vue'
import ProjectTabs from '../components/project/ProjectTabs.vue'
import type { Project } from '@shared/types'

const props = defineProps<{ id: string }>()
const klantenStore = useKlantenStore()
const projectStore = useProjectStore()
const loading = ref(true)

const resolvedProject = computed<Project | null>(() => {
  const klant = klantenStore.currentKlant
  if (!klant) return null
  const matches = projectStore.projects.filter(p => p.clientName === klant.naam)
  if (matches.length === 0) return null
  if (matches.length > 1) {
    console.warn(`[KlantWebsiteView] Meerdere projecten gevonden voor klant "${klant.naam}", neem meest recente.`)
    return [...matches].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0]
  }
  return matches[0]
})

async function loadAll(klantId: string) {
  loading.value = true
  try {
    if (klantenStore.currentKlant?.id !== klantId) {
      await klantenStore.fetchKlant(klantId)
    }
    if (projectStore.projects.length === 0) {
      await projectStore.fetchProjects()
    }
    if (resolvedProject.value) {
      await Promise.all([
        projectStore.fetchProject(resolvedProject.value.id),
        projectStore.fetchPages(resolvedProject.value.id),
        projectStore.fetchDoelgroepen(resolvedProject.value.id),
        projectStore.fetchComponenten(resolvedProject.value.id),
      ])
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => loadAll(props.id))
watch(() => props.id, (id) => loadAll(id))
</script>
