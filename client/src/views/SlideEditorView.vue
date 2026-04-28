<template>
  <div v-if="!presentation" class="flex items-center justify-center h-[80vh] text-gray-400">Laden...</div>

  <div v-else class="flex h-[calc(100vh-57px)] bg-gray-100">
    <!-- Linker panel: thumbnails -->
    <aside class="w-48 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div class="p-3 border-b border-gray-200 flex items-center justify-between">
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Slides</span>
        <span class="text-xs text-gray-400">{{ sortedSlides.length }}</span>
      </div>
      <div class="flex-1 overflow-y-auto p-2 space-y-2">
        <div
          v-for="(s, i) in sortedSlides"
          :key="s.id"
          class="relative group"
          draggable="true"
          @dragstart="onDragStart(i)"
          @dragover.prevent="onDragOver(i)"
          @drop.prevent="onDrop(i)"
          @dragend="onDragEnd"
        >
          <button
            class="w-full text-left rounded border-2 transition-all"
            :class="s.id === currentSlideId ? 'border-pienter-500 ring-2 ring-pienter-200' : 'border-gray-200 hover:border-gray-300'"
            @click="currentSlideId = s.id; selectedElementId = null"
          >
            <div
              class="aspect-video relative rounded overflow-hidden"
              :style="{ background: '#' + s.content.background }"
            >
              <div
                v-for="el in s.content.elements"
                :key="el.id"
                class="absolute"
                :style="thumbStyle(el)"
              >
                <div v-if="el.type === 'text'" class="overflow-hidden" :style="thumbTextStyle(el)">{{ el.value }}</div>
                <img v-else :src="resolveSrc(el.src)" class="w-full h-full object-contain" />
              </div>
            </div>
          </button>
          <div class="absolute -top-1 -left-1 bg-gray-700 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{{ i + 1 }}</div>
        </div>
        <button
          class="w-full text-xs text-gray-500 py-2 border-2 border-dashed border-gray-300 rounded hover:border-pienter-400 hover:text-pienter-600"
          @click="showLayoutPicker = true"
        >+ Slide</button>
      </div>
    </aside>

    <!-- Midden: canvas + toolbar -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Toolbar -->
      <div class="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 shrink-0">
        <router-link to="/sales/slides" class="btn-secondary btn-sm">← Terug</router-link>
        <input
          v-model="presentation.name"
          class="text-sm font-semibold px-2 py-1 border border-transparent hover:border-gray-300 rounded focus:border-pienter-500 focus:outline-none"
          @blur="store.scheduleSave()"
        />
        <span v-if="store.saving" class="text-xs text-pienter-500 animate-pulse ml-2">Opslaan...</span>
        <span v-else class="text-xs text-gray-400 ml-2">Opgeslagen ✓</span>

        <div class="flex-1"></div>

        <button class="btn-secondary btn-sm" :disabled="!currentSlide" @click="addText">+ Tekst</button>
        <button class="btn-secondary btn-sm" :disabled="!currentSlide" @click="triggerImageUpload">+ Afbeelding</button>
        <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onImageSelected" />
        <button class="btn-secondary btn-sm" @click="showLayoutPicker = true">+ Slide</button>
        <button class="btn-secondary btn-sm" :disabled="!currentSlide" @click="saveAsPreset">Opslaan als preset</button>
        <button class="btn-secondary btn-sm" @click="showPresetLibrary = true">Preset bibliotheek</button>
        <button class="btn-secondary btn-sm text-red-600" :disabled="!currentSlide" @click="deleteCurrentSlide">Verwijder slide</button>
        <button class="btn-primary btn-sm" :disabled="exporting" @click="doExport">
          {{ exporting ? 'Exporteren...' : 'Exporteer .pptx' }}
        </button>
      </div>

      <!-- Canvas area -->
      <div class="flex-1 overflow-auto flex items-center justify-center p-6">
        <SlideCanvas
          v-if="currentSlide"
          :slide="currentSlide"
          :selected-id="selectedElementId"
          :scale="canvasScale"
          @select="onSelect"
          @update="onElementUpdate"
        />
        <div v-else class="text-gray-400">Geen slide geselecteerd. Voeg een slide toe.</div>
      </div>
    </main>

    <!-- Rechter panel: eigenschappen -->
    <aside class="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0">
      <div class="p-3 border-b border-gray-200">
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Eigenschappen</span>
      </div>
      <div class="flex-1 overflow-y-auto p-3 space-y-4">
        <!-- Element eigenschappen -->
        <template v-if="selectedElement">
          <div class="space-y-2">
            <label class="text-xs font-medium text-gray-600">Type</label>
            <div class="text-sm text-gray-900">{{ selectedElement.type === 'text' ? 'Tekst' : 'Afbeelding' }}</div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-medium text-gray-600">X (in)</label>
              <input type="number" step="0.1" class="input" :value="selectedElement.x.toFixed(2)" @input="patchSel('x', $event)" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Y (in)</label>
              <input type="number" step="0.1" class="input" :value="selectedElement.y.toFixed(2)" @input="patchSel('y', $event)" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Breedte</label>
              <input type="number" step="0.1" class="input" :value="selectedElement.w.toFixed(2)" @input="patchSel('w', $event)" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Hoogte</label>
              <input type="number" step="0.1" class="input" :value="selectedElement.h.toFixed(2)" @input="patchSel('h', $event)" />
            </div>
          </div>

          <template v-if="selectedElement.type === 'text'">
            <div>
              <label class="text-xs font-medium text-gray-600">Tekst</label>
              <textarea
                class="textarea h-20"
                :value="selectedElement.value"
                @input="patchSelStr('value', $event)"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs font-medium text-gray-600">Lettergrootte</label>
                <input type="number" min="8" max="120" class="input" :value="selectedElement.fontSize" @input="patchSel('fontSize', $event)" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600">Kleur</label>
                <input
                  type="color"
                  class="input h-9 p-1"
                  :value="'#' + selectedElement.color"
                  @input="patchColor($event)"
                />
              </div>
            </div>
            <div class="flex gap-2">
              <button
                class="btn-secondary btn-sm flex-1"
                :class="{ 'bg-pienter-100 text-pienter-700': selectedElement.bold }"
                @click="patchSelBool('bold', !selectedElement.bold)"
              >B</button>
              <button
                class="btn-secondary btn-sm flex-1 italic"
                :class="{ 'bg-pienter-100 text-pienter-700': selectedElement.italic }"
                @click="patchSelBool('italic', !selectedElement.italic)"
              >I</button>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Uitlijning</label>
              <div class="flex gap-1">
                <button
                  v-for="a in (['left','center','right'] as const)"
                  :key="a"
                  class="btn-secondary btn-sm flex-1"
                  :class="{ 'bg-pienter-100 text-pienter-700': selectedElement.align === a }"
                  @click="patchSelAlign(a)"
                >{{ a === 'left' ? '⇤' : a === 'center' ? '⇔' : '⇥' }}</button>
              </div>
            </div>
          </template>

          <button class="btn-secondary btn-sm w-full text-red-600" @click="deleteSelected">Element verwijderen</button>
        </template>

        <!-- Slide eigenschappen (geen selectie) -->
        <template v-else-if="currentSlide">
          <div>
            <label class="text-xs font-medium text-gray-600">Achtergrondkleur</label>
            <input
              type="color"
              class="input h-9 p-1"
              :value="'#' + currentSlide.content.background"
              @input="setBackground($event)"
            />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Layout</label>
            <div class="text-sm text-gray-900">{{ layoutLabel(currentSlide.layout) }}</div>
          </div>
          <p class="text-xs text-gray-400">Klik op een element om eigenschappen te bewerken.</p>
        </template>

        <p v-else class="text-xs text-gray-400">Geen slide geselecteerd.</p>
      </div>
    </aside>

    <!-- Modals -->
    <LayoutPicker
      v-if="showLayoutPicker"
      @close="showLayoutPicker = false"
      @pick="onPickLayout"
    />
    <PresetLibrary
      v-if="showPresetLibrary"
      @close="showPresetLibrary = false"
      @insert="onInsertPreset"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSlidesStore } from '../stores/slidesStore'
