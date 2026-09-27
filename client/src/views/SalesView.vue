<template>
  <DetailLayout>
    <div class="empty-state">
      <div class="empty-state-icon"><KIcon name="deals" :size="22" /></div>
      <h2 class="text-lg font-semibold text-ink-2">Sales komt eraan</h2>
      <p>
        Voor nu kun je via de zijbalk naar
        <router-link to="/sales/slides" class="text-pienter-600 font-medium hover:underline">Vrije slides</router-link>.
      </p>
    </div>
  </DetailLayout>
</template>

<script setup lang="ts">
import KIcon from '../components/ui/KIcon.vue'
import DetailLayout from '../components/DetailLayout.vue'
</script>
