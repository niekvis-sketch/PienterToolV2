<template>
  <div>
    <button
      type="button"
      class="section-toggle caps"
      :class="{ 'is-active': active }"
      :aria-expanded="open"
      @click="handleClick"
    >
      {{ label }}
      <KIcon name="chevD" :size="14" class="chev" :class="{ 'is-open': open }" />
    </button>
    <div v-if="open" class="flex flex-col gap-0.5">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import KIcon from './ui/KIcon.vue'

defineProps<{
  label: string
  open: boolean
  active?: boolean
}>()

const emit = defineEmits<{ toggle: [] }>()

function handleClick() {
  emit('toggle')
}
</script>

<style scoped>
.section-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 8px;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color var(--motion-tint);
}
.section-toggle:hover,
.section-toggle.is-active { color: var(--ink-2); }
.chev {
  color: var(--ink-mute);
  transition: transform var(--motion-base);
}
.chev.is-open { transform: rotate(180deg); }
</style>
