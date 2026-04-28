<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">Klantinformatie</h2>
      <button v-if="!editing" class="btn-secondary btn-sm" @click="startEdit">Bewerken</button>
      <div v-else class="flex gap-2">
        <button class="btn-primary btn-sm" @click="handleSave">Opslaan</button>
        <button class="btn-secondary btn-sm" @click="editing = false">Annuleren</button>
      </div>
    </div>

    <div class="card p-5">
      <h3 class="font-semibold text-gray-800 mb-4">Contactgegevens (primaire contactpersoon)</h3>

      <div v-if="!editing" class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <span class="text-gray-500">Contactpersoon</span>
          <p class="font-medium mt-0.5">{{ klant.contactpersoon || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">E-mailadres</span>
          <p class="font-medium mt-0.5">
            <a v-if="klant.email" :href="`mailto:${klant.email}`" class="text-pienter-600 hover:underline">{{ klant.email }}</a>
            <span v-else>–</span>
          </p>
        </div>
        <div>
          <span class="text-gray-500">Telefoonnummer</span>
          <p class="font-medium mt-0.5">{{ klant.telefoon || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Website</span>
          <p class="font-medium mt-0.5">
            <a v-if="klant.website" :href="websiteUrl(klant.website)" target="_blank" rel="noopener noreferrer" class="text-pienter-600 hover:underline">{{ klant.website }}</a>
            <span v-else>–</span>
          </p>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contactpersoon</label>
          <input v-model="form.contactpersoon" class="input" placeholder="Naam contactpersoon" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
          <input v-model="form.email" type="email" class="input" placeholder="info@bedrijf.nl" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Telefoonnummer</label>
          <input v-model="form.telefoon" class="input" placeholder="085-1234567" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input v-model="form.website" class="input" placeholder="www.bedrijf.nl" />
        </div>
      </div>
    </div>

    <KlantContactpersonenSection />

    <div class="card p-5">
      <h3 class="font-semibold text-gray-800 mb-4">Bedrijfsgegevens</h3>

      <div v-if="!editing" class="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <span class="text-gray-500">KvK-nummer</span>
          <p class="font-medium mt-0.5">{{ klant.kvkNummer || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Sector</span>
          <p class="font-medium mt-0.5">{{ klant.sector || '–' }}</p>
        </div>
        <div class="col-span-2">
          <span class="text-gray-500">Adres</span>
          <p class="font-medium mt-0.5">{{ [klant.adres, klant.stad].filter(Boolean).join(', ') || '–' }}</p>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">KvK-nummer</label>
          <input v-model="form.kvkNummer" class="input" placeholder="12345678" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sector</label>
          <input v-model="form.sector" class="input" placeholder="bijv. Installatietechniek" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Adres</label>
          <input v-model="form.adres" class="input" placeholder="Straat en huisnummer" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Stad</label>
          <input v-model="form.stad" class="input" placeholder="Amsterdam" />
        </div>
      </div>
    </div>

    <div class="card p-5">
      <h3 class="font-semibold text-gray-800 mb-4">Merk &amp; identiteit</h3>

      <div v-if="!editing" class="space-y-4 text-sm">
        <div>
          <span class="text-gray-500">Merkverhaal</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.merkverhaal || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Tone of voice</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.toneOfVoice || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Kernwaarden</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.kernwaarden || '–' }}</p>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Merkverhaal</label>
          <textarea v-model="form.merkverhaal" class="input min-h-[80px]" rows="3" placeholder="Wat is het verhaal van het merk? Waar staat het voor?" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tone of voice</label>
          <textarea v-model="form.toneOfVoice" class="input min-h-[60px]" rows="2" placeholder="bijv. Helder, eerlijk, met gevoel voor humor" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kernwaarden</label>
          <textarea v-model="form.kernwaarden" class="input min-h-[60px]" rows="3" placeholder="Eén kernwaarde per regel" />
        </div>
      </div>
    </div>

    <KlantHuisstijlSection />

    <KlantDoelgroepenSection />

    <div class="card p-5">
      <h3 class="font-semibold text-gray-800 mb-4">Markt &amp; positionering</h3>

      <div v-if="!editing" class="space-y-4 text-sm">
        <div>
          <span class="text-gray-500">Uitdagingen</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.uitdagingen || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Kansen</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.kansen || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Concurrenten</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.concurrenten || '–' }}</p>
        </div>
        <div>
          <span class="text-gray-500">Positionering</span>
          <p class="mt-1 whitespace-pre-wrap text-gray-800">{{ klant.positionering || '–' }}</p>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Uitdagingen</label>
          <textarea v-model="form.uitdagingen" class="input min-h-[80px]" rows="3" placeholder="Welke uitdagingen ervaart de klant?" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kansen</label>
          <textarea v-model="form.kansen" class="input min-h-[80px]" rows="3" placeholder="Welke kansen liggen er?" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Concurrenten</label>
          <textarea v-model="form.concurrenten" class="input min-h-[80px]" rows="3" placeholder="Wie zijn de concurrenten?" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Positionering</label>
          <textarea v-model="form.positionering" class="input min-h-[80px]" rows="3" placeholder="Hoe positioneert de klant zichzelf in de markt?" />
        </div>
      </div>
    </div>

    <CommunicatieHistorieTab />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'
import CommunicatieHistorieTab from './CommunicatieHistorieTab.vue'
import KlantContactpersonenSection from './KlantContactpersonenSection.vue'
import KlantHuisstijlSection from './KlantHuisstijlSection.vue'
import KlantDoelgroepenSection from './KlantDoelgroepenSection.vue'

const store = useKlantenStore()
const editing = ref(false)
const klant = computed(() => store.currentKlant!)

const form = reactive({
  contactpersoon: '', email: '', telefoon: '', website: '',
  kvkNummer: '', sector: '', adres: '', stad: '',
  merkverhaal: '', toneOfVoice: '', kernwaarden: '',
  uitdagingen: '', kansen: '', concurrenten: '', positionering: '',
})

function startEdit() {
  Object.assign(form, {
    contactpersoon: klant.value.contactpersoon,
    email: klant.value.email,
    telefoon: klant.value.telefoon,
    website: klant.value.website,
    kvkNummer: klant.value.kvkNummer,
    sector: klant.value.sector,
    adres: klant.value.adres,
    stad: klant.value.stad,
    merkverhaal: klant.value.merkverhaal,
    toneOfVoice: klant.value.toneOfVoice,
    kernwaarden: klant.value.kernwaarden,
    uitdagingen: klant.value.uitdagingen,
    kansen: klant.value.kansen,
    concurrenten: klant.value.concurrenten,
    positionering: klant.value.positionering,
  })
  editing.value = true
}

async function handleSave() {
  await store.updateKlant(klant.value.id, { ...form })
  editing.value = false
}

function websiteUrl(url: string): string {
  return url.startsWith('http') ? url : `https://${url}`
}
</script>
