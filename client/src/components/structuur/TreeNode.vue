<template>
  <div>
    <div
      class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group"
      :class="{
        'bg-pienter-50 border border-pienter-200': selectedId === node.id,
        'hover:bg-gray-50': selectedId !== node.id
      }"
      :style="{ paddingLeft: node.level * 24 + 12 + 'px' }"
    >
      <!-- Expand/collapse -->
      <button v-if="children.length > 0" class="text-gray-400 hover:text-gray-600 w-4 text-xs" @click="expanded = !expanded">
        {{ expanded ? '▼' : '▶' }}
      </button>
      <span v-else class="w-4" />

      <!-- Icon -->
      <span class="text-sm">{{ typeIcon }}</span>

      <!-- Title (clickable) -->
      <span class="flex-1 font-medium cursor-pointer" :class="node.isParked ? 'text-gray-400 line-through' : 'text-gray-900'" @click="$emit('select', node.id)">
        {{ node.title }}
      </span>

      <!-- URL badge -->
      <span class="text-[10px] text-pienter-500 font-mono hidden group-hover:inline">{{ node.slug || '/' }}</span>

      <!-- Quick labels -->
      <span v-if="!node.isInMainNav" class="text-[10px] text-gray-400">(niet in menu)</span>
      <span v-if="node.isParked" class="text-[10px] text-amber-500">📦 geparkeerd</span>
      <span v-if="node.needsRedirect" class="text-[10px] text-red-500">↩️</span>

      <!-- Actions -->
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button class="text-xs text-gray-400 hover:text-pienter-600 p-0.5" @click="$emit('add-child', node.id)" title="Subpagina toevoegen">➕</button>
        <button class="text-xs text-gray-400 hover:text-pienter-600 p-0.5" @click="$emit('duplicate', node.id)" title="Dupliceren">📋</button>
        <button class="text-xs text-gray-400 hover:text-amber-600 p-0.5" @click="$emit('toggle-nav', node.id)" :title="node.isInMainNav ? 'Uit menu halen' : 'In menu plaatsen'">
          {{ node.isInMainNav ? '🔗' : '🔇' }}
        </button>
        <button class="text-xs text-gray-400 hover:text-amber-600 p-0.5" @click="$emit('toggle-park', node.id)" :title="node.isParked ? 'Terugplaatsen' : 'Parkeren'">📦</button>
        <button class="text-xs text-gray-400 hover:text-red-500 p-0.5" @click="$emit('delete', node.id)" title="Verwijderen">🗑</button>
      </div>
    </div>

    <!-- Children (recursief) -->
    <div v-if="expanded && children.length > 0">
      <TreeNode v-for="child in children" :key="child.id"
        :node="child" :all-nodes="allNodes" :project-id="projectId"
        :selected-id="selectedId"
        @select="$emit('select', $event)"
        @add-child="$emit('add-child', $event)"
        @delete="$emit('delete', $event)"
        @duplicate="$emit('duplicate', $event)"
        @toggle-nav="$emit('toggle-nav', $event)"
        @toggle-park="$emit('toggle-park', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SiteNode } from '@shared/types'

const props = defineProps<{
  node: SiteNode
  allNodes: SiteNode[]
  projectId: string
  selectedId: string | null
}>()

defineEmits<{
  select: [id: string]
  'add-child': [parentId: string]
  delete: [id: string]
  duplicate: [id: string]
  'toggle-nav': [id: string]
  'toggle-park': [id: string]
}>()

const expanded = ref(true)

const children = computed(() => {
  return props.allNodes
    .filter(n => n.parentId === props.node.id && !n.isParked)
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

const typeIcon = computed(() => {
  const icons: Record<string, string> = {
    page: '📄', post: '📰', archive: '📚', case: '💼', utility: '⚙️',
    landing: '🎯', service: '🔧', branch: '🏢', blog: '✏️', 'detail-template': '📋'
  }
  return icons[props.node.type] || '📄'
})
</script>
