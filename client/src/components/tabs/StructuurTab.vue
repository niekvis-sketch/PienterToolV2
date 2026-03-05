<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-1">Structuur & Content-inventarisatie</h2>
        <p class="text-sm text-gray-500">Importeer een sitestructuur en beheer de pagina-inventarisatie</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary btn-sm" @click="exportCsv" :disabled="store.pages.length === 0">Exporteer CSV</button>
      </div>
    </div>

    <!-- Import sectie -->
    <div class="card p-5 mb-6">
      <h3 class="font-semibold text-gray-900 mb-2">Structuur importeren (Miro-format JSON)</h3>
      <p class="text-sm text-gray-500 mb-3">Plak hieronder een JSON-structuur. Dit genereert automatisch pagina's, SEO-velden en standaardtaken.</p>
      <textarea
        v-model="importJson"
        class="textarea font-mono text-xs"
        rows="8"
        placeholder='{"root":[{"title":"Home","slug":"","children":[...]}]}'
      />
      <div class="flex items-center gap-3 mt-3">
        <button class="btn-primary btn-sm" @click="handleImport" :disabled="!importJson.trim()">Importeren</button>
        <button class="btn-tertiary btn-sm" @click="loadExample">Laad voorbeeld</button>
        <span v-if="importMessage" class="text-sm" :class="importError ? 'text-red-600' : 'text-green-600'">{{ importMessage }}</span>
      </div>
    </div>

    <!-- Pagina tabel -->
    <div v-if="store.pages.length === 0" class="empty-state card p-12">
      <div class="text-4xl mb-4">🗂️</div>
      <h3 class="text-lg font-semibold text-gray-700">Nog geen pagina's</h3>
      <p>Importeer een structuur hierboven om de content-inventarisatie te starten.</p>
    </div>

    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Pagina</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-16">Niv.</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">URL</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Meta title</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Meta desc.</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-24">Status</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Focus</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="page in sortedPages"
              :key="page.id"
              class="hover:bg-gray-50 cursor-pointer"
              @click="openEdit(page)"
            >
              <td class="px-4 py-2.5">
                <span :style="{ paddingLeft: page.level * 16 + 'px' }" class="flex items-center gap-1">
                  <span class="text-gray-400 text-xs">{{ page.level > 0 ? '└' : '' }}</span>
                  <span class="font-medium text-gray-900">{{ page.title }}</span>
                  <span v-if="page.type !== 'page'" class="text-[10px] text-gray-400">({{ page.type }})</span>
                </span>
              </td>
              <td class="px-4 py-2.5 text-gray-500">{{ page.level }}</td>
              <td class="px-4 py-2.5 text-gray-500 font-mono text-xs">{{ page.slug || '/' }}</td>
              <td class="px-4 py-2.5 text-xs text-pienter-600 max-w-[200px] truncate">{{ page.fullUrl }}</td>
              <td class="px-4 py-2.5 text-xs" :class="getSeo(page.id)?.metaTitle ? 'text-gray-700' : 'text-red-400'">
                {{ getSeo(page.id)?.metaTitle || '(leeg)' }}
              </td>
              <td class="px-4 py-2.5 text-xs max-w-[150px] truncate" :class="getSeo(page.id)?.metaDescription ? 'text-gray-700' : 'text-red-400'">
                {{ getSeo(page.id)?.metaDescription || '(leeg)' }}
              </td>
              <td class="px-4 py-2.5">
                <span :class="'badge badge-' + page.status" class="text-[10px]">{{ pageStatusLabel(page.status) }}</span>
              </td>
              <td class="px-4 py-2.5 text-xs text-gray-500">{{ getSeo(page.id)?.focusTopic || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="editPage" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="editPage = null">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h3 class="text-lg font-bold mb-4">{{ editPage.title }} bewerken</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Titel</label>
              <input v-model="editPage.title" class="input" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select v-model="editPage.status" class="select">
                <option value="draft">Concept</option>
                <option value="content-ready">Content klaar</option>
                <option value="design-ready">Design klaar</option>
                <option value="dev-ready">Dev klaar</option>
                <option value="staged">Op staging</option>
                <option value="live">Live</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Meta title</label>
            <input v-model="editSeo.metaTitle" class="input" />
            <div class="text-xs text-gray-400 mt-1">{{ (editSeo.metaTitle || '').length }}/60 tekens</div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Meta description</label>
            <textarea v-model="editSeo.metaDescription" class="textarea" rows="2" />
            <div class="text-xs text-gray-400 mt-1">{{ (editSeo.metaDescription || '').length }}/160 tekens</div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Focus onderwerp</label>
            <input v-model="editSeo.focusTopic" class="input" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Redirects van (oude URL's, één per regel)</label>
            <textarea v-model="redirectsText" class="textarea font-mono text-xs" rows="2" placeholder="bijv. coolingservice.nl/oud-pad" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Notities</label>
            <textarea v-model="editPage.notes" class="textarea" rows="2" />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button class="btn-primary" @click="saveEdit">Opslaan</button>
          <button class="btn-secondary" @click="editPage = null">Annuleren</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import type { Page, SEOFields, PageStatus } from '@shared/types'

const store = useProjectStore()
const importJson = ref('')
const importMessage = ref('')
const importError = ref(false)
const editPage = ref<Page | null>(null)
const editSeo = ref<Partial<SEOFields>>({})
const redirectsText = ref('')

const sortedPages = computed(() => {
  // Sorteer op hiërarchie: gebruik level + parent relatie
  const result: Page[] = []
  function addChildren(parentId: string | null) {
    const children = store.pages.filter(p => p.parentId === parentId)
    for (const child of children) {
      result.push(child)
      addChildren(child.id)
    }
  }
  addChildren(null)
  // Als er pagina's zijn die niet in de boom zitten, voeg ze toe
  for (const p of store.pages) {
    if (!result.find(r => r.id === p.id)) result.push(p)
  }
  return result
})

function getSeo(pageId: string): SEOFields | undefined {
  return store.seoFields.find(s => s.pageId === pageId)
}

function pageStatusLabel(s: PageStatus): string {
  const labels: Record<PageStatus, string> = {
    draft: 'Concept', 'content-ready': 'Content ✓', 'design-ready': 'Design ✓',
    'dev-ready': 'Dev ✓', staged: 'Staging', live: 'Live'
  }
  return labels[s] || s
}

async function handleImport() {
  importMessage.value = ''
  importError.value = false
  try {
    const data = JSON.parse(importJson.value)
    if (!data.root) throw new Error('JSON moet een "root" array bevatten.')
    const projectId = store.currentProject?.id
    if (!projectId) return
    const result = await store.importStructure(projectId, data)
    importMessage.value = `${result.pages.length} pagina's en ${result.tasks.length} taken aangemaakt.`
    importJson.value = ''
  } catch (e: any) {
    importError.value = true
    importMessage.value = `Fout: ${e.message}`
  }
}

function loadExample() {
  importJson.value = JSON.stringify({
    root: [{
      title: 'Home', slug: '', children: [
        { title: 'Oplossingen', slug: 'oplossingen', children: [
          { title: 'Food & Beverage', slug: 'food-beverage' },
          { title: 'Utiliteit', slug: 'utiliteit' },
          { title: 'Zorg', slug: 'zorg' },
        ]},
        { title: 'Projecten', slug: 'projecten', children: [
          { title: 'Project detail', slug: 'projecten/:slug', type: 'case' },
        ]},
        { title: 'Blog', slug: 'blog', children: [
          { title: 'Blog detail', slug: 'blog/:slug', type: 'post' },
        ]},
        { title: 'Over ons', slug: 'over-ons' },
        { title: 'Contact', slug: 'contact' },
      ]
    }]
  }, null, 2)
}

function openEdit(page: Page) {
  editPage.value = { ...page }
  const seo = getSeo(page.id)
  editSeo.value = seo ? { ...seo } : { pageId: page.id, metaTitle: '', metaDescription: '', focusTopic: '', redirectsFrom: [] }
  redirectsText.value = (editSeo.value.redirectsFrom || []).join('\n')
}

async function saveEdit() {
  if (!editPage.value || !store.currentProject) return
  editSeo.value.redirectsFrom = redirectsText.value.split('\n').map(s => s.trim()).filter(Boolean)
  await store.updatePage(store.currentProject.id, editPage.value.id, editPage.value)
  await store.updateSeoFields(store.currentProject.id, editPage.value.id, editSeo.value)
  editPage.value = null
}

function exportCsv() {
  const rows = [['Pagina', 'Niveau', 'Parent', 'Slug', 'URL', 'Meta title', 'Meta description', 'Status', 'Focus onderwerp', 'Redirects van']]
  for (const page of sortedPages.value) {
    const seo = getSeo(page.id)
    const parent = store.pages.find(p => p.id === page.parentId)
    rows.push([
      page.title,
      String(page.level),
      parent?.title || '',
      page.slug || '/',
      page.fullUrl,
      seo?.metaTitle || '',
      seo?.metaDescription || '',
      page.status,
      seo?.focusTopic || '',
      (seo?.redirectsFrom || []).join('; '),
    ])
  }
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `content-inventarisatie-${store.currentProject?.name || 'export'}.csv`
  link.click()
}
</script>