import SlideCanvas from '../components/slides/SlideCanvas.vue'
import LayoutPicker from '../components/slides/LayoutPicker.vue'
import PresetLibrary from '../components/slides/PresetLibrary.vue'
import type {
  Slide, SlideElement, SlideLayoutType, SlidePreset,
} from '@shared/types'

const props = defineProps<{ id: string }>()
const store = useSlidesStore()

const currentSlideId = ref<string | null>(null)
const selectedElementId = ref<string | null>(null)
const showLayoutPicker = ref(false)
const showPresetLibrary = ref(false)
const exporting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const canvasScale = ref(0.85)

const presentation = computed(() => store.current)

const sortedSlides = computed<Slide[]>(() => {
  if (!presentation.value) return []
  return [...presentation.value.slides].sort((a, b) => a.order - b.order)
})

const currentSlide = computed<Slide | null>(() => {
  return sortedSlides.value.find(s => s.id === currentSlideId.value) ?? null
})

const selectedElement = computed<SlideElement | null>(() => {
  if (!currentSlide.value || !selectedElementId.value) return null
  return currentSlide.value.content.elements.find(e => e.id === selectedElementId.value) ?? null
})

onMounted(async () => {
  await store.fetchPresentation(props.id)
  if (sortedSlides.value.length > 0) currentSlideId.value = sortedSlides.value[0].id
})

