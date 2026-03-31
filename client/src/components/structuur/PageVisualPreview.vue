<template>
  <div class="page-visual-preview">
    <!-- Page frame -->
    <div class="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden max-w-[480px] mx-auto">
      <!-- Browser chrome -->
      <div class="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
        <div class="flex gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-red-400"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-green-400"></div>
        </div>
        <div class="flex-1 bg-white rounded-md border border-gray-200 px-3 py-1 text-[10px] text-gray-400 font-mono truncate">
          {{ pageUrl }}
        </div>
      </div>

      <!-- Page content -->
      <div class="divide-y divide-gray-100">
        <div v-if="blocks.length === 0" class="p-8 text-center">
          <div class="text-3xl mb-2">🧱</div>
          <p class="text-xs text-gray-400">Nog geen blokken toegevoegd</p>
        </div>

        <div
          v-for="(block, idx) in blocks"
          :key="block.id"
          class="relative group"
        >
          <!-- Component image -->
          <div class="relative">
            <img
              :src="getComponentImage(block)"
              :alt="block.name"
              class="w-full h-auto block"
              :class="{ 'opacity-60': !hasComponentImage(block) }"
              @error="handleImageError($event)"
            />
            <!-- Overlay label -->
            <div class="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div class="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-center max-w-[80%]">
                <div class="text-xs font-semibold text-gray-900">{{ block.name }}</div>
                <div class="text-[10px] text-gray-500 mt-0.5">{{ block.type }}</div>
                <div v-if="block.goal" class="text-[10px] text-pienter-600 mt-0.5 line-clamp-2">{{ block.goal }}</div>
              </div>
            </div>
            <!-- Block number badge -->
            <div class="absolute top-1.5 left-1.5 bg-pienter-600 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
              {{ idx + 1 }}
            </div>
            <!-- Block type badge -->
            <div class="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm text-[9px] text-gray-600 font-medium px-1.5 py-0.5 rounded shadow-sm">
              {{ block.type }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-4 text-center">
      <p class="text-[10px] text-gray-400">
        <span class="inline-block w-2 h-2 rounded-full bg-pienter-600 mr-1 align-middle"></span>
        Hover over een blok voor details
        <span class="mx-2">·</span>
        Blokken zonder component-afbeelding tonen een placeholder
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PageBlock, ComponentBlock } from '@shared/types'

const props = defineProps<{
  blocks: PageBlock[]
  components: ComponentBlock[]
  pageUrl: string
}>()

const PLACEHOLDER = '/component-placeholder.svg'

/** Find the matching component for a block by matching block.type to component.name */
function findComponent(block: PageBlock): ComponentBlock | undefined {
  // First try exact match on block.type
  let comp = props.components.find(c => c.name === block.type)
  if (comp) return comp

  // Also try matching by componentPattern field
  if (block.componentPattern) {
    comp = props.components.find(c => c.name === block.componentPattern)
    if (comp) return comp
  }

  return undefined
}

function hasComponentImage(block: PageBlock): boolean {
  const comp = findComponent(block)
  return !!(comp && comp.imagePath)
}

function getComponentImage(block: PageBlock): string {
  const comp = findComponent(block)
  if (comp && comp.imagePath) {
    return `/api/${comp.imagePath}`
  }
  return PLACEHOLDER
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  if (img.src !== window.location.origin + PLACEHOLDER) {
    img.src = PLACEHOLDER
  }
}
</script>
