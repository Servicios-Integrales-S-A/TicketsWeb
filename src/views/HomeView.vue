<template>
  <div class="dashboard" :class="esAdmin ? 'dashboard--admin' : 'dashboard--usuario'">
    <router-link
      v-for="card in tarjetas"
      :key="card.id"
      :to="card.to"
      class="dashboard-card"
      :style="{ '--bg': card.color, '--border': card.colorDark, '--hover': card.colorBright }"
    >
      <i :class="`bi ${card.icono}`" style="font-size: 3rem;"></i>
      <span class="fs-4 fw-semibold mt-3">{{ card.titulo }}</span>
      <small class="mt-1 opacity-75 text-center px-3">{{ card.descripcion }}</small>
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store   = useStore()
const esAdmin = computed(() => store.getters['auth/rol'] === 'admin')

const CARDS_BASE = [
  {
    id:          'ver-tickets',
    titulo:      'Ver Tickets',
    descripcion: 'Consulta y gestiona tus tickets',
    icono:       'bi-ticket-perforated',
    color:       '#0d6efd',
    colorDark:   '#0a58ca',
    colorBright: '#3d8bfd',
    to:          { name: 'tickets' },
  },
  {
    id:          'crear-ticket',
    titulo:      'Crear Ticket',
    descripcion: 'Abre una nueva solicitud de soporte',
    icono:       'bi-plus-circle',
    color:       '#198754',
    colorDark:   '#146c43',
    colorBright: '#28a745',
    to:          { name: 'tickets', query: { nuevo: '1' } },
  },
]

const CARDS_ADMIN = [
  ...CARDS_BASE,
  {
    id:          'usuarios',
    titulo:      'Usuarios',
    descripcion: 'Gestiona los usuarios del sistema',
    icono:       'bi-people',
    color:       '#fd7e14',
    colorDark:   '#ca6510',
    colorBright: '#ff9a3c',
    to:          { name: 'admin-usuarios' },
  },
  {
    id:          'categorias',
    titulo:      'Categorías',
    descripcion: 'Organiza los tipos de solicitud',
    icono:       'bi-tags',
    color:       '#6f42c1',
    colorDark:   '#59359a',
    colorBright: '#8c68cd',
    to:          { name: 'admin-categorias' },
  },
  {
    id:          'reglas',
    titulo:      'Reglas',
    descripcion: 'Configura la asignación automática',
    icono:       'bi-diagram-3',
    color:       '#dc3545',
    colorDark:   '#b02a37',
    colorBright: '#e04b5a',
    to:          { name: 'admin-reglas' },
  },
]

const tarjetas = computed(() => esAdmin.value ? CARDS_ADMIN : CARDS_BASE)
</script>

<style scoped>
.dashboard {
  display: grid;
  gap: 1rem;
  height: 100%;
  min-height: calc(100vh - 56px - 3rem);
}

.dashboard--usuario {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
}

.dashboard--admin {
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: 1fr 1fr;
}
.dashboard--admin .dashboard-card:nth-child(1),
.dashboard--admin .dashboard-card:nth-child(2) { grid-column: span 3; }
.dashboard--admin .dashboard-card:nth-child(3),
.dashboard--admin .dashboard-card:nth-child(4),
.dashboard--admin .dashboard-card:nth-child(5) { grid-column: span 2; }

.dashboard-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: white;
  background-color: var(--bg);
  border: 2px solid var(--border);
  border-radius: 16px;
  transition: background-color 0.18s, box-shadow 0.18s;
  cursor: pointer;
}

.dashboard-card:hover {
  background-color: var(--hover);
  color: white;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

.dashboard-card:focus-visible {
  background-color: var(--hover);
  color: white;
  outline: 3px solid white;
  outline-offset: -8px;
}
</style>
