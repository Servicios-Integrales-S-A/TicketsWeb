<template>
  <div class="d-flex flex-column" style="height: 100%;">

    <!-- Barra superior -->
    <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap flex-shrink-0">

      <div class="d-flex gap-2 flex-wrap align-items-center">
        <div class="input-group" style="width: 240px;">
          <span class="input-group-text bg-white border-end-0">
            <i class="bi bi-search text-muted" style="font-size: 0.85rem;"></i>
          </span>
          <input
            type="text"
            class="form-control border-start-0 ps-0"
            placeholder="Buscar por nombre o email..."
            v-model="filtros.busqueda"
          />
        </div>

        <select class="form-select" v-model="filtros.rol" @change="reiniciar" style="width: 155px;">
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="agente">Agente</option>
          <option value="cliente">Cliente</option>
        </select>

        <select class="form-select" v-model="filtros.activo" @change="reiniciar" style="width: 145px;">
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      <button class="btn btn-primary" @click="mostrarCrear = true">
        <i class="bi bi-plus-lg me-1"></i> Nuevo usuario
      </button>
    </div>

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
import { ref, reactive, watch, onMounted } from 'vue'
import api from '@/api/axios'
import AppTable           from '@/components/ui/AppTable.vue'
import CrearUsuarioModal  from '@/components/usuarios/CrearUsuarioModal.vue'
import UsuarioDetailModal from '@/components/usuarios/UsuarioDetailModal.vue'

const usuarios            = ref([])
const cargando            = ref(false)
const pagina              = ref(1)
const totalPaginas        = ref(1)
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

let debounceTimer = null
watch(() => filtros.busqueda, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(reiniciar, 400)
})

const reiniciar = () => { pagina.value = 1; cargarUsuarios() }

const cargarUsuarios = async () => {
  cargando.value = true
  try {
    const params = { page: pagina.value, limit: 15 }
    if (filtros.busqueda) params.search = filtros.busqueda
    if (filtros.rol)      params.rol    = filtros.rol
    if (filtros.activo)   params.activo = filtros.activo
    const { data } = await api.get('/api/usuarios', { params })
    usuarios.value     = data.datos
    totalPaginas.value = data.paginacion.paginas
  } catch {
    usuarios.value = []
  } finally {
    cargando.value = false
  }
}

const cambiarPagina = (p) => { pagina.value = p; cargarUsuarios() }
const abrirDetalle  = (id) => { usuarioSeleccionado.value = id }
const onCreado      = () => { mostrarCrear.value = false; cargarUsuarios() }

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
