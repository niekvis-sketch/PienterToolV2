<template>
  <DetailLayout>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Medewerkers</h1>
        <p class="text-gray-500 text-sm mt-1">Beheer alle Pienter-medewerkers</p>
      </div>
      <button class="btn-primary" @click="openCreate">Nieuwe medewerker</button>
    </div>

    <!-- Filter-balk -->
    <div class="flex items-center gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Zoek op naam of email..."
        class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pienter-500 focus:border-transparent"
      />
      <select
        v-model="teamFilter"
        class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pienter-500"
      >
        <option value="">Alle teams</option>
        <option v-for="t in teams" :key="t" :value="t">{{ teamLabel(t) }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="text-center py-16 text-gray-400">Laden...</div>

    <!-- Lege staat -->
    <div v-else-if="filtered.length === 0 && store.medewerkers.length === 0" class="text-center py-12">
      <div class="text-4xl mb-4">👥</div>
      <h2 class="text-lg font-semibold text-gray-700">Nog geen medewerkers</h2>
      <p class="text-gray-500 mt-1">Voeg een medewerker toe om te beginnen.</p>
      <div class="mt-6 flex justify-center">
        <button class="btn-primary" @click="openCreate">Nieuwe medewerker</button>
      </div>
    </div>

    <!-- Geen resultaten -->
    <div v-else-if="filtered.length === 0" class="text-center py-12 text-gray-500">
      Geen medewerkers gevonden met deze filters.
    </div>

    <!-- Tabel -->
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th class="text-left px-4 py-3 w-12"></th>
            <th class="text-left px-4 py-3">Naam</th>
            <th class="text-left px-4 py-3">Functie</th>
            <th class="text-left px-4 py-3">Team</th>
            <th class="text-left px-4 py-3">Email</th>
            <th class="text-right px-4 py-3">Acties</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="m in filtered"
            :key="m.id"
            class="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
            @click="openEdit(m)"
          >
            <td class="px-4 py-3">
              <MedewerkerAvatar :medewerker="m" size="md" />
            </td>
            <td class="px-4 py-3 font-medium text-gray-900">{{ m.naam || '—' }}</td>
            <td class="px-4 py-3 text-gray-700">{{ m.functie || '—' }}</td>
            <td class="px-4 py-3">
              <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="teamBadgeClass(m.team)">
                {{ teamLabel(m.team) }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-700">{{ m.email || '—' }}</td>
            <td class="px-4 py-3 text-right">
              <button
                class="text-xs text-red-600 hover:text-red-700"
                @click.stop="onDelete(m)"
              >
                Verwijderen
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: aanmaken / bewerken -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">
          {{ editingId ? 'Medewerker bewerken' : 'Nieuwe medewerker' }}
        </h2>

        <!-- Avatar-preview + upload (alleen bij bewerken — een id is nodig) -->
        <div v-if="editingId" class="flex items-center gap-4 mb-5">
          <MedewerkerAvatar :medewerkerId="editingId" size="lg" />
          <div>
            <label class="btn-secondary text-xs cursor-pointer">
              {{ uploading ? 'Uploaden...' : 'Avatar uploaden' }}
              <input
                type="file"
                accept="image/*"
                class="hidden"
                :disabled="uploading"
                @change="onAvatarChange"
              />
            </label>
            <p class="text-[11px] text-gray-400 mt-1">Max 5MB · jpg/png</p>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Naam</label>
            <input
              v-model="form.naam"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pienter-500"
              placeholder="Voor- en achternaam"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pienter-500"
              placeholder="naam@pienter.nl"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Functie</label>
            <input
              v-model="form.functie"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pienter-500"
              placeholder="SEO specialist, Account manager, ..."
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Team</label>
            <select
              v-model="form.team"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pienter-500"
            >
              <option v-for="t in teams" :key="t" :value="t">{{ teamLabel(t) }}</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button class="btn-secondary" :disabled="saving" @click="closeModal">Annuleren</button>
          <button class="btn-primary" :disabled="saving" @click="onSave">
            {{ saving ? 'Opslaan...' : 'Opslaan' }}
          </button>
        </div>
      </div>
    </div>
  </DetailLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
import { useMedewerkersStore } from '../stores/medewerkersStore'
import DetailLayout from '../components/DetailLayout.vue'
import MedewerkerAvatar from '../components/medewerkers/MedewerkerAvatar.vue'
import type { Medewerker, Team } from '@shared/types'

const store = useMedewerkersStore()

const search = ref('')
const teamFilter = ref<Team | ''>('')

const showModal = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const uploading = ref(false)

const form = reactive<{
  naam: string
  email: string
  functie: string
  team: Team
}>({
  naam: '',
  email: '',
  functie: '',
  team: 'overig',
})

const teams: Team[] = ['seo', 'content', 'advertising', 'website', 'overig']

const teamLabels: Record<Team, string> = {
  seo: 'SEO',
  content: 'Content',
  advertising: 'Advertising',
  website: 'Website',
  overig: 'Overig',
}

function teamLabel(t: Team): string {
  return teamLabels[t] ?? t
}

function teamBadgeClass(t: Team): string {
  return {
    seo: 'bg-blue-100 text-blue-700',
    content: 'bg-emerald-100 text-emerald-700',
    advertising: 'bg-orange-100 text-orange-700',
    website: 'bg-purple-100 text-purple-700',
    overig: 'bg-gray-100 text-gray-600',
  }[t] ?? 'bg-gray-100 text-gray-600'
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.medewerkers.filter(m => {
    if (teamFilter.value && m.team !== teamFilter.value) return false
    if (!q) return true
    return (
      m.naam.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.functie.toLowerCase().includes(q)
    )
  })
})

onMounted(() => {
  store.fetchMedewerkers()
})

function resetForm() {
  form.naam = ''
  form.email = ''
  form.functie = ''
  form.team = 'overig'
}

function openCreate() {
  editingId.value = null
  resetForm()
  showModal.value = true
}

function openEdit(m: Medewerker) {
  editingId.value = m.id
  form.naam = m.naam
  form.email = m.email
  form.functie = m.functie
  form.team = m.team
  showModal.value = true
}

function closeModal() {
  if (saving.value || uploading.value) return
  showModal.value = false
  editingId.value = null
}

async function onSave() {
  saving.value = true
  try {
    if (editingId.value) {
      await store.updateMedewerker(editingId.value, { ...form })
    } else {
      const m = await store.createMedewerker({ ...form })
      // Na aanmaken: laat modal open in bewerk-modus zodat avatar-upload kan
      editingId.value = m.id
    }
  } catch (e) {
    console.error(e)
    alert('Opslaan mislukt')
  } finally {
    saving.value = false
  }
}

async function onAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !editingId.value) return
  uploading.value = true
  try {
    await store.uploadAvatar(editingId.value, file)
  } catch (err) {
    console.error(err)
    alert('Upload mislukt')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function onDelete(m: Medewerker) {
  if (!confirm(`Medewerker "${m.naam || 'zonder naam'}" verwijderen?`)) return
  try {
    await store.deleteMedewerker(m.id)
  } catch (e) {
    console.error(e)
    alert('Verwijderen mislukt')
  }
}
</script>
