<template>
  <div class="d-flex flex-column" style="height: 100%;">

    <!-- Barra superior -->
    <ViewToolbar
      v-model="filtros.busqueda"
      search-placeholder="Buscar por nombre o email..."
      search-width="270px"
    >
      <template #filters>
        <FilterSelect
          v-model="filtros.rol"
          :options="ROL_FILTER"
          width="160px"
          @change="reiniciar"
        />
        <FilterSelect
          v-model="filtros.activo"
          :options="ACTIVO_FILTER"
          width="160px"
          @change="reiniciar"
        />
      </template>
      <template #actions>
        <button class="btn btn-primary" @click="mostrarCrear = true">
          <i class="bi bi-plus-lg me-1"></i> Nuevo usuario
        </button>
      </template>
    </ViewToolbar>

    <!-- Tabla -->
    <AppTable
      :columns="columnas"
      :rows="usuarios"
      :loading="cargando"
      empty-text="No hay usuarios para mostrar."
      clickable
      @row-click="row => abrirDetalle(row.id)"
    >
      <template #col-nombre="{ row }">
        <div class="fw-medium">{{ row.nombre }} {{ row.apellido }}</div>
        <small class="text-muted">{{ row.email }}</small>
      </template>

      <template #col-telefono="{ value }">
        <span style="font-size: 0.875rem;">{{ formatTelefono(value) }}</span>
      </template>

      <template #col-rol="{ row }">
        <span :class="['badge', badgeRol(row.rol)]">{{ labelRol(row.rol) }}</span>
      </template>

      <template #col-activo="{ row }">
        <span :class="['badge', row.activo ? 'bg-success' : 'bg-secondary']">
          {{ row.activo ? 'Activo' : 'Inactivo' }}
        </span>
      </template>

      <template #col-creado_en="{ value }">
        <span style="font-size: 0.85rem; white-space: nowrap;">{{ formatFecha(value) }}</span>
      </template>

      <template #footer>
        <div v-if="totalPaginas > 1" class="d-flex align-items-center justify-content-between py-2 px-1 gap-2">
          <span class="text-muted small">{{ infoUsuarios }}</span>
          <div class="d-flex gap-1">
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
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Mostrar</span>
            <select class="form-select form-select-sm" style="width: 72px;" v-model="porPagina" @change="cambiarTamano">
              <option :value="10">10</option>
              <option :value="15">15</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
            <span class="text-muted small">por página</span>
          </div>
        </div>
      </template>
    </AppTable>

    <!-- Modal: crear usuario -->
    <CrearUsuarioModal
      v-if="mostrarCrear"
      @close="mostrarCrear = false"
      @creado="onCreado"
    />

    <!-- Modal: detalle/editar usuario -->
    <UsuarioDetailModal
      v-if="usuarioSeleccionado"
      :user-id="usuarioSeleccionado"
      @close="usuarioSeleccionado = null"
      @guardado="cargarUsuarios"
    />

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import api from '@/api/axios'
import AppTable           from '@/components/ui/AppTable.vue'
import ViewToolbar        from '@/components/ui/ViewToolbar.vue'
import FilterSelect       from '@/components/ui/FilterSelect.vue'
import CrearUsuarioModal  from '@/components/usuarios/CrearUsuarioModal.vue'
import UsuarioDetailModal from '@/components/usuarios/UsuarioDetailModal.vue'

const usuarios            = ref([])
const cargando            = ref(false)
const pagina              = ref(1)
const totalPaginas        = ref(1)
const totalUsuarios       = ref(0)
const porPagina           = ref(15)
const mostrarCrear        = ref(false)
const usuarioSeleccionado = ref(null)

const filtros = reactive({ busqueda: '', rol: '', activo: '' })

const columnas = [
  { key: 'nombre',    label: 'Usuario' },
  { key: 'rol',       label: 'Rol' },
  { key: 'telefono',  label: 'Teléfono', cellClass: 'text-muted' },
  { key: 'activo',    label: 'Estado' },
  { key: 'creado_en', label: 'Registro',  cellClass: 'text-muted' },
]

const infoUsuarios = computed(() => {
  if (totalUsuarios.value === 0) return ''
  const desde = (pagina.value - 1) * porPagina.value + 1
  const hasta  = Math.min(pagina.value * porPagina.value, totalUsuarios.value)
  return `${desde}–${hasta} de ${totalUsuarios.value}`
})

let debounceTimer = null
watch(() => filtros.busqueda, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(reiniciar, 400)
})

const reiniciar = () => { pagina.value = 1; cargarUsuarios() }

const cargarUsuarios = async () => {
  cargando.value = true
  try {
    const params = { page: pagina.value, limit: porPagina.value }
    if (filtros.busqueda) params.search = filtros.busqueda
    if (filtros.rol)      params.rol    = filtros.rol
    if (filtros.activo)   params.activo = filtros.activo
    const { data } = await api.get('/api/usuarios', { params })
    usuarios.value     = data.datos
    totalPaginas.value = data.paginacion.paginas
    totalUsuarios.value = data.paginacion.total
  } catch {
    usuarios.value = []
  } finally {
    cargando.value = false
  }
}

const cambiarPagina = (p) => { pagina.value = p; cargarUsuarios() }
const cambiarTamano = () => { pagina.value = 1; cargarUsuarios() }
const abrirDetalle  = (id) => { usuarioSeleccionado.value = id }
const onCreado      = () => { mostrarCrear.value = false; cargarUsuarios() }

const ROL_FILTER    = [
  { value: '',        label: 'Todos los roles' },
  { value: 'admin',   label: 'Administrador' },
  { value: 'agente',  label: 'Agente' },
  { value: 'cliente', label: 'Cliente' },
]
const ACTIVO_FILTER = [
  { value: '',      label: 'Todos los estados' },
  { value: 'true',  label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
]

const ROL_LABEL = { admin: 'Administrador', agente: 'Agente', cliente: 'Cliente' }
const ROL_BADGE = { admin: 'bg-danger', agente: 'bg-primary', cliente: 'bg-secondary' }
const labelRol  = r => ROL_LABEL[r] ?? r
const badgeRol  = r => ROL_BADGE[r] ?? 'bg-secondary'
const formatFecha = f =>
  f ? new Date(f).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const formatTelefono = (raw) => {
  if (!raw) return '—'
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('502')) d = d.slice(3)
  d = d.slice(0, 8)
  if (!d) return raw
  let result = '+502'
  if (d.length > 0) result += ' ' + d.slice(0, 4)
  if (d.length > 4) result += ' ' + d.slice(4)
  return result
}

onMounted(cargarUsuarios)
</script>
