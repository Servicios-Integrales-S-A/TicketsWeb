<template>
  <div class="app-wrapper d-flex" style="height: 100vh; overflow: hidden;">

    <AppSidebar />

    <div class="app-main d-flex flex-column flex-grow-1 overflow-hidden">
      <AppNavbar />

      <main class="flex-grow-1 overflow-auto p-4 bg-light">
        <router-view />
      </main>
    </div>

  </div>
</template>

<script setup>
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppNavbar  from '@/components/layout/AppNavbar.vue'
</script>
