<template>
  <div class="flex flex-col h-full px-12 py-8">
    <div class="mb-8">
      <h2 class="text-3xl font-bold" :class="textClass">🗺️ Klantreis</h2>
      <p class="text-sm mt-1" :class="subtextClass">Het See-Think-Do-Care model helpt om de website af te stemmen op elke fase van de klantreis</p>
    </div>
    <div class="flex-1 grid grid-cols-4 gap-4">
      <!-- SEE -->
      <div class="rounded-2xl p-6 flex flex-col bg-orange-50 border-2 border-orange-200">
        <div class="text-center mb-4">
          <div class="w-14 h-14 rounded-full bg-orange-200 flex items-center justify-center mx-auto mb-3">
            <span class="text-2xl">👀</span>
          </div>
          <h3 class="font-bold text-orange-800 text-lg">SEE</h3>
          <p class="text-xs text-orange-600 mt-1">Bewustwording</p>
        </div>
        <div class="flex-1 text-sm text-orange-700 space-y-2">
          <p>De bezoeker kent het bedrijf nog niet en oriënteert zich breed.</p>
          <div class="mt-3 pt-3 border-t border-orange-200">
            <p class="text-xs font-semibold text-orange-800 mb-1">Typische vragen:</p>
            <ul class="text-xs space-y-1 list-disc list-inside text-orange-600">
              <li>Wat doet dit bedrijf?</li>
              <li>Is dit relevant voor mij?</li>
              <li>Welke diensten zijn er?</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- THINK -->
      <div class="rounded-2xl p-6 flex flex-col bg-yellow-50 border-2 border-yellow-200">
        <div class="text-center mb-4">
          <div class="w-14 h-14 rounded-full bg-yellow-200 flex items-center justify-center mx-auto mb-3">
            <span class="text-2xl">🤔</span>
          </div>
          <h3 class="font-bold text-yellow-800 text-lg">THINK</h3>
          <p class="text-xs text-yellow-600 mt-1">Overweging</p>
        </div>
        <div class="flex-1 text-sm text-yellow-700 space-y-2">
          <p>De bezoeker vergelijkt opties en zoekt bevestiging.</p>
          <div class="mt-3 pt-3 border-t border-yellow-200">
            <p class="text-xs font-semibold text-yellow-800 mb-1">Typische vragen:</p>
            <ul class="text-xs space-y-1 list-disc list-inside text-yellow-600">
              <li>Waarom deze partij kiezen?</li>
              <li>Wat zijn de voordelen?</li>
              <li>Wie werken er al mee samen?</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- DO -->
      <div class="rounded-2xl p-6 flex flex-col bg-green-50 border-2 border-green-200">
        <div class="text-center mb-4">
          <div class="w-14 h-14 rounded-full bg-green-200 flex items-center justify-center mx-auto mb-3">
            <span class="text-2xl">🚀</span>
          </div>
          <h3 class="font-bold text-green-800 text-lg">DO</h3>
          <p class="text-xs text-green-600 mt-1">Actie</p>
        </div>
        <div class="flex-1 text-sm text-green-700 space-y-2">
          <p>De bezoeker is klaar om actie te ondernemen en contact op te nemen.</p>
          <div class="mt-3 pt-3 border-t border-green-200">
            <p class="text-xs font-semibold text-green-800 mb-1">Typische vragen:</p>
            <ul class="text-xs space-y-1 list-disc list-inside text-green-600">
              <li>Hoe neem ik contact op?</li>
              <li>Wat kost het?</li>
              <li>Hoe werkt het proces?</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- CARE -->
      <div class="rounded-2xl p-6 flex flex-col bg-cyan-50 border-2 border-cyan-200">
        <div class="text-center mb-4">
          <div class="w-14 h-14 rounded-full bg-cyan-200 flex items-center justify-center mx-auto mb-3">
            <span class="text-2xl">💙</span>
          </div>
          <h3 class="font-bold text-cyan-800 text-lg">CARE</h3>
          <p class="text-xs text-cyan-600 mt-1">Relatie</p>
        </div>
        <div class="flex-1 text-sm text-cyan-700 space-y-2">
          <p>De klant is al klant en wil geholpen worden of terugkomen.</p>
          <div class="mt-3 pt-3 border-t border-cyan-200">
            <p class="text-xs font-semibold text-cyan-800 mb-1">Typische vragen:</p>
            <ul class="text-xs space-y-1 list-disc list-inside text-cyan-600">
              <li>Waar vind ik support?</li>
              <li>Zijn er updates?</li>
              <li>Hoe blijf ik op de hoogte?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  textClass: string
  subtextClass: string
}>()
</script>
