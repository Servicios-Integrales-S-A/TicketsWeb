<template>
  <div class="app-wrapper d-flex" style="height: 100vh; overflow: hidden;">

    <AppSidebar />

    <div class="app-main d-flex flex-column flex-grow-1 overflow-hidden">
      <AppNavbar />

      <main class="flex-grow-1 overflow-auto p-4 bg-light">
        <router-view />
      </main>
    </div>

    <template v-if="isAuthenticated">
      <ChatBotBubble @abrirFormulario="onAbrirFormulario" />

      <CrearTicketModal
        v-if="mostrarCrearTicket"
        :prefill="prefillTicket"
        @close="mostrarCrearTicket = false"
        @creado="mostrarCrearTicket = false"
      />
    </template>

    <LoginModal v-if="showLoginModal" />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import AppSidebar        from '@/components/layout/AppSidebar.vue'
import AppNavbar         from '@/components/layout/AppNavbar.vue'
import LoginModal        from '@/components/layout/LoginModal.vue'
import ChatBotBubble     from '@/components/ui/ChatBotBubble.vue'
import CrearTicketModal  from '@/components/tickets/CrearTicketModal.vue'

const store = useStore()

const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
const showLoginModal  = computed(() => store.getters['auth/showLoginModal'])

const mostrarCrearTicket = ref(false)
const prefillTicket      = ref({})

function onAbrirFormulario(datos) {
  prefillTicket.value      = datos
  mostrarCrearTicket.value = true
}
</script>
