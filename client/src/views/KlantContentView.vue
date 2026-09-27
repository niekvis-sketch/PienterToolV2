<template>
  <DetailLayout>
    <div class="empty-state">
      <div class="empty-state-icon"><KIcon name="note" :size="22" /></div>
      <h2 class="text-lg font-semibold text-ink-2">Content komt eraan</h2>
      <p>Hier komt het content-traject voor deze klant.</p>
    </div>
  </DetailLayout>
</template>

<script setup lang="ts">
import KIcon from '../components/ui/KIcon.vue'
import { onMounted, watch } from 'vue'
import { useKlantenStore } from '../stores/klantenStore'
import DetailLayout from '../components/DetailLayout.vue'

const props = defineProps<{ id: string }>()
const store = useKlantenStore()

onMounted(() => store.fetchKlant(props.id))
watch(() => props.id, (id) => store.fetchKlant(id))
</script>
