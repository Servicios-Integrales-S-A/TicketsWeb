<template>
  <div class="d-flex flex-column" style="height: 100%;">

    <ViewToolbar
      v-model="filtros.busqueda"
      search-placeholder="Buscar categoría o agente..."
      search-width="250px"
    >
      <template #filters>
        <select class="form-select" v-model="filtros.prioridad" @change="reiniciar" style="width: 150px;">
          <option value="">Todas las prioridades</option>
          <option value="critico">Crítico</option>
          <option value="alto">Alto</option>
          <option value="medio">Medio</option>
          <option value="bajo">Bajo</option>
        </select>
        <select class="form-select" v-model="filtros.activo" @change="reiniciar" style="width: 145px;">
          <option value="">Todos los estados</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </template>
      <template #actions>
        <button class="btn btn-primary" @click="modalCrear = true">
          <i class="bi bi-plus-lg me-1"></i> Nueva regla
        </button>
      </template>
    </ViewToolbar>

    <AppTable
      :columns="columnas"
      :rows="reglasFiltradas"
      :loading="cargando"
      empty-text="No hay reglas de asignación configuradas."
      clickable
      @row-click="row => abrirEditar(row.id)"
    >
      <template #col-prioridad="{ value }">
        <span :class="['badge', badgePrioridad(value)]">{{ labelPrioridad(value) }}</span>
      </template>

      <template #col-agente="{ row }">
        <div class="fw-medium">{{ row.agente }}</div>
        <small class="text-muted">{{ row.agente_email }}</small>
      </template>

      <template #col-tickets_activos="{ value }">
        <div class="d-flex align-items-center gap-1">
          <i class="bi bi-ticket-perforated text-muted" style="font-size: 0.8rem;"></i>
          <span>{{ value }}</span>
        </div>
      </template>

      <template #col-activo="{ row }">
        <span :class="['badge', row.activo ? 'bg-success' : 'bg-secondary']">
          {{ row.activo ? 'Activa' : 'Inactiva' }}
        </span>
      </template>

      <template #col-creado_en="{ value }">
        <span style="font-size: 0.85rem; white-space: nowrap;">{{ formatFecha(value) }}</span>
      </template>

      <template #footer>
        <div v-if="totalPaginas > 1" class="d-flex justify-content-center py-3 gap-1">
          <button
            class="btn btn-sm btn-outline-secondary"
            :disabled="pagina === 1"
            @click="cambiarPagina(pagina - 1)"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          <button
            v-for="p in totalPaginas"
            :key="p"
            class="btn btn-sm"
            :class="p === pagina ? 'btn-primary' : 'btn-outline-secondary'"
            @click="cambiarPagina(p)"
          >{{ p }}</button>
          <button
            class="btn btn-sm btn-outline-secondary"
            :disabled="pagina === totalPaginas"
            @click="cambiarPagina(pagina + 1)"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </template>
    </AppTable>

    <CrearReglaModal
      v-if="modalCrear"
      @close="modalCrear = false"
      @guardado="cargarReglas"
    />

    <ReglaDetailModal
      v-if="reglaSeleccionada"
      :regla-id="reglaSeleccionada"
      @close="reglaSeleccionada = null"
      @guardado="cargarReglas"
    />

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/api/axios'
import AppTable         from '@/components/ui/AppTable.vue'
import ViewToolbar      from '@/components/ui/ViewToolbar.vue'
import CrearReglaModal  from '@/components/reglas/CrearReglaModal.vue'
import ReglaDetailModal from '@/components/reglas/ReglaDetailModal.vue'

const reglas            = ref([])
const cargando          = ref(false)
const pagina            = ref(1)
const totalPaginas      = ref(1)
const modalCrear        = ref(false)
const reglaSeleccionada = ref(null)

const filtros = reactive({ busqueda: '', prioridad: '', activo: '' })

const columnas = [
  { key: 'categoria',       label: 'Categoría' },
  { key: 'prioridad',       label: 'Prioridad' },
  { key: 'agente',          label: 'Agente' },
  { key: 'tickets_activos', label: 'Carga actual' },
  { key: 'activo',          label: 'Estado' },
  { key: 'creado_en',       label: 'Creada', cellClass: 'text-muted' },
]

const reglasFiltradas = computed(() => {
  if (!filtros.busqueda.trim()) return reglas.value
  const q = filtros.busqueda.trim().toLowerCase()
  return reglas.value.filter(r =>
    r.categoria?.toLowerCase().includes(q) ||
    r.agente?.toLowerCase().includes(q) ||
    r.agente_email?.toLowerCase().includes(q)
  )
})

const reiniciar = () => { pagina.value = 1; cargarReglas() }

const cargarReglas = async () => {
  cargando.value = true
  try {
    const params = { page: pagina.value, limit: 15 }
    if (filtros.prioridad) params.prioridad = filtros.prioridad
    if (filtros.activo)    params.activo    = filtros.activo
    const { data } = await api.get('/api/reglas', { params })
    reglas.value       = data.datos
    totalPaginas.value = data.paginacion.paginas
  } catch {
    reglas.value = []
  } finally {
    cargando.value = false
  }
}

const cambiarPagina = (p) => { pagina.value = p; cargarReglas() }
const abrirEditar   = (id) => { reglaSeleccionada.value = id }

const PRIOR_LABEL = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto', critico: 'Crítico' }
const PRIOR_BADGE = {
  bajo:    'bg-secondary',
  medio:   'bg-info text-dark',
  alto:    'bg-warning text-dark',
  critico: 'bg-danger',
}
const labelPrioridad = p => PRIOR_LABEL[p] ?? p
const badgePrioridad = p => PRIOR_BADGE[p] ?? 'bg-secondary'

const formatFecha = f =>
  f ? new Date(f).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

onMounted(cargarReglas)
</script>
