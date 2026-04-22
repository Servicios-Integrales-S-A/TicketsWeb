<template>
  <div class="d-flex flex-column" style="height: 100%;">

    <!-- Barra superior -->
    <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap flex-shrink-0">

      <div class="d-flex gap-2 flex-wrap align-items-center">
        <div class="input-group" style="width: 220px;">
          <span class="input-group-text bg-white border-end-0">
            <i class="bi bi-search text-muted" style="font-size: 0.85rem;"></i>
          </span>
          <input
            type="text"
            class="form-control border-start-0 ps-0"
            placeholder="Buscar por título..."
            v-model="filtros.busqueda"
          />
        </div>

        <select class="form-select" v-model="filtros.estado" @change="cargarTickets" style="width: 160px;">
          <option value="">Todos los estados</option>
          <option value="abierto">Abierto</option>
          <option value="en_progreso">En progreso</option>
          <option value="resuelto">Resuelto</option>
          <option value="cerrado">Cerrado</option>
        </select>

        <select v-if="!esCliente" class="form-select" v-model="filtros.prioridad" @change="cargarTickets" style="width: 170px;">
          <option value="">Todas las prioridades</option>
          <option value="bajo">Bajo</option>
          <option value="medio">Medio</option>
          <option value="alto">Alto</option>
          <option value="critico">Crítico</option>
        </select>
      </div>

      <div class="d-flex align-items-center gap-2">
        <div class="btn-toolbar" role="toolbar">
          <div class="btn-group me-2">
            <button
                class="btn btn-sm"
                :class="vista === 'lista' ? 'btn-secondary' : 'btn-outline-secondary'"
                @click="vista = 'lista'"
                title="Vista lista"
            >
              <i class="bi bi-list-ul"></i>
            </button>
          </div>
            <div class="btn-group me-2">
            <button
                class="btn btn-sm"
                :class="vista === 'board' ? 'btn-secondary' : 'btn-outline-secondary'"
                @click="vista = 'board'"
                title="Vista tablero"
            >
              <i class="bi bi-kanban"></i>
            </button>
          </div>
        </div>

        <button class="btn btn-primary" @click="mostrarCrear = true">
          <i class="bi bi-plus-lg me-1"></i> Nuevo ticket
        </button>
      </div>
    </div>

    <!-- Vista lista -->
    <AppTable
      v-if="vista === 'lista'"
      :columns="columnas"
      :rows="ticketsFiltrados"
      :loading="cargando"
      empty-text="No hay tickets para mostrar."
      clickable
      @row-click="row => irDetalle(row.id)"
    >
      <template #col-titulo="{ row }">
        <div class="fw-medium">{{ row.titulo }}</div>
        <small class="text-muted">{{ row.numero_legible }}</small>
      </template>

      <template #col-estado="{ row }">
        <ColorBadgeSelect
          v-if="!esCliente"
          :model-value="row.estado"
          :options="ESTADO_OPTIONS"
          @update:model-value="val => actualizar(row.id, { estado: val })"
        />
        <span v-else :class="['badge', badgeEstado(row.estado)]">{{ labelEstado(row.estado) }}</span>
      </template>

      <template #col-prioridad="{ row }">
        <ColorBadgeSelect
          v-if="!esCliente"
          :model-value="row.prioridad"
          :options="PRIOR_OPTIONS"
          @update:model-value="val => actualizar(row.id, { prioridad: val })"
        />
        <span v-else :class="['badge', badgePrioridad(row.prioridad)]">{{ labelPrioridad(row.prioridad) }}</span>
      </template>

      <template #col-categoria="{ row }">
        <div @click.stop>
          <select
            v-if="!esCliente"
            class="inline-select"
            :value="row.id_categoria"
            @change="actualizar(row.id, { id_categoria: $event.target.value })"
          >
            <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
          </select>
          <span v-else class="text-muted">{{ row.categoria }}</span>
        </div>
      </template>

      <template #col-agente="{ row }">
        <div @click.stop>
          <select
            v-if="!esCliente"
            class="inline-select"
            :value="row.id_agente ?? ''"
            @change="actualizar(row.id, { id_agente: $event.target.value })"
          >
            <option value="" disabled>Sin asignar</option>
            <option v-for="ag in agentes" :key="ag.id" :value="ag.id">
              {{ ag.nombre }} {{ ag.apellido }}
            </option>
          </select>
          <span v-else class="text-muted">{{ row.agente }}</span>
        </div>
      </template>

      <template #col-creado_en="{ value }">
        <span style="font-size: 0.85rem; white-space: nowrap;">{{ formatFecha(value) }}</span>
      </template>

      <template #col-_acciones="{ row }">
        <button
          v-if="row.estado === 'cerrado'"
          type="button"
          class="btn btn-sm btn-link p-0 text-muted"
          title="Ocultar — visible al filtrar por estado cerrado"
          @click.stop="hideTicket(row.id)"
        >
          <i class="bi bi-eye-slash"></i>
        </button>
      </template>

      <template #footer>
        <div v-if="totalPaginas > 1" class="d-flex justify-content-center py-3 gap-1">
          <button class="btn btn-sm btn-outline-secondary" :disabled="pagina === 1" @click="cambiarPagina(pagina - 1)">
            <i class="bi bi-chevron-left"></i>
          </button>
          <button
            v-for="p in totalPaginas"
            :key="p"
            class="btn btn-sm"
            :class="p === pagina ? 'btn-primary' : 'btn-outline-secondary'"
            @click="cambiarPagina(p)"
          >{{ p }}</button>
          <button class="btn btn-sm btn-outline-secondary" :disabled="pagina === totalPaginas" @click="cambiarPagina(pagina + 1)">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </template>
    </AppTable>

    <!-- Vista tablero -->
    <TicketsBoardView
      v-else
      :tickets="ticketsFiltrados"
      :agentes="agentes"
      :cargando="cargando"
      style="flex: 1; min-height: 0;"
      @ocultar="hideTicket"
    />

    <!-- Modal: crear ticket -->
    <CrearTicketModal
      v-if="mostrarCrear"
      @close="mostrarCrear = false"
      @creado="onCreado"
    />

    <!-- Modal: detalle de ticket (ruta hija /tickets/:id) -->
    <router-view />

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import api from '@/api/axios'
import AppTable          from '@/components/ui/AppTable.vue'
import ColorBadgeSelect  from '@/components/ui/ColorBadgeSelect.vue'
import CrearTicketModal  from '@/components/tickets/CrearTicketModal.vue'
import TicketsBoardView  from '@/components/tickets/TicketsBoardView.vue'

