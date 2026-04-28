<template>
  <DetailLayout>
    <div class="text-center py-12">
      <div class="text-4xl mb-4">🔍</div>
      <h2 class="text-lg font-semibold text-gray-700">SEO komt eraan</h2>
      <p class="text-gray-500 mt-1">Hier komt het SEO-traject voor deze klant.</p>
    </div>
  </DetailLayout>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useKlantenStore } from '../stores/klantenStore'
import DetailLayout from '../components/DetailLayout.vue'

const props = defineProps<{ id: string }>()
const store = useKlantenStore()

onMounted(() => store.fetchKlant(props.id))
watch(() => props.id, (id) => store.fetchKlant(id))
</script>
