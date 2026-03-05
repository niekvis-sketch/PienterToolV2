<template>
  <div class="max-w-3xl mx-auto px-6 py-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Nieuw project aanmaken</h1>

    <form class="card p-6 space-y-5" @submit.prevent="handleSubmit">
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
        <router-link to="/" class="btn-secondary">Annuleren</router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'

const router = useRouter()
const store = useProjectStore()

const form = reactive({
  name: '',
  clientName: '',
  domainCurrent: '',
  domainNew: '',
  languages: ['nl'] as string[],
  goLiveDate: '',
})

async function handleSubmit() {
  const project = await store.createProject({
    ...form,
    languages: form.languages as ('nl' | 'en')[],
    goLiveDate: form.goLiveDate || null,
  })
  router.push(`/projects/${project.id}`)
}
</script>
