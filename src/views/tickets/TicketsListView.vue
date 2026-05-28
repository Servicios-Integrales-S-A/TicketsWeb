<template>
  <div class="d-flex flex-column" style="height: 100%;">

    <!-- Barra superior -->
    <ViewToolbar
      v-model="filtros.busqueda"
      search-placeholder="Buscar por título..."
      search-width="220px"
    >
      <template #filters>
        <FilterSelect
          v-model="filtros.estado"
          @change="cargarTickets"
          :options="ESTADO_FILTER"
          width="160px"
        />
        <FilterSelect
          v-if="!esCliente"
          v-model="filtros.prioridad"
          @change="cargarTickets"
          :options="PRIOR_FILTER"
          width="170px"
        />
        <div v-if="!esCliente" class="form-check form-switch mb-0 d-flex align-items-center gap-2" style="white-space: nowrap;">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="filtro-sin-agente"
            v-model="filtros.sinAgente"
            @change="cargarTickets"
          />
          <label class="form-check-label" for="filtro-sin-agente">Sin agente</label>
        </div>
      </template>
      <template #actions>
        <div v-if="!esCliente" class="btn-toolbar" role="toolbar">
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
      </template>
    </ViewToolbar>

    <!-- Vista lista -->
    <AppTable
      v-if="vista === 'lista'"
      :columns="columnas"
      :rows="ticketsFiltrados"
      :loading="cargando"
      :sort-by="ordenarPor"
      :sort-dir="ordenDir"
      empty-text="No hay tickets para mostrar."
      clickable
      @row-click="row => irDetalle(row.id)"
      @sort="handleSort"
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
        <div class="d-flex align-items-center justify-content-between py-2 px-1 gap-2 footer-bar">
          <!-- Info -->
          <span class="footer-info">{{ infoTickets }}</span>

          <!-- Paginación -->
          <div v-if="totalPaginas > 1" class="d-flex gap-1">
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
          <div v-else></div>

          <!-- Tamaño de página -->
          <div class="d-flex align-items-center gap-2 footer-size">
            <span>Mostrar</span>
            <select class="form-select form-select-sm size-select" v-model="porPagina" @change="cambiarTamano">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <span>por página</span>
          </div>
        </div>
      </template>
    </AppTable>

    <!-- Vista tablero -->
    <TicketsBoardView
      v-else
      :tickets="ticketsFiltrados"
      :agentes="agentes"
      :cargando="cargando"
      @ocultar="hideTicket"
    />

    <!-- Modal: crear ticket -->
    <TicketDetailModal
      v-if="mostrarCrear"
      :modoCrear="true"
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
import ViewToolbar       from '@/components/ui/ViewToolbar.vue'
import ColorBadgeSelect  from '@/components/ui/ColorBadgeSelect.vue'
import FilterSelect      from '@/components/ui/FilterSelect.vue'
import TicketDetailModal from '@/views/tickets/TicketDetailModal.vue'
import TicketsBoardView  from '@/components/tickets/TicketsBoardView.vue'

const router = useRouter()
const route  = useRoute()
const store  = useStore()

const rol       = computed(() => store.getters['auth/rol'])
const esCliente = computed(() => rol.value === 'cliente')
const esAdmin   = computed(() => rol.value === 'admin')

const tickets      = ref([])
const agentes      = ref([])
const categorias   = ref([])
const cargando     = ref(false)
const pagina       = ref(1)
const totalPaginas = ref(1)
const totalTickets = ref(0)
const porPagina    = ref(20)
const ordenarPor   = ref('prioridad')
const ordenDir     = ref('asc')
const mostrarCrear = ref(false)
const vista        = ref('lista')

const SORT_DEFAULT_DIR = { creado_en: 'desc' }

const handleSort = (key) => {
  if (ordenarPor.value === key) {
    ordenDir.value = ordenDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    ordenarPor.value = key
    ordenDir.value = SORT_DEFAULT_DIR[key] ?? 'asc'
  }
  pagina.value = 1
  cargarTickets()
}

watch(vista, () => {
  pagina.value = 1
  cargarTickets()
})

const infoTickets = computed(() => {
  if (totalTickets.value === 0) return ''
  const desde = (pagina.value - 1) * porPagina.value + 1
  const hasta  = Math.min(pagina.value * porPagina.value, totalTickets.value)
  return `${desde}–${hasta} de ${totalTickets.value}`
})

watch(() => route.name, (to, from) => {
  if (from === 'tickets-detalle' && to === 'tickets') cargarTickets()
})

const filtros = reactive({ busqueda: '', estado: '', prioridad: '', sinAgente: false })

const columnas = computed(() => [
  { key: 'titulo',    label: 'Título' },
  { key: 'estado',    label: 'Estado',    sortable: true },
  ...(!esCliente.value ? [{ key: 'prioridad', label: 'Prioridad', sortable: true }] : []),
  { key: 'categoria', label: 'Categoría' },
  ...(!esCliente.value ? [{ key: 'cliente',   label: 'Cliente',   cellClass: 'text-muted' }] : []),
  { key: 'agente',    label: 'Agente' },
  { key: 'creado_en', label: 'Fecha',     sortable: true, cellClass: 'text-muted' },
  { key: '_acciones', label: '',          width: '48px' },
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
  } catch {} finally {
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
    const params = { page: pagina.value, limit: vista.value === 'board' ? 200 : porPagina.value }
    if (filtros.estado)    params.estado    = filtros.estado
    if (filtros.prioridad) params.prioridad = filtros.prioridad
    if (filtros.sinAgente) params.sin_agente = 'true'
    if (vista.value === 'lista') {
      params.orderBy  = ordenarPor.value
      params.orderDir = ordenDir.value
    }
    const { data } = await api.get('/api/tickets', { params })
    tickets.value      = data.datos
    totalPaginas.value = data.paginacion.paginas
    totalTickets.value = data.paginacion.total
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

const cambiarTamano = () => {
  pagina.value = 1
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

// ── Opciones para FilterSelect (dropdowns de filtro) ─────────────────────

const ESTADO_FILTER = [
  { value: '',            label: 'Todos los estados' },
  { value: 'abierto',     label: 'Abierto' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'resuelto',    label: 'Resuelto' },
  { value: 'cerrado',     label: 'Cerrado' },
]

const PRIOR_FILTER = [
  { value: '',        label: 'Todas las prioridades' },
  { value: 'bajo',    label: 'Bajo' },
  { value: 'medio',   label: 'Medio' },
  { value: 'alto',    label: 'Alto' },
  { value: 'critico', label: 'Crítico' },
]

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

.footer-bar {
  min-height: 48px;
}

.footer-info {
  font-size: 0.82rem;
  color: #6c757d;
  min-width: 100px;
}

.footer-size {
  font-size: 0.82rem;
  color: #6c757d;
  min-width: 100px;
  justify-content: flex-end;
}

.size-select {
  width: auto;
  min-width: 64px;
  font-size: 0.82rem;
}
</style>