watch(sortedSlides, (slides) => {
  if (!currentSlideId.value && slides.length > 0) currentSlideId.value = slides[0].id
  if (currentSlideId.value && !slides.find(s => s.id === currentSlideId.value)) {
    currentSlideId.value = slides[0]?.id ?? null
  }
})

// ---------- Selectie & element updates ----------
function onSelect(id: string | null) { selectedElementId.value = id }

function onElementUpdate(id: string, patch: Partial<SlideElement>) {
  if (!currentSlide.value) return
  const slide = currentSlide.value
  const elements = slide.content.elements.map(e =>
    e.id === id ? ({ ...e, ...patch } as SlideElement) : e,
  )
  store.updateSlide(slide.id, { content: { ...slide.content, elements } })
}

function patchSel(field: 'x' | 'y' | 'w' | 'h' | 'fontSize', e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value)
  if (isNaN(v) || !selectedElement.value) return
  onElementUpdate(selectedElement.value.id, { [field]: v } as Partial<SlideElement>)
}
function patchSelStr(field: 'value', e: Event) {
  if (!selectedElement.value) return
  onElementUpdate(selectedElement.value.id, { [field]: (e.target as HTMLTextAreaElement).value } as Partial<SlideElement>)
}
function patchSelBool(field: 'bold' | 'italic', value: boolean) {
  if (!selectedElement.value) return
  onElementUpdate(selectedElement.value.id, { [field]: value } as Partial<SlideElement>)
}
function patchSelAlign(value: 'left' | 'center' | 'right') {
  if (!selectedElement.value) return
  onElementUpdate(selectedElement.value.id, { align: value } as Partial<SlideElement>)
}
function patchColor(e: Event) {
  if (!selectedElement.value) return
  const hex = (e.target as HTMLInputElement).value.replace('#', '').toUpperCase()
  onElementUpdate(selectedElement.value.id, { color: hex } as Partial<SlideElement>)
}
function deleteSelected() {
  if (!currentSlide.value || !selectedElement.value) return
  const slide = currentSlide.value
  const elements = slide.content.elements.filter(e => e.id !== selectedElement.value!.id)
  store.updateSlide(slide.id, { content: { ...slide.content, elements } })
  selectedElementId.value = null
}

function setBackground(e: Event) {
  if (!currentSlide.value) return
  const hex = (e.target as HTMLInputElement).value.replace('#', '').toUpperCase()
  store.updateSlide(currentSlide.value.id, {
    content: { ...currentSlide.value.content, background: hex },
  })
}

