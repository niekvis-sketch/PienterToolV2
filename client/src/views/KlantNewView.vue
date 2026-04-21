<template>
  <div class="max-w-3xl mx-auto px-6 py-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Nieuwe klant aanmaken</h1>

    <form class="card p-6 space-y-5" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Bedrijfsnaam <span class="text-red-500">*</span></label>
        <input v-model="form.naam" class="input" placeholder="bijv. Cooling Service Holland B.V." required />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contactpersoon</label>
          <input v-model="form.contactpersoon" class="input" placeholder="bijv. Jan de Vries" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select v-model="form.status" class="select">
            <option value="prospect">Prospect</option>
            <option value="actief">Actief</option>
            <option value="inactief">Inactief</option>
            <option value="voormalig">Voormalig</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
          <input v-model="form.email" type="email" class="input" placeholder="bijv. info@bedrijf.nl" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Telefoonnummer</label>
          <input v-model="form.telefoon" class="input" placeholder="bijv. 085-1234567" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sector</label>
          <input v-model="form.sector" class="input" placeholder="bijv. Installatietechniek" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Stad</label>
          <input v-model="form.stad" class="input" placeholder="bijv. Amsterdam" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
        <input v-model="form.website" class="input" placeholder="bijv. www.bedrijf.nl" />
      </div>

      <div class="flex gap-3 pt-4">
        <button type="submit" class="btn-primary" :disabled="!form.naam">Aanmaken</button>
        <router-link to="/klanten" class="btn-secondary">Annuleren</router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useKlantenStore } from '../stores/klantenStore'
import type { KlantStatus } from '@shared/types'

const router = useRouter()
const store = useKlantenStore()

const form = reactive({
  naam: '',
  contactpersoon: '',
  status: 'prospect' as KlantStatus,
  email: '',
  telefoon: '',
  sector: '',
  stad: '',
  website: '',
})

async function handleSubmit() {
  const klant = await store.createKlant(form)
  router.push(`/klanten/${klant.id}`)
}
</script>
