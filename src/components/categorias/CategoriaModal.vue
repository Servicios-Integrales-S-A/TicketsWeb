<template>
  <AppModal
    :titulo="modoEdicion ? categoria?.nombre ?? '...' : 'Nueva categoría'"
    cancel-label="Cerrar"
    size="lg"
    @close="$emit('close')"
  >
    <!-- Cargando (solo edición) -->
    <div v-if="cargando" class="text-center py-5 text-muted">
      <span class="spinner-border spinner-border-sm me-2"></span>Cargando...
    </div>

    <!-- Error carga -->
    <div v-else-if="errorCarga" class="alert alert-danger py-2 mb-0">
      <i class="bi bi-exclamation-circle me-1"></i>{{ errorCarga }}
    </div>

    <!-- Formulario -->
    <div v-else class="row g-0">

      <!-- Columna principal -->
      <div class="col-12 col-lg-8 pe-lg-4">

        <div class="mb-3">
          <label class="form-label">Nombre <span class="text-danger">*</span></label>
          <input
            type="text"
            class="form-control"
            :class="{ 'is-invalid': errores.nombre }"
            v-model="form.nombre"
            autofocus
          />
          <div class="invalid-feedback">{{ errores.nombre }}</div>
        </div>

        <div class="mb-3">
          <label class="form-label">Descripción</label>
          <textarea
            class="form-control"
            v-model="form.descripcion"
            rows="3"
            placeholder="Descripción opcional de la categoría..."
          ></textarea>
        </div>

        <div class="mb-3">
          <label class="form-label d-block">Prioridad por defecto</label>
          <ColorBadgeSelect
            v-model="form.prioridad_default"
            :options="PRIOR_OPTIONS"
            block
          />
          <div class="form-text">Prioridad asignada automáticamente a los tickets de esta categoría.</div>
        </div>

      </div>

      <!-- Sidebar -->
      <div class="col-12 col-lg-4 border-start ps-lg-4 mt-4 mt-lg-0">

        <template v-if="modoEdicion && categoria">
          <div class="mb-3">
            <div class="sidebar-label">Estado</div>
            <div class="d-flex align-items-center gap-2 mt-1">
              <div class="form-check form-switch mb-0">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  :id="`activo-cat-${categoriaId}`"
                  :checked="activoLocal"
                  :disabled="toggling"
                  @change="toggleActivo"
                  style="cursor: pointer;"
                />
              </div>
              <span :class="['badge', activoLocal ? 'bg-success' : 'bg-secondary']" style="font-size: 0.75rem;">
                {{ activoLocal ? 'Activa' : 'Inactiva' }}
              </span>
              <span v-if="toggling" class="spinner-border spinner-border-sm text-muted"></span>
            </div>
          </div>

          <hr class="my-3">

          <div class="mb-2">
            <div class="sidebar-label">Creada</div>
            <div style="font-size: 0.85rem;">{{ formatFecha(categoria.creado_en) }}</div>
          </div>

          <div v-if="categoria.actualizado_en">
            <div class="sidebar-label">Última actualización</div>
            <div style="font-size: 0.85rem;">{{ formatFecha(categoria.actualizado_en) }}</div>
          </div>
        </template>

        <template v-else>
          <div class="text-muted" style="font-size: 0.85rem;">
            <i class="bi bi-info-circle me-1"></i>
            La categoría se creará como activa. Podrás desactivarla desde la edición.
          </div>
        </template>

      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div v-if="errorGuardar" class="text-danger me-auto" style="font-size: 0.85rem;">
        <i class="bi bi-exclamation-circle me-1"></i>{{ errorGuardar }}
      </div>
      <button type="button" class="btn btn-outline-secondary" @click="$emit('close')">Cerrar</button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="(modoEdicion && !hayCambios) || guardando || cargando"
        @click="guardar"
      >
        <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
        {{ guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Crear categoría' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/api/axios'
import AppModal        from '@/components/ui/AppModal.vue'
import ColorBadgeSelect from '@/components/ui/ColorBadgeSelect.vue'

const props = defineProps({
  categoriaId: { type: String, default: null },
})

const emit = defineEmits(['close', 'guardado'])

const modoEdicion = computed(() => !!props.categoriaId)

const categoria   = ref(null)
const cargando    = ref(false)
const guardando   = ref(false)
const toggling    = ref(false)
const errorCarga  = ref(null)
const errorGuardar = ref(null)
const errores     = ref({})
const activoLocal = ref(true)

const form     = reactive({ nombre: '', descripcion: '', prioridad_default: 'bajo' })
const original = reactive({ nombre: '', descripcion: '', prioridad_default: 'bajo' })

const hayCambios = computed(() =>
  form.nombre            !== original.nombre            ||
  form.descripcion       !== original.descripcion       ||
  form.prioridad_default !== original.prioridad_default
)

const sincronizar = (c) => {
  const snap = {
    nombre:            c.nombre            ?? '',
    descripcion:       c.descripcion       ?? '',
    prioridad_default: c.prioridad_default ?? 'bajo',
  }
  Object.assign(form,     snap)
  Object.assign(original, snap)
  activoLocal.value = c.activo
}

const cargarCategoria = async () => {
  cargando.value = true
  errorCarga.value = null
  try {
    const { data } = await api.get(`/api/categorias/${props.categoriaId}`)
    categoria.value = data
    sincronizar(data)
  } catch (err) {
    errorCarga.value = err.response?.status === 404
      ? 'Categoría no encontrada.'
      : 'No se pudo cargar la categoría.'
  } finally {
    cargando.value = false
  }
}

const validar = () => {
  const e = {}
  if (!form.nombre.trim()) e.nombre = 'El nombre es requerido.'
  errores.value = e
  return Object.keys(e).length === 0
}

const guardar = async () => {
  errorGuardar.value = null
  if (!validar()) return

  guardando.value = true
  try {
    if (modoEdicion.value) {
      const campos = {}
      if (form.nombre            !== original.nombre)            campos.nombre            = form.nombre.trim()
      if (form.descripcion       !== original.descripcion)       campos.descripcion       = form.descripcion.trim() || undefined
      if (form.prioridad_default !== original.prioridad_default) campos.prioridad_default = form.prioridad_default
      if (Object.keys(campos).length === 0) return
      await api.put(`/api/categorias/${props.categoriaId}`, campos)
      Object.assign(original, form)
    } else {
      await api.post('/api/categorias', {
        nombre:            form.nombre.trim(),
        descripcion:       form.descripcion.trim() || undefined,
        prioridad_default: form.prioridad_default,
      })
    }
    emit('guardado')
    if (!modoEdicion.value) emit('close')
  } catch (err) {
    errorGuardar.value = err.response?.data?.mensaje || 'Error al guardar la categoría.'
  } finally {
    guardando.value = false
  }
}

const toggleActivo = async () => {
  toggling.value = true
  try {
    await api.put(`/api/categorias/${props.categoriaId}/toggle-activo`)
    activoLocal.value = !activoLocal.value
    emit('guardado')
  } catch {
    activoLocal.value = !activoLocal.value
  } finally {
    toggling.value = false
  }
}

onMounted(() => {
  if (modoEdicion.value) cargarCategoria()
})

const PRIOR_OPTIONS = [
  { value: 'bajo',    label: 'Bajo',    color: { bg: '#6c757d', text: '#fff' } },
  { value: 'medio',   label: 'Medio',   color: { bg: '#0dcaf0', text: '#212529' } },
  { value: 'alto',    label: 'Alto',    color: { bg: '#ffc107', text: '#212529' } },
  { value: 'critico', label: 'Crítico', color: { bg: '#dc3545', text: '#fff' } },
]

const formatFecha = f =>
  f ? new Date(f).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
</script>

<style scoped>
.sidebar-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6c757d;
  margin-bottom: 0.35rem;
}
</style>
