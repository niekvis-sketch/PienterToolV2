<template>
  <DetailLayout>
    <div class="empty-state">
      <div class="text-4xl mb-4">💼</div>
      <h2 class="text-lg font-semibold text-ink-2">Sales komt eraan</h2>
      <p>
        Voor nu kun je via de zijbalk naar
        <router-link to="/sales/slides" class="text-pienter-700 font-medium hover:underline">Vrije slides</router-link>.
      </p>
    </div>
  </DetailLayout>
</template>

<script setup lang="ts">
import DetailLayout from '../components/DetailLayout.vue'
</script>
