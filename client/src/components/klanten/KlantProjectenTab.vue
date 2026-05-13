<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="eyebrow">Klant</p>
        <h2 class="text-2xl font-bold tracking-tight text-pienter-700 mt-0.5 flex items-baseline gap-2">
          Diensten<span class="accent-dot"></span>
        </h2>
      </div>
      <router-link :to="{ path: '/projects/new', query: { clientName: klant.naam } }" class="btn btn-primary btn-sm">Nieuwe dienst</router-link>
    </div>

    <div v-if="projektVoorKlant.length === 0" class="card p-10 text-center">
      <div class="text-3xl mb-3">📁</div>
      <p class="text-ink-3">Nog geen diensten gekoppeld aan deze klant.</p>
      <p class="text-xs text-ink-mute mt-2">Maak een nieuwe dienst aan en gebruik <strong class="text-ink">{{ klant.naam }}</strong> als klantnaam.</p>
    </div>

    <div v-else class="grid gap-3">
      <router-link
        v-for="project in projektVoorKlant"
        :key="project.id"
        :to="`/klanten/${klant.id}/website`"
        class="dienst-card block"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h3 class="font-semibold text-ink truncate">{{ project.name }}</h3>
            <p class="text-sm text-ink-3 mt-0.5">{{ project.domainNew || project.domainCurrent || 'Geen domein' }}</p>
          </div>
          <div class="text-right text-xs text-ink-mute shrink-0">
            <div v-if="project.goLiveDate">Go-live: {{ formatDate(project.goLiveDate) }}</div>
            <div>Aangemaakt: {{ formatDate(project.createdAt) }}</div>
          </div>
        </div>
        <div class="mt-3 flex items-center gap-2 text-xs text-ink-3">
          <span class="badge badge-primary">{{ project.languages.join(', ').toUpperCase() }}</span>
          <span v-if="project.stagingNoindex" class="badge badge-warning"
                style="background: var(--warning-soft); color: var(--warning);">Staging noindex</span>
          <MedewerkerTag v-if="project.ownerId" :medewerker-id="project.ownerId" />
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'
import { useProjectStore } from '../../stores/projectStore'
import MedewerkerTag from '../medewerkers/MedewerkerTag.vue'

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

<style scoped>
.dienst-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-3);
  padding: 16px 18px;
  transition: border-color .15s, box-shadow .15s, transform .12s;
}
.dienst-card:hover {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--line));
  box-shadow: var(--shadow-2, 0 6px 16px -6px rgba(20,36,27,0.10));
  transform: translateY(-1px);
}
</style>
