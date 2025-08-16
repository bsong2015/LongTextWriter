<template>
  <div>
    <h1>Project Detail</h1>
    <p>Project: {{ projectName }}</p>
  </div>
</template>

<script setup lang="ts">
// This will receive the projectName as a prop from the router
defineProps<{ projectName: string }>();
</script>