// ---------- Tekst en afbeelding toevoegen ----------
function addText() {
  if (!currentSlide.value) return
  const slide = currentSlide.value
  const newEl: SlideElement = {
    id: cryptoRandomId(),
    type: 'text',
    slot: 'custom',
    value: 'Nieuwe tekst',
    x: 1, y: 2, w: 4, h: 0.8,
    fontSize: 18, color: '1F2937', align: 'left',
  }
  store.updateSlide(slide.id, {
    content: { ...slide.content, elements: [...slide.content.elements, newEl] },
  })
  selectedElementId.value = newEl.id
}

function triggerImageUpload() { fileInputRef.value?.click() }

async function onImageSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !currentSlide.value) return
  const src = await store.uploadImage(file)
  const slide = currentSlide.value
  const newEl: SlideElement = {
    id: cryptoRandomId(),
    type: 'image',
    slot: 'custom',
    src,
    x: 1, y: 1, w: 5, h: 3,
  }
  store.updateSlide(slide.id, {
    content: { ...slide.content, elements: [...slide.content.elements, newEl] },
  })
  selectedElementId.value = newEl.id
}

// ---------- Slide management ----------
async function onPickLayout(layout: SlideLayoutType) {
  showLayoutPicker.value = false
  await store.addSlide(layout)
  // Persist meteen zodat order in sync blijft
  await store.persistCurrent()
  const last = sortedSlides.value[sortedSlides.value.length - 1]
  if (last) currentSlideId.value = last.id
}

async function onInsertPreset(preset: SlidePreset) {
  showPresetLibrary.value = false
  await store.addSlide(preset.layout, preset.content)
  await store.persistCurrent()
  const last = sortedSlides.value[sortedSlides.value.length - 1]
  if (last) currentSlideId.value = last.id
}

function deleteCurrentSlide() {
  if (!currentSlide.value) return
  if (!window.confirm('Deze slide verwijderen?')) return
  const idx = sortedSlides.value.findIndex(s => s.id === currentSlide.value!.id)
  store.deleteSlide(currentSlide.value.id)
  selectedElementId.value = null
  const next = sortedSlides.value[Math.max(0, idx - 1)] ?? sortedSlides.value[0]
  currentSlideId.value = next?.id ?? null
}

async function saveAsPreset() {
  if (!currentSlide.value) return
  const name = window.prompt('Naam voor deze preset?', '')
  if (!name) return
  await store.savePreset(name.trim(), currentSlide.value)
  window.alert('Preset opgeslagen.')
}

async function doExport() {
  exporting.value = true
  try {
    await store.exportPptx()
  } catch (e) {
    console.error(e)
    window.alert('Export mislukt.')
  } finally {
    exporting.value = false
  }
}

// ---------- Drag & drop reordering thumbnails ----------
let dragFromIndex: number | null = null
function onDragStart(i: number) { dragFromIndex = i }
function onDragOver(_i: number) { /* prevent default in template */ }
function onDrop(toIndex: number) {
  if (dragFromIndex === null || dragFromIndex === toIndex) return
  store.reorderSlides(dragFromIndex, toIndex)
  dragFromIndex = null
}
function onDragEnd() { dragFromIndex = null }

// ---------- Helpers ----------
function thumbStyle(el: SlideElement): Record<string, string> {
  return {
    left: (el.x / 10 * 100) + '%',
    top: (el.y / 5.625 * 100) + '%',
    width: (el.w / 10 * 100) + '%',
    height: (el.h / 5.625 * 100) + '%',
  }
}

function thumbTextStyle(el: SlideElement): Record<string, string> {
  if (el.type !== 'text') return {}
  return {
    fontSize: Math.max(4, el.fontSize / 8) + 'px',
    fontWeight: el.bold ? '700' : '400',
    color: '#' + el.color,
    textAlign: el.align,
    lineHeight: '1.1',
  }
}

function resolveSrc(src: string): string {
  if (src.startsWith('http') || src.startsWith('data:')) return src
  return `/api/${src}`
}

function layoutLabel(l: SlideLayoutType): string {
  const m: Record<SlideLayoutType, string> = {
    title_only: 'Alleen titel',
    title_content: 'Titel + inhoud',
    two_column: 'Twee kolommen',
    image_text: 'Afbeelding + tekst',
    full_image: 'Volledige afbeelding',
    blank: 'Leeg',
  }
  return m[l]
}

function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2, 10)
}
</script>
