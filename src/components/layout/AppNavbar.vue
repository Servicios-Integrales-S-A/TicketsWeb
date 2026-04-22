<template>
  <header class="app-navbar d-flex align-items-center justify-content-between px-4 bg-white border-bottom" style="height: 56px;">

    <h6 class="mb-0 fw-semibold text-dark">{{ paginaActual }}</h6>

    <div class="d-flex align-items-center gap-3">

      <div class="text-end lh-sm d-none d-md-block">
        <div class="fw-semibold" style="font-size: 0.85rem;">{{ nombreCompleto }}</div>
        <small class="text-muted text-capitalize">{{ rol }}</small>
      </div>

      <div class="dropdown">
        <button
          class="btn btn-light btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center"
          style="width: 36px; height: 36px;"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i class="bi bi-person-fill"></i>
        </button>

        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
          <li>
            <router-link :to="{ name: 'perfil' }" class="dropdown-item d-flex align-items-center gap-2">
              <i class="bi bi-person"></i> Mi perfil
            </router-link>
          </li>
          <li><hr class="dropdown-divider"></li>
          <li>
            <button class="dropdown-item d-flex align-items-center gap-2 text-danger" @click="cerrarSesion">
              <i class="bi bi-box-arrow-right"></i> Cerrar sesión
            </button>
          </li>
        </ul>
      </div>

    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

const store  = useStore()
const router = useRouter()
const route  = useRoute()

const rol           = computed(() => store.getters['auth/rol'])
const nombreCompleto = computed(() => store.getters['auth/nombreCompleto'])

const TITULOS = {
  'home':             'Inicio',
  'tickets':          'Tickets',
  'tickets-detalle':  'Tickets',
  'perfil':           'Mi Perfil',
  'admin-usuarios':   'Usuarios',
  'admin-categorias': 'Categorías',
  'admin-reglas':     'Reglas de Asignación',
}

const paginaActual = computed(() => TITULOS[route.name] || 'Sistema de Tickets')

const cerrarSesion = async () => {
  await store.dispatch('auth/logout')
  router.push({ name: 'login' })
}
</script>
