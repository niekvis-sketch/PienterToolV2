<template>
  <DetailLayout>
    <div class="text-center py-12">
      <div class="text-4xl mb-4">💼</div>
      <h2 class="text-lg font-semibold text-gray-700">Sales komt eraan</h2>
      <p class="text-gray-500 mt-1">
        Voor nu kun je via de zijbalk naar
        <router-link to="/sales/slides" class="text-pienter-700 hover:underline">Vrije slides</router-link>.
      </p>
    </div>
  </DetailLayout>
</template>

<script setup lang="ts">
import DetailLayout from '../components/DetailLayout.vue'
</script>
