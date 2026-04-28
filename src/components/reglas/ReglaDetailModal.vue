<template>
  <AppModal
    :titulo="regla ? `Regla — ${regla.categoria}` : 'Cargando...'"
    cancel-label="Cerrar"
    size="lg"
    @close="$emit('close')"
  >

    <div v-if="cargando" class="text-center py-5 text-muted">
      <span class="spinner-border spinner-border-sm me-2"></span>Cargando...
    </div>

    <div v-else-if="errorCarga" class="alert alert-danger py-2 mb-0">
      <i class="bi bi-exclamation-circle me-1"></i>{{ errorCarga }}
    </div>

    <div v-else-if="regla" class="row g-0">

      <!-- Formulario principal -->
      <div class="col-12 col-lg-8 pe-lg-4">

        <div class="mb-3">
          <label class="form-label">Categoría <span class="text-danger">*</span></label>
          <SearchableSelect
            v-model="form.id_categoria"
            :options="opcionesCategoria"
            placeholder="Seleccionar categoría..."
          />
        </div>

        <div class="mb-3">
          <label class="form-label d-block">Prioridad <span class="text-danger">*</span></label>
          <ColorBadgeSelect
            v-model="form.prioridad"
            :options="PRIOR_OPTIONS"
            block
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Agente <span class="text-danger">*</span></label>
          <SearchableSelect
            v-model="form.id_agente"
            :options="opcionesAgente"
            placeholder="Buscar agente..."
          />
        </div>

      </div>

      <!-- Sidebar -->
      <div class="col-12 col-lg-4 border-start ps-lg-4 mt-4 mt-lg-0">

        <div class="mb-3">
          <div class="sidebar-label">Estado de la regla</div>
          <div class="d-flex align-items-center gap-2 mt-1">
            <div class="form-check form-switch mb-0">
              <input
                class="form-check-input"
                type="checkbox"
                role="switch"
                :id="`activo-regla-${reglaId}`"
                :checked="activoLocal"
                :disabled="toggling"
                @change="toggleActivo"
                style="cursor: pointer;"
              />
            </div>
            <span
              :class="['badge', activoLocal ? 'bg-success' : 'bg-secondary']"
              style="font-size: 0.75rem;"
            >{{ activoLocal ? 'Activa' : 'Inactiva' }}</span>
            <span v-if="toggling" class="spinner-border spinner-border-sm text-muted"></span>
          </div>
          <div class="form-text mt-1" style="font-size: 0.75rem;">
            Las reglas inactivas no participan en la asignación automática.
          </div>
        </div>

        <hr class="my-3">

        <div class="mb-2">
          <div class="sidebar-label">Creada</div>
          <div style="font-size: 0.85rem;">{{ formatFecha(regla.creado_en) }}</div>
        </div>
        <div v-if="regla.actualizado_en">
          <div class="sidebar-label">Última actualización</div>
          <div style="font-size: 0.85rem;">{{ formatFecha(regla.actualizado_en) }}</div>
        </div>

        <hr class="my-3">

        <div>
          <div class="sidebar-label">Zona de peligro</div>
          <div class="mt-1">
            <template v-if="!confirmandoEliminar">
              <button
                type="button"
                class="btn btn-sm btn-outline-danger w-100"
                @click="confirmandoEliminar = true"
              >
                <i class="bi bi-trash me-1"></i> Eliminar regla
              </button>
            </template>
            <template v-else>
              <p class="text-danger mb-2" style="font-size: 0.8rem;">
                ¿Confirmar? Esta acción no se puede deshacer.
              </p>
              <div class="d-flex gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary flex-fill"
                  @click="confirmandoEliminar = false"
                >Cancelar</button>
                <button
                  type="button"
                  class="btn btn-sm btn-danger flex-fill"
                  :disabled="eliminando"
                  @click="eliminar"
                >
                  <span v-if="eliminando" class="spinner-border spinner-border-sm me-1"></span>
                  Sí, eliminar
                </button>
              </div>
            </template>
          </div>
          <div class="form-text mt-1" style="font-size: 0.73rem;">
            Los tickets ya asignados no se ven afectados.
          </div>
        </div>

      </div>
    </div>

    <template #footer>
      <div v-if="errorGuardar" class="text-danger me-auto" style="font-size: 0.85rem;">
        <i class="bi bi-exclamation-circle me-1"></i>{{ errorGuardar }}
      </div>
      <button type="button" class="btn btn-outline-secondary" @click="$emit('close')">Cerrar</button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!hayCambios || guardando || cargando"
        @click="guardar"
      >
        <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
        {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
      </button>
    </template>

  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/api/axios'
import AppModal         from '@/components/ui/AppModal.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'
import ColorBadgeSelect from '@/components/ui/ColorBadgeSelect.vue'

const props = defineProps({
  reglaId: { type: String, required: true },
})
const emit = defineEmits(['close', 'guardado'])

const regla      = ref(null)
const cargando   = ref(false)
const guardando  = ref(false)
const toggling   = ref(false)
const eliminando = ref(false)
const errorCarga   = ref(null)
const errorGuardar = ref(null)
const activoLocal          = ref(true)
const confirmandoEliminar  = ref(false)

const categorias = ref([])
const agentes    = ref([])

const form     = reactive({ id_categoria: '', prioridad: '', id_agente: '' })
const original = reactive({ id_categoria: '', prioridad: '', id_agente: '' })

const hayCambios = computed(() =>
  form.id_categoria !== original.id_categoria ||
  form.prioridad    !== original.prioridad    ||
  form.id_agente    !== original.id_agente
)

const opcionesCategoria = computed(() =>
  categorias.value.map(c => ({ value: c.id, label: c.nombre }))
)
const opcionesAgente = computed(() =>
  agentes.value.map(a => ({
    value:    a.id,
    label:    `${a.nombre} ${a.apellido}`,
    sublabel: a.email,
  }))
)

const sincronizar = (r) => {
  const snap = {
    id_categoria: r.id_categoria ?? '',
    prioridad:    r.prioridad    ?? '',
    id_agente:    r.id_agente    ?? '',
  }
  Object.assign(form,     snap)
  Object.assign(original, snap)
  activoLocal.value = r.activo
}

const cargarRegla = async () => {
  cargando.value = true
  errorCarga.value = null
  try {
    const { data } = await api.get(`/api/reglas/${props.reglaId}`)
    regla.value = data
    sincronizar(data)
  } catch (err) {
    errorCarga.value = err.response?.status === 404
      ? 'Regla no encontrada.'
      : 'No se pudo cargar la regla.'
  } finally {
    cargando.value = false
  }
}

const guardar = async () => {
  errorGuardar.value = null
  if (!hayCambios.value) return
  guardando.value = true
  try {
    const campos = {}
    if (form.id_categoria !== original.id_categoria) campos.id_categoria = form.id_categoria
    if (form.prioridad    !== original.prioridad)    campos.prioridad    = form.prioridad
    if (form.id_agente    !== original.id_agente)    campos.id_agente    = form.id_agente
    await api.put(`/api/reglas/${props.reglaId}`, campos)
    Object.assign(original, form)
    emit('guardado')
  } catch (err) {
    errorGuardar.value = err.response?.data?.mensaje || 'Error al guardar los cambios.'
  } finally {
    guardando.value = false
  }
}

const toggleActivo = async () => {
  toggling.value = true
  try {
    await api.put(`/api/reglas/${props.reglaId}/toggle-activo`)
    activoLocal.value = !activoLocal.value
    emit('guardado')
  } catch {
    activoLocal.value = !activoLocal.value
  } finally {
    toggling.value = false
  }
}

const eliminar = async () => {
  eliminando.value = true
  try {
    await api.delete(`/api/reglas/${props.reglaId}`)
    emit('guardado')
    emit('close')
  } catch {
    confirmandoEliminar.value = false
  } finally {
    eliminando.value = false
  }
}

onMounted(async () => {
  const [, resCat, resAg] = await Promise.all([
    cargarRegla(),
    api.get('/api/categorias', { params: { activo: true, limit: 100 } }),
    api.get('/api/usuarios',   { params: { rol: 'agente', activo: true, limit: 100 } }),
  ])
  categorias.value = resCat.data.datos
  agentes.value    = resAg.data.datos
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
