<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-1">Componenten</h2>
        <p class="text-sm text-gray-500">ACF componenten met beschrijving en visuele referentie – beschikbaar voor ChatGPT</p>
      </div>
      <div class="flex gap-2">
        <button v-if="store.componenten.length === 0" class="btn-secondary btn-sm" @click="seedDefaults">
          🌱 Standaard componenten laden
        </button>
        <button class="btn-primary btn-sm" @click="showCreate = true">+ Component toevoegen</button>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="activeCategory === cat.key
          ? 'bg-pienter-600 text-white'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
        @click="activeCategory = cat.key"
      >
        {{ cat.icon }} {{ cat.label }}
        <span class="ml-1 text-xs opacity-70">({{ countByCategory(cat.key) }})</span>
      </button>
    </div>

    <!-- Lege staat -->
    <div v-if="store.componenten.length === 0" class="empty-state card p-12">
      <div class="text-4xl mb-4">🧩</div>
      <h3 class="text-lg font-semibold text-gray-700">Nog geen componenten</h3>
      <p>Klik op "Standaard componenten laden" om de ACF blokken te initialiseren.</p>
    </div>

    <!-- Component grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="comp in filteredComponents"
        :key="comp.id"
        class="card p-4 hover:shadow-md transition-shadow cursor-pointer"
        @click="openDetail(comp)"
      >
        <!-- Afbeelding -->
        <div class="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-3 overflow-hidden relative group">
          <img
            v-if="comp.imagePath"
            :src="`/api/${comp.imagePath}`"
            :alt="comp.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="text-center">
            <div class="text-3xl mb-1">{{ categoryIcon(comp.category) }}</div>
            <div class="text-xs text-gray-400">Geen afbeelding</div>
          </div>
          <!-- Hover overlay -->
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span class="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs bg-black/50 px-3 py-1 rounded-full">
              Bekijk details
            </span>
          </div>
        </div>

        <!-- Info -->
        <div class="space-y-2">
          <div class="flex items-start justify-between">
            <h3 class="text-sm font-semibold text-gray-900 leading-tight">{{ comp.name }}</h3>
            <span
              class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2"
              :class="categoryBadgeClass(comp.category)"
            >
              {{ categoryLabel(comp.category) }}
            </span>
          </div>
          <p class="text-xs text-gray-500 line-clamp-2">
            {{ comp.description || 'Geen beschrijving' }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <span v-if="comp.imagePath" class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✓ Afbeelding</span>
            <span v-else class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Geen afbeelding</span>
            <span v-if="comp.description" class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✓ Beschrijving</span>
            <span v-if="comp.subComponents?.length" class="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{{ comp.subComponents.length }} sub</span>
            <span v-if="variantCount(comp)" class="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">{{ variantCount(comp) }} varianten</span>
            <span v-if="comp.helpers?.length" class="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{{ comp.helpers.length }} helpers</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail/edit modal -->
    <div v-if="editingComponent" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="closeDetail">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-gray-900">{{ editingComponent.name }}</h3>
          <div class="flex gap-2">
            <button class="text-red-500 hover:text-red-700 text-sm" @click="handleDelete">🗑️ Verwijderen</button>
            <button class="text-gray-400 hover:text-gray-600" @click="closeDetail">✕</button>
          </div>
        </div>

        <div class="space-y-5">
          <!-- Naam -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Naam</label>
            <input
              v-model="editForm.name"
              class="input"
              placeholder="Component naam"
              @blur="saveField('name')"
            />
          </div>

          <!-- Categorie -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Categorie (ACF type)</label>
            <select v-model="editForm.category" class="select" @change="saveField('category')">
              <option value="broodblok">🍞 Broodblok</option>
              <option value="flexblok">🔧 Flexibele Content</option>
              <option value="posttype">📋 Posttype</option>
            </select>
          </div>

          <!-- Beschrijving -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Beschrijving</label>
            <textarea
              v-model="editForm.description"
              class="input min-h-[100px]"
              placeholder="Beschrijf het component, de visuele uitstraling, wanneer het gebruikt wordt en welke content erin past..."
              @blur="saveField('description')"
            ></textarea>
            <p class="text-[10px] text-gray-400 mt-1">Deze beschrijving wordt door ChatGPT gebruikt om het juiste component te kiezen.</p>
          </div>

          <!-- Structuur uit Figma-export (read-only) -->
          <div v-if="hasStructure(editingComponent)" class="border-t border-gray-100 pt-4 space-y-4">
            <!-- Component-niveau varianten -->
            <div v-if="editingComponent.variants?.length">
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Varianten</label>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="vr in editingComponent.variants" :key="vr.property"
                  class="text-[11px] bg-sky-50 text-sky-700 border border-sky-200 rounded px-2 py-0.5">
                  <span class="font-medium">{{ vr.property }}</span> = {{ vr.values.join(' | ') }}
                </span>
              </div>
            </div>

            <!-- Sub-componenten / views -->
            <div v-if="editingComponent.subComponents?.length">
              <label class="block text-xs font-medium text-gray-600 mb-1.5">
                {{ editingComponent.category === 'posttype' ? 'Views' : 'Sub-componenten' }}
              </label>
              <div class="space-y-1.5">
                <div v-for="sc in editingComponent.subComponents" :key="sc.name"
                  class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <div class="flex items-baseline gap-2 flex-wrap">
                    <span class="text-sm font-semibold text-gray-800">{{ sc.name }}</span>
                    <span v-if="sc.description" class="text-xs text-gray-500">{{ sc.description }}</span>
                  </div>
                  <div v-if="sc.variants?.length" class="flex flex-wrap gap-1.5 mt-1.5">
                    <span v-for="vr in sc.variants" :key="vr.property"
                      class="text-[10px] bg-white text-sky-700 border border-sky-200 rounded px-1.5 py-0.5">
                      <span class="font-medium">{{ vr.property }}</span> = {{ vr.values.join(' | ') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Helpers -->
            <div v-if="editingComponent.helpers?.length">
              <label class="block text-xs font-medium text-gray-600 mb-1.5">Hulp-componenten</label>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="h in editingComponent.helpers" :key="h"
                  class="text-[11px] bg-gray-100 text-gray-600 rounded px-2 py-0.5">{{ h }}</span>
              </div>
            </div>
          </div>

          <!-- Afbeelding upload -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Visuele referentie (afbeelding)</label>
            <div v-if="editingComponent.imagePath" class="mb-3">
              <div class="relative inline-block">
                <img
                  :src="`/api/${editingComponent.imagePath}`"
                  :alt="editingComponent.name"
                  class="max-h-64 rounded-lg border border-gray-200"
                />
                <button
                  class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  @click="removeImage"
                  title="Afbeelding verwijderen"
                >✕</button>
              </div>
            </div>
            <div
              class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pienter-400 transition-colors cursor-pointer"
              @click="triggerFileInput"
              @drop.prevent="handleDrop"
              @dragover.prevent
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                class="hidden"
                @change="handleFileSelect"
              />
              <div class="text-2xl mb-2">📷</div>
              <p class="text-sm text-gray-600">Klik om een afbeelding te uploaden of sleep het hierheen</p>
              <p class="text-xs text-gray-400 mt-1">PNG, JPG, WebP of GIF (max 5MB)</p>
            </div>
            <div v-if="uploading" class="mt-2 text-sm text-pienter-600">⏳ Uploading...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create modal -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="showCreate = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 class="text-lg font-bold mb-4">Nieuw component toevoegen</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Naam</label>
            <input v-model="newComponent.name" class="input" placeholder="Bijv. Flexblok-Nieuw-Type" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Categorie</label>
            <select v-model="newComponent.category" class="select">
              <option value="broodblok">🍞 Broodblok</option>
              <option value="flexblok">🔧 Flexibele Content</option>
              <option value="posttype">📋 Posttype</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Beschrijving (optioneel)</label>
            <textarea v-model="newComponent.description" class="input min-h-[80px]" placeholder="Korte beschrijving..."></textarea>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button class="btn-secondary btn-sm" @click="showCreate = false">Annuleren</button>
            <button class="btn-primary btn-sm" @click="handleCreate" :disabled="!newComponent.name.trim()">Toevoegen</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import type { ComponentBlock, ComponentCategory } from '@shared/types'

const store = useProjectStore()
const projectId = computed(() => store.currentProject?.id || '')

// Filter
const activeCategory = ref<ComponentCategory | 'all'>('all')
const categories = [
  { key: 'all' as const, label: 'Alles', icon: '🧩' },
  { key: 'broodblok' as const, label: 'Broodblokken', icon: '🍞' },
  { key: 'flexblok' as const, label: 'Flexibele Content', icon: '🔧' },
  { key: 'posttype' as const, label: 'Posttypes', icon: '📋' },
]

const filteredComponents = computed(() => {
  if (activeCategory.value === 'all') return store.componenten
  return store.componenten.filter(c => c.category === activeCategory.value)
})

function countByCategory(cat: string): number {
  if (cat === 'all') return store.componenten.length
  return store.componenten.filter(c => c.category === cat).length
}

function categoryIcon(cat: ComponentCategory): string {
  return cat === 'broodblok' ? '🍞' : cat === 'flexblok' ? '🔧' : '📋'
}

function categoryLabel(cat: ComponentCategory): string {
  return cat === 'broodblok' ? 'Broodblok' : cat === 'flexblok' ? 'Flexblok' : 'Posttype'
}

// Telt alle variant-assen op component- én sub-component-niveau
function variantCount(comp: ComponentBlock): number {
  const top = comp.variants?.length || 0
  const subs = (comp.subComponents || []).reduce((n, sc) => n + (sc.variants?.length || 0), 0)
  return top + subs
}

function hasStructure(comp: ComponentBlock): boolean {
  return !!(comp.variants?.length || comp.subComponents?.length || comp.helpers?.length)
}

function categoryBadgeClass(cat: ComponentCategory): string {
  return cat === 'broodblok'
    ? 'bg-amber-100 text-amber-700'
    : cat === 'flexblok'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-purple-100 text-purple-700'
}

// Seed defaults
async function seedDefaults() {
  if (!projectId.value) return
  await store.seedComponenten(projectId.value)
}

// Create
const showCreate = ref(false)
const newComponent = ref({ name: '', category: 'flexblok' as ComponentCategory, description: '' })

async function handleCreate() {
  if (!projectId.value || !newComponent.value.name.trim()) return
  await store.createComponent(projectId.value, newComponent.value)
  newComponent.value = { name: '', category: 'flexblok', description: '' }
  showCreate.value = false
}

// Detail / Edit
const editingComponent = ref<ComponentBlock | null>(null)
const editForm = ref({ name: '', category: 'flexblok' as ComponentCategory, description: '' })
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

function openDetail(comp: ComponentBlock) {
  editingComponent.value = comp
  editForm.value = {
    name: comp.name,
    category: comp.category,
    description: comp.description,
  }
}

function closeDetail() {
  editingComponent.value = null
}

async function saveField(field: string) {
  if (!editingComponent.value || !projectId.value) return
  const data: Record<string, unknown> = { [field]: (editForm.value as Record<string, unknown>)[field] }
  const updated = await store.updateComponent(projectId.value, editingComponent.value.id, data as Partial<ComponentBlock>)
  editingComponent.value = updated
}

async function handleDelete() {
  if (!editingComponent.value || !projectId.value) return
  if (!confirm(`Weet je zeker dat je "${editingComponent.value.name}" wilt verwijderen?`)) return
  await store.deleteComponent(projectId.value, editingComponent.value.id)
  editingComponent.value = null
}

// Image upload
function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await uploadImage(file)
}

async function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) await uploadImage(file)
}

async function uploadImage(file: File) {
  if (!editingComponent.value || !projectId.value) return
  uploading.value = true
  try {
    const updated = await store.uploadComponentImage(projectId.value, editingComponent.value.id, file)
    editingComponent.value = updated
  } catch (e) {
    alert('Upload mislukt')
  } finally {
    uploading.value = false
  }
}

async function removeImage() {
  if (!editingComponent.value || !projectId.value) return
  const updated = await store.deleteComponentImage(projectId.value, editingComponent.value.id)
  editingComponent.value = updated
}

// Init: laad componenten bij mount
import { onMounted } from 'vue'
onMounted(async () => {
  if (projectId.value) {
    await store.fetchComponenten(projectId.value)
  }
})
</script>
