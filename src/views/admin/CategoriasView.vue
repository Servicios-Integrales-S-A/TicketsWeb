<template>
  <div class="d-flex flex-column" style="height: 100%;">

    <!-- Barra superior -->
    <ViewToolbar
      v-model="filtros.busqueda"
      search-placeholder="Buscar categoría..."
      search-width="240px"
    >
      <template #filters>
        <select class="form-select" v-model="filtros.activo" @change="reiniciar" style="width: 145px;">
          <option value="">Todos los estados</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </template>
      <template #actions>
        <button class="btn btn-primary" @click="abrirModal(null)">
          <i class="bi bi-plus-lg me-1"></i> Nueva categoría
        </button>
      </template>
    </ViewToolbar>

    <!-- Tabla -->
    <AppTable
      :columns="columnas"
      :rows="categorias"
      :loading="cargando"
      empty-text="No hay categorías para mostrar."
      clickable
      @row-click="row => abrirModal(row.id)"
    >
      <template #col-nombre="{ row }">
        <div class="fw-medium">{{ row.nombre }}</div>
        <small v-if="row.descripcion" class="text-muted">{{ row.descripcion }}</small>
      </template>

      <template #col-prioridad_default="{ value }">
        <span :class="['badge', badgePrioridad(value)]">{{ labelPrioridad(value) }}</span>
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

    <!-- Modal: crear / editar categoría -->
    <CategoriaModal
      v-if="modalAbierto"
      :categoria-id="categoriaSeleccionada"
      @close="modalAbierto = false"
      @guardado="cargarCategorias"
    />

  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import api from '@/api/axios'
import AppTable       from '@/components/ui/AppTable.vue'
import ViewToolbar    from '@/components/ui/ViewToolbar.vue'
import CategoriaModal from '@/components/categorias/CategoriaModal.vue'

const categorias          = ref([])
const cargando            = ref(false)
const pagina              = ref(1)
const totalPaginas        = ref(1)
const modalAbierto        = ref(false)
const categoriaSeleccionada = ref(null)

const filtros = reactive({ busqueda: '', activo: '' })

const columnas = [
  { key: 'nombre',            label: 'Categoría' },
  { key: 'prioridad_default', label: 'Prioridad default' },
  { key: 'activo',            label: 'Estado' },
  { key: 'creado_en',         label: 'Creada', cellClass: 'text-muted' },
]

let debounceTimer = null
watch(() => filtros.busqueda, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(reiniciar, 400)
})

const reiniciar = () => { pagina.value = 1; cargarCategorias() }

const cargarCategorias = async () => {
  cargando.value = true
  try {
    const params = { page: pagina.value, limit: 15 }
    if (filtros.busqueda) params.search = filtros.busqueda
    if (filtros.activo)   params.activo = filtros.activo
    const { data } = await api.get('/api/categorias', { params })
    categorias.value   = data.datos
    totalPaginas.value = data.paginacion.paginas
  } catch {
    categorias.value = []
  } finally {
    cargando.value = false
  }
}

const cambiarPagina = (p) => { pagina.value = p; cargarCategorias() }

const abrirModal = (id) => {
  categoriaSeleccionada.value = id
  modalAbierto.value = true
}

const PRIOR_LABEL = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto', critico: 'Crítico' }
const PRIOR_BADGE = { bajo: 'bg-secondary', medio: 'bg-info text-dark', alto: 'bg-warning text-dark', critico: 'bg-danger' }
const labelPrioridad = p => PRIOR_LABEL[p] ?? p
const badgePrioridad = p => PRIOR_BADGE[p] ?? 'bg-secondary'

const formatFecha = f =>
  f ? new Date(f).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

onMounted(cargarCategorias)
</script>
