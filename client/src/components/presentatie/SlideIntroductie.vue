<template>
  <div class="flex flex-col items-center justify-center h-full text-center px-8">
    <div class="text-6xl mb-6">🌐</div>
    <h1 class="text-4xl font-bold mb-4" :class="textClass">{{ sessie.name }}</h1>
    <p class="text-xl" :class="subtextClass">{{ project.clientName }}</p>
    <div class="mt-8 flex items-center gap-2" :class="subtextClass">
      <span class="text-sm opacity-60">{{ new Date(sessie.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PresentatieSessie, Project } from '@shared/types'
defineProps<{
  sessie: PresentatieSessie
  project: Project
  textClass: string
  subtextClass: string
}>()
</script>
