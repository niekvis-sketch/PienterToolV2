<template>
  <div
    ref="canvasRef"
    class="relative shadow-lg rounded overflow-hidden select-none"
    :style="{
      width: pxW + 'px',
      height: pxH + 'px',
      background: '#' + (slide.content.background || 'FFFFFF'),
    }"
    @mousedown.self="onCanvasMouseDown"
  >
    <div
      v-for="el in slide.content.elements"
      :key="el.id"
      class="absolute group"
      :class="[
        selectedId === el.id ? 'outline outline-2 outline-pienter-500' : 'outline outline-1 outline-transparent hover:outline-pienter-200',
        editingId === el.id ? 'cursor-text' : 'cursor-move',
      ]"
      :style="{
        left: inToPx(el.x) + 'px',
        top: inToPx(el.y) + 'px',
        width: inToPx(el.w) + 'px',
        height: inToPx(el.h) + 'px',
      }"
      @mousedown="onElementMouseDown($event, el.id)"
      @dblclick="onElementDoubleClick(el)"
    >
      <!-- Tekst element -->
      <div
        v-if="el.type === 'text'"
        class="w-full h-full overflow-hidden"
        :contenteditable="editingId === el.id"
        :style="textStyle(el)"
        @blur="onTextBlur($event, el.id)"
        @mousedown.stop="editingId === el.id ? null : null"
      >{{ el.value }}</div>

      <!-- Image element -->
      <img
        v-else
        :src="resolveSrc(el.src)"
        class="w-full h-full object-contain pointer-events-none"
        draggable="false"
      />

      <!-- Resize handles (alleen bij selectie) -->
      <template v-if="selectedId === el.id && editingId !== el.id">
        <div
          v-for="h in handles"
          :key="h"
          class="absolute w-3 h-3 bg-pienter-500 border-2 border-white rounded-full"
          :class="handleClass(h)"
          @mousedown.stop="onResizeStart($event, el.id, h)"
        ></div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Slide, SlideElement, SlideTextElement } from '@shared/types'

const props = defineProps<{
  slide: Slide
  selectedId: string | null
  scale?: number
}>()

const emit = defineEmits<{
  (e: 'select', id: string | null): void
  (e: 'update', id: string, patch: Partial<SlideElement>): void
}>()

// Canvas: 10 x 5.625 inch @ 96 dpi = 960 x 540 px (scale 1)
const BASE_DPI = 96
const scale = computed(() => props.scale ?? 1)
const pxW = computed(() => 10 * BASE_DPI * scale.value)
const pxH = computed(() => 5.625 * BASE_DPI * scale.value)

function inToPx(inches: number): number { return inches * BASE_DPI * scale.value }
function pxToIn(px: number): number { return px / (BASE_DPI * scale.value) }

const canvasRef = ref<HTMLDivElement | null>(null)
const editingId = ref<string | null>(null)

const handles = ['nw', 'ne', 'sw', 'se'] as const
type Handle = typeof handles[number]

function handleClass(h: Handle): string {
  const map: Record<Handle, string> = {
    nw: '-top-1.5 -left-1.5 cursor-nwse-resize',
    ne: '-top-1.5 -right-1.5 cursor-nesw-resize',
    sw: '-bottom-1.5 -left-1.5 cursor-nesw-resize',
    se: '-bottom-1.5 -right-1.5 cursor-nwse-resize',
  }
  return map[h]
}

function resolveSrc(src: string): string {
  if (src.startsWith('http') || src.startsWith('data:')) return src
  return `/api/${src}`
}

function textStyle(el: SlideTextElement): Record<string, string> {
  return {
    fontSize: `${el.fontSize * scale.value}px`,
    fontWeight: el.bold ? '700' : '400',
    fontStyle: el.italic ? 'italic' : 'normal',
    color: `#${el.color}`,
    textAlign: el.align,
    lineHeight: '1.25',
    outline: 'none',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }
}

// ---------- Selectie / canvas leeg klikken ----------
function onCanvasMouseDown() {
  emit('select', null)
  editingId.value = null
}

// ---------- Drag (verplaatsen) ----------
let dragState: { id: string; startX: number; startY: number; origX: number; origY: number } | null = null

function onElementMouseDown(e: MouseEvent, id: string) {
  if (editingId.value === id) return
  emit('select', id)
  const el = props.slide.content.elements.find(x => x.id === id)
  if (!el) return
  dragState = {
    id,
    startX: e.clientX,
    startY: e.clientY,
    origX: el.x,
    origY: el.y,
  }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
  e.preventDefault()
}

function onDragMove(e: MouseEvent) {
  if (!dragState) return
  const dx = pxToIn(e.clientX - dragState.startX)
  const dy = pxToIn(e.clientY - dragState.startY)
  emit('update', dragState.id, {
    x: clamp(dragState.origX + dx, 0, 10),
    y: clamp(dragState.origY + dy, 0, 5.625),
  })
}

function onDragEnd() {
  dragState = null
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

// ---------- Resize ----------
let resizeState: {
  id: string
  handle: Handle
  startX: number; startY: number
  origX: number; origY: number; origW: number; origH: number
} | null = null

function onResizeStart(e: MouseEvent, id: string, handle: Handle) {
  const el = props.slide.content.elements.find(x => x.id === id)
  if (!el) return
  resizeState = {
    id, handle,
    startX: e.clientX, startY: e.clientY,
    origX: el.x, origY: el.y, origW: el.w, origH: el.h,
  }
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeEnd)
  e.preventDefault()
}

function onResizeMove(e: MouseEvent) {
  if (!resizeState) return
  const dx = pxToIn(e.clientX - resizeState.startX)
  const dy = pxToIn(e.clientY - resizeState.startY)
  let { origX, origY, origW, origH } = resizeState
  let x = origX, y = origY, w = origW, h = origH
  const minSize = 0.3

  switch (resizeState.handle) {
    case 'se':
      w = Math.max(minSize, origW + dx)
      h = Math.max(minSize, origH + dy)
      break
    case 'sw':
      w = Math.max(minSize, origW - dx)
      h = Math.max(minSize, origH + dy)
      x = origX + (origW - w)
      break
    case 'ne':
      w = Math.max(minSize, origW + dx)
      h = Math.max(minSize, origH - dy)
      y = origY + (origH - h)
      break
    case 'nw':
      w = Math.max(minSize, origW - dx)
      h = Math.max(minSize, origH - dy)
      x = origX + (origW - w)
      y = origY + (origH - h)
      break
  }
  emit('update', resizeState.id, { x, y, w, h })
}

function onResizeEnd() {
  resizeState = null
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)
}

// ---------- Tekst editing ----------
function onElementDoubleClick(el: SlideElement) {
  if (el.type !== 'text') return
  editingId.value = el.id
  // Wacht een tick zodat contenteditable is aangezet, focus daarna
  setTimeout(() => {
    const node = canvasRef.value?.querySelector<HTMLDivElement>(`[contenteditable="true"]`)
    if (node) {
      node.focus()
      const range = document.createRange()
      range.selectNodeContents(node)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, 0)
}

function onTextBlur(e: FocusEvent, id: string) {
  const value = (e.target as HTMLDivElement).innerText
  emit('update', id, { value } as Partial<SlideElement>)
  editingId.value = null
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
</script>
