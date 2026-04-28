<template>
  <DetailLayout narrow>
    <h1 class="text-xl font-bold text-gray-900 mb-6">Nieuw project aanmaken</h1>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Projectnaam</label>
        <input v-model="form.name" class="input" placeholder="bijv. Cooling Service Holland" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Klantnaam</label>
        <input v-model="form.clientName" class="input" placeholder="bijv. Cooling Service Holland B.V." />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Huidig domein</label>
          <input v-model="form.domainCurrent" class="input" placeholder="bijv. coolingservice.nl" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nieuw domein</label>
          <input v-model="form.domainNew" class="input" placeholder="bijv. csh-nieuw.nl" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Talen</label>
          <select v-model="form.languages" class="select" multiple>
            <option value="nl">Nederlands</option>
            <option value="en">Engels</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Go-live datum (optioneel)</label>
          <input v-model="form.goLiveDate" type="date" class="input" />
        </div>
      </div>

      <div class="flex gap-3 pt-4">
        <button type="submit" class="btn-primary" :disabled="!form.name">Aanmaken</button>
        <router-link :to="cancelTo" class="btn-secondary">Annuleren</router-link>
      </div>
    </form>
  </DetailLayout>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { useKlantenStore } from '../stores/klantenStore'
import DetailLayout from '../components/DetailLayout.vue'

const route = useRoute()
const router = useRouter()
const store = useProjectStore()
const klantenStore = useKlantenStore()

const form = reactive({
  name: '',
  clientName: '',
  domainCurrent: '',
  domainNew: '',
  languages: ['nl'] as string[],
  goLiveDate: '',
})

onMounted(async () => {
  const qClient = route.query.clientName
  if (typeof qClient === 'string') form.clientName = qClient
  if (klantenStore.klanten.length === 0) {
    try { await klantenStore.fetchKlanten() } catch {}
  }
})

const cancelTo = computed(() => {
  const klant = klantenStore.klanten.find(k => k.naam === form.clientName)
  return klant ? `/klanten/${klant.id}/website` : '/klanten'
})

async function handleSubmit() {
  const project = await store.createProject({
    ...form,
    languages: form.languages as ('nl' | 'en')[],
    goLiveDate: form.goLiveDate || null,
  })
  if (klantenStore.klanten.length === 0) {
    try { await klantenStore.fetchKlanten() } catch {}
  }
  const klant = klantenStore.klanten.find(k => k.naam === project.clientName)
  if (klant) {
    router.push(`/klanten/${klant.id}/website`)
  } else {
    router.push('/klanten')
  }
}
</script>
