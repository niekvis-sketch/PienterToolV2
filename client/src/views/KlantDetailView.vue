<template>
  <div v-if="!store.currentKlant" class="text-center py-16 text-ink-mute">Laden...</div>
  <KlantTabs v-else />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useKlantenStore } from '../stores/klantenStore'
import { useProjectStore } from '../stores/projectStore'
import KlantTabs from '../components/klanten/KlantTabs.vue'

const props = defineProps<{ id: string }>()
const store = useKlantenStore()
const projectStore = useProjectStore()

async function loadAll() {
  await store.fetchKlant(props.id)
  await Promise.all([
    store.fetchCommunicatie(props.id),
    store.fetchContactpersonen(props.id),
    store.fetchHuisstijl(props.id),
    store.fetchKlantDoelgroepen(props.id),
    store.fetchDoelen(props.id),
    store.fetchFocuspunten(props.id),
    projectStore.fetchProjects(),
  ])
}

onMounted(loadAll)
watch(() => props.id, loadAll)
</script>
