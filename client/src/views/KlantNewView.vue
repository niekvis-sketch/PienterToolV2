<template>
  <DetailLayout narrow>
    <div class="mb-6">
      <p class="eyebrow">Nieuw</p>
      <h1 class="text-2xl font-bold tracking-tight text-pienter-700 mt-1 flex items-baseline gap-2">
        Nieuwe klant<span class="accent-dot"></span>
      </h1>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-sm font-medium text-ink-2 mb-1.5">Bedrijfsnaam <span style="color: var(--danger);">*</span></label>
        <input v-model="form.naam" class="input" placeholder="bijv. Cooling Service Holland B.V." required />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-ink-2 mb-1.5">Contactpersoon</label>
          <input v-model="form.contactpersoon" class="input" placeholder="bijv. Jan de Vries" />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-2 mb-1.5">Status</label>
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
          <label class="block text-sm font-medium text-ink-2 mb-1.5">E-mailadres</label>
          <input v-model="form.email" type="email" class="input" placeholder="bijv. info@bedrijf.nl" />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-2 mb-1.5">Telefoonnummer</label>
          <input v-model="form.telefoon" class="input" placeholder="bijv. 085-1234567" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-ink-2 mb-1.5">Sector</label>
          <input v-model="form.sector" class="input" placeholder="bijv. Installatietechniek" />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-2 mb-1.5">Stad</label>
          <input v-model="form.stad" class="input" placeholder="bijv. Amsterdam" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-ink-2 mb-1.5">Website</label>
        <input v-model="form.website" class="input" placeholder="bijv. www.bedrijf.nl" />
      </div>

      <hr class="divider-dotted my-6" />

      <div class="flex gap-3 pt-1">
        <button type="submit" class="btn btn-primary" :disabled="!form.naam">Aanmaken</button>
        <router-link to="/klanten" class="btn btn-secondary">Annuleren</router-link>
      </div>
    </form>
  </DetailLayout>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useKlantenStore } from '../stores/klantenStore'
import DetailLayout from '../components/DetailLayout.vue'
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
