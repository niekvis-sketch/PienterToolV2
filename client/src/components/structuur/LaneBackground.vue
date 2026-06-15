<template>
  <!-- Achtergrond-"swimlane": vult de hele node-grootte (gezet via node.style) -->
  <div
    class="pointer-events-none relative h-full w-full rounded-2xl border border-dashed transition-colors"
    :class="data.active ? 'border-pienter-300 bg-pienter-50/60' : 'border-gray-200 bg-gray-100/40'"
  >
    <span
      class="absolute left-3 top-2 select-none rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      :class="data.active ? 'bg-pienter-100 text-pienter-700' : 'bg-white/70 text-gray-400'"
    >{{ data.label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: { label: string; level: number; active?: boolean }
}>()
</script>