const router = useRouter()
const route  = useRoute()
const store  = useStore()

const rol       = computed(() => store.getters['auth/rol'])
const esCliente = computed(() => rol.value === 'cliente')

const tickets      = ref([])
const agentes      = ref([])
const categorias   = ref([])
const cargando     = ref(false)
const pagina       = ref(1)
const totalPaginas = ref(1)
const mostrarCrear = ref(false)
const vista        = ref('lista')

watch(vista, () => {
  pagina.value = 1
  cargarTickets()
})

watch(() => route.name, (to, from) => {
  if (from === 'tickets-detalle' && to === 'tickets') cargarTickets()
})

const filtros = reactive({ busqueda: '', estado: '', prioridad: '' })

const columnas = computed(() => [
  { key: 'titulo',    label: 'Título' },
  { key: 'estado',    label: 'Estado' },
  ...(!esCliente.value ? [{ key: 'prioridad', label: 'Prioridad' }] : []),
  { key: 'categoria', label: 'Categoría' },
  ...(!esCliente.value ? [{ key: 'cliente', label: 'Cliente', cellClass: 'text-muted' }] : []),
  { key: 'agente',    label: 'Agente' },
  { key: 'creado_en', label: 'Fecha', cellClass: 'text-muted' },
  { key: '_acciones', label: '', width: '48px' },
])

const ticketsFiltrados = computed(() => {
  const q = filtros.busqueda.trim().toLowerCase()
  if (!q) return tickets.value
  return tickets.value.filter(t => t.titulo.toLowerCase().includes(q))
})

const cargarMaestros = async () => {
  const [resAgentes, resCats] = await Promise.allSettled([
    api.get('/api/usuarios/agentes'),
    api.get('/api/categorias', { params: { limit: 100, activo: true } }),
  ])
  if (resAgentes.status === 'fulfilled') agentes.value   = resAgentes.value.data ?? []
  if (resCats.status    === 'fulfilled') categorias.value = resCats.value.data.datos ?? []
}

