<template>
  <aside class="app-sidebar d-flex flex-column bg-dark text-white" style="width: 240px; height: 100vh; flex-shrink: 0;">

    <!-- Logo -->
    <div class="px-3 py-4 border-bottom border-secondary">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-ticket-perforated-fill text-primary fs-4"></i>
        <span class="fw-semibold lh-sm" style="font-size: 0.85rem;">
          Servicios Integrales<br>
          <small class="fw-normal">Sistema de Tickets</small>
        </span>
      </div>
    </div>

    <!-- Navegación -->
    <nav class="flex-grow-1 py-3 overflow-y-auto">

      <div class="px-3 mb-1">
        <small class="text-uppercase" style="font-size: 0.7rem; letter-spacing: 0.08em;">
          General
        </small>
      </div>

      <router-link :to="{ name: 'home' }" class="sidebar-link d-flex align-items-center gap-2 px-3 py-2 text-decoration-none">
        <i class="bi bi-house fs-5"></i>
        <span>Inicio</span>
      </router-link>

      <router-link :to="{ name: 'tickets' }" class="sidebar-link d-flex align-items-center gap-2 px-3 py-2 text-decoration-none">
        <i class="bi bi-ticket-perforated fs-5"></i>
        <span>Tickets</span>
      </router-link>

      <template v-if="rol === 'admin'">
        <div class="px-3 mt-3 mb-1">
          <small class="text-uppercase" style="font-size: 0.7rem; letter-spacing: 0.08em;">
            Administración
          </small>
        </div>

        <router-link :to="{ name: 'admin-usuarios' }" class="sidebar-link d-flex align-items-center gap-2 px-3 py-2 text-decoration-none">
          <i class="bi bi-people fs-5"></i>
          <span>Usuarios</span>
        </router-link>

        <router-link :to="{ name: 'admin-categorias' }" class="sidebar-link d-flex align-items-center gap-2 px-3 py-2 text-decoration-none">
          <i class="bi bi-tags fs-5"></i>
          <span>Categorías</span>
        </router-link>

        <router-link :to="{ name: 'admin-reglas' }" class="sidebar-link d-flex align-items-center gap-2 px-3 py-2 text-decoration-none">
          <i class="bi bi-diagram-3 fs-5"></i>
          <span>Reglas</span>
        </router-link>
      </template>

    </nav>

    <!-- Perfil al fondo -->
    <div class="border-top border-secondary">
      <router-link :to="{ name: 'perfil' }" class="sidebar-link d-flex align-items-center gap-2 px-3 py-3 text-decoration-none">
        <i class="bi bi-person-circle fs-5"></i>
        <div class="lh-sm overflow-hidden">
          <div class="text-truncate" style="font-size: 0.85rem;">{{ nombreCompleto }}</div>
          <small class="text-capitalize">{{ rol }}</small>
        </div>
      </router-link>
    </div>

  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store        = useStore()
const rol          = computed(() => store.getters['auth/rol'])
const nombreCompleto = computed(() => store.getters['auth/nombreCompleto'])
</script>

<style scoped>
.sidebar-link {
  color: #adb5bd;
  transition: background 0.15s, color 0.15s;
}
.sidebar-link:hover,
.sidebar-link.router-link-active {
  background: rgba(255, 255, 255, 0.07);
  color: #ffffff;
}
.sidebar-link.router-link-active {
  border-left: 3px solid #0d6efd;
  padding-left: calc(1rem - 3px);
}
</style>
