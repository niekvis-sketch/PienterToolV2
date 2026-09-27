<template>
  <svg
    class="k-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="markup"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ICON_PATHS, type IconName } from './icons'

/**
 * Kompas-icoon. `accent` zet de roze accent-dot rechtsboven (nieuw / actie nodig) —
 * spaarzaam gebruiken.
 */
const props = withDefaults(defineProps<{
  name: IconName
  size?: number | string
  accent?: boolean
  strokeWidth?: number | string
}>(), {
  size: 18,
  accent: false,
  strokeWidth: 1.6,
})

// Statische, interne SVG-strings (geen gebruikersinvoer) — veilig voor v-html.
const markup = computed(() =>
  (ICON_PATHS[props.name] ?? ICON_PATHS.dots)
  + (props.accent ? '<circle cx="19" cy="5" r="2.2" fill="var(--accent)" stroke="none"/>' : ''),
)
</script>

<style scoped>
.k-icon { flex-shrink: 0; display: inline-block; vertical-align: middle; }
</style>
