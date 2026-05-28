<template>
  <div class="app-wrapper d-flex" style="height: 100vh; overflow: hidden;">

    <AppSidebar />

    <div class="app-main d-flex flex-column flex-grow-1 overflow-hidden">
      <AppNavbar />

      <main class="flex-grow-1 overflow-auto bg-light" style="padding: 1rem;">
        <router-view />
      </main>
    </div>

    <ChatBotBubble v-if="mostrarChatbot" />

    <LoginModal v-if="showLoginModal" />

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import AppSidebar    from '@/components/layout/AppSidebar.vue'
import AppNavbar     from '@/components/layout/AppNavbar.vue'
import LoginModal    from '@/components/layout/LoginModal.vue'
import ChatBotBubble from '@/components/ui/ChatBotBubble.vue'

const store = useStore()

const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
const showLoginModal  = computed(() => store.getters['auth/showLoginModal'])
const rol             = computed(() => store.getters['auth/rol'])

const mostrarChatbot = computed(() => !isAuthenticated.value || rol.value === 'cliente')
</script>
