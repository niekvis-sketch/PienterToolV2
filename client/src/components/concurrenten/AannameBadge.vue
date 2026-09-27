<template>
  <span class="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700 align-middle">
    <span title="Ontstaan uit de Concurrenten-tab, nog niet bevestigd door de klant">aanname · uit concurrentie-analyse</span>
    <button
      v-if="bevestigbaar"
      class="text-amber-600 hover:text-amber-800 inline-flex"
      title="Bevestigd door klant — aanname-markering weghalen"
      aria-label="Aanname bevestigen"
      @click.stop="$emit('bevestig')"
    ><KIcon name="check" :size="12" stroke-width="2.2" /></button>
  </span>
</template>

<script setup lang="ts">
import KIcon from '../ui/KIcon.vue'
defineProps<{ bevestigbaar?: boolean }>()
defineEmits<{ bevestig: [] }>()
</script>
