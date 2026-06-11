<template>
  <span class="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700 align-middle">
    <span title="Ontstaan uit de Concurrenten-tab, nog niet bevestigd door de klant">aanname · uit concurrentie-analyse</span>
    <button
      v-if="bevestigbaar"
      class="text-amber-500 hover:text-amber-800 font-semibold"
      title="Bevestigd door klant — aanname-markering weghalen"
      @click.stop="$emit('bevestig')"
    >✓</button>
  </span>
</template>

<script setup lang="ts">
defineProps<{ bevestigbaar?: boolean }>()
defineEmits<{ bevestig: [] }>()
</script>