const actualizar = async (id, campos) => {
  try {
    await api.patch(`/api/tickets/${id}`, campos)
    const t = tickets.value.find(t => t.id === id)
    if (!t) return
    if (campos.estado)       t.estado       = campos.estado
    if (campos.prioridad)    t.prioridad    = campos.prioridad
    if (campos.id_agente) {
      t.id_agente = campos.id_agente
      const ag = agentes.value.find(a => a.id === campos.id_agente)
      if (ag) t.agente = `${ag.nombre} ${ag.apellido}`
    }
    if (campos.id_categoria) {
      t.id_categoria = campos.id_categoria
      const cat = categorias.value.find(c => c.id === campos.id_categoria)
      if (cat) t.categoria = cat.nombre
    }
  } catch {
    cargarTickets()
  }
}

const hideTicket = async (id) => {
  try {
    await api.put(`/api/tickets/${id}/ocultar`)
    tickets.value = tickets.value.filter(t => t.id !== id)
  } catch { /* silencioso */ }
}

const cargarTickets = async () => {
  cargando.value = true
  try {
    const params = { page: pagina.value, limit: vista.value === 'board' ? 200 : 20 }
    if (filtros.estado)    params.estado    = filtros.estado
    if (filtros.prioridad) params.prioridad = filtros.prioridad
    const { data } = await api.get('/api/tickets', { params })
    tickets.value      = data.datos
    totalPaginas.value = data.paginacion.paginas
  } catch {
    tickets.value = []
  } finally {
    cargando.value = false
  }
}

const cambiarPagina = (p) => {
  pagina.value = p
  cargarTickets()
}

const irDetalle = (id) => router.push({ name: 'tickets-detalle', params: { id } })

const onCreado = () => {
  mostrarCrear.value = false
  cargarTickets()
}

onMounted(() => {
  if (route.query.nuevo === '1') {
    mostrarCrear.value = true
    router.replace({ name: 'tickets' })
  }
  cargarTickets()
  cargarMaestros()
})

// ── Helpers de badges ──────────────────────────────────────────────────────

// ── Opciones para ColorBadgeSelect ────────────────────────────────────────

const ESTADO_OPTIONS = [
  { value: 'abierto',     label: 'Abierto',     color: { bg: '#0d6efd', text: '#fff' } },
  { value: 'en_progreso', label: 'En progreso',  color: { bg: '#ffc107', text: '#212529' } },
  { value: 'resuelto',    label: 'Resuelto',     color: { bg: '#198754', text: '#fff' } },
  { value: 'cerrado',     label: 'Cerrado',      color: { bg: '#6c757d', text: '#fff' } },
]

const PRIOR_OPTIONS = [
  { value: 'bajo',    label: 'Bajo',    color: { bg: '#6c757d', text: '#fff' } },
  { value: 'medio',   label: 'Medio',   color: { bg: '#0dcaf0', text: '#212529' } },
  { value: 'alto',    label: 'Alto',    color: { bg: '#ffc107', text: '#212529' } },
  { value: 'critico', label: 'Crítico', color: { bg: '#dc3545', text: '#fff' } },
]

// ── Helpers de badges (para clientes, vista read-only) ────────────────────

const ESTADO_BADGE = { abierto: 'bg-primary', en_progreso: 'bg-warning text-dark', resuelto: 'bg-success', cerrado: 'bg-secondary' }
const PRIOR_BADGE  = { bajo: 'bg-secondary',  medio: 'bg-info text-dark', alto: 'bg-warning text-dark', critico: 'bg-danger' }

const badgeEstado    = e => ESTADO_BADGE[e] ?? 'bg-secondary'
const labelEstado    = e => ESTADO_OPTIONS.find(o => o.value === e)?.label ?? e
const badgePrioridad = p => PRIOR_BADGE[p]  ?? 'bg-secondary'
const labelPrioridad = p => PRIOR_OPTIONS.find(o => o.value === p)?.label ?? p

const formatFecha = f =>
  f ? new Date(f).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
</script>

<style scoped>
.inline-select {
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  padding: 0.2rem 0.4rem;
  font-size: 0.82rem;
  color: #212529;
  cursor: pointer;
  max-width: 140px;
  transition: border-color 0.15s, background 0.15s;
}
.inline-select:hover,
.inline-select:focus {
  border-color: #dee2e6;
  background: #fff;
  outline: none;
}
</style>
