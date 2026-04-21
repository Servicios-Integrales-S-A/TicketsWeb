<template>
  <AppModal
    :titulo="ticket?.numero_legible ?? '...'"
    cancel-label="Cerrar"
    size="lg"
    @close="cerrar"
  >
    <!-- Cargando -->
    <div v-if="cargando" class="text-center py-5 text-muted">
      <span class="spinner-border spinner-border-sm me-2"></span>Cargando...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger py-2 mb-0">
      <i class="bi bi-exclamation-circle me-1"></i>{{ error }}
    </div>

    <!-- Contenido -->
    <div v-else-if="ticket" class="row g-0">

      <!-- ── Columna principal ────────────────────────────────────────────── -->
      <div class="col-12 col-lg-8 pe-lg-4">
        <h6 class="fw-semibold mb-2" style="font-size: 1rem;">{{ ticket.titulo }}</h6>

        <p class="text-muted mb-4" style="white-space: pre-wrap; font-size: 0.9rem; line-height: 1.6;">
          {{ ticket.descripcion }}
        </p>

        <div class="d-flex flex-wrap gap-3 text-muted" style="font-size: 0.8rem;">
          <span><i class="bi bi-broadcast me-1"></i>{{ labelCanal(ticket.canal) }}</span>
          <span><i class="bi bi-calendar3 me-1"></i>Creado {{ formatFecha(ticket.creado_en) }}</span>
          <span v-if="ticket.actualizado_en">
            <i class="bi bi-pencil me-1"></i>Editado {{ formatFecha(ticket.actualizado_en) }}
          </span>
          <span v-if="ticket.fecha_cierre" class="text-success">
            <i class="bi bi-check2-circle me-1"></i>Cerrado {{ formatFecha(ticket.fecha_cierre) }}
          </span>
        </div>
      </div>

      <!-- ── Sidebar ─────────────────────────────────────────────────────── -->
      <div class="col-12 col-lg-4 border-start ps-lg-4 mt-4 mt-lg-0">

        <div class="mb-3">
          <div class="sidebar-label">Estado</div>
          <ColorBadgeSelect
            v-if="!esCliente"
            v-model="form.estado"
            :options="ESTADO_OPTIONS"
          />
          <span v-else :class="['badge', badgeEstado(ticket.estado)]">{{ labelEstado(ticket.estado) }}</span>
        </div>

        <div class="mb-3">
          <div class="sidebar-label">Prioridad</div>
          <ColorBadgeSelect
            v-if="!esCliente"
            v-model="form.prioridad"
            :options="PRIOR_OPTIONS"
          />
          <span v-else :class="['badge', badgePrioridad(ticket.prioridad)]">{{ labelPrioridad(ticket.prioridad) }}</span>
        </div>

        <div class="mb-3">
          <div class="sidebar-label">Categoría</div>
          <select
            v-if="!esCliente"
            class="form-select form-select-sm"
            v-model="form.id_categoria"
          >
            <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
          </select>
          <span v-else class="fw-medium" style="font-size: 0.9rem;">{{ ticket.categoria }}</span>
        </div>

        <hr class="my-3">

        <div class="mb-3">
          <div class="sidebar-label">Agente</div>
          <select
            v-if="!esCliente"
            class="form-select form-select-sm"
            v-model="form.id_agente"
          >
            <option value="">Sin asignar</option>
            <option v-for="ag in agentes" :key="ag.id" :value="ag.id">
              {{ ag.nombre }} {{ ag.apellido }}
            </option>
          </select>
          <template v-else>
            <div class="fw-medium" style="font-size: 0.9rem;">
              {{ ticket.agente_nombre }} {{ ticket.agente_apellido }}
            </div>
            <small class="text-muted">{{ ticket.agente_email ?? 'Sin asignar' }}</small>
          </template>
        </div>

        <div>
          <div class="sidebar-label">Cliente</div>
          <div class="fw-medium" style="font-size: 0.9rem;">
            {{ ticket.cliente_nombre }} {{ ticket.cliente_apellido }}
          </div>
          <small class="text-muted">{{ ticket.cliente_email }}</small>
        </div>

      </div>
    </div>

    <!-- ── Footer ── -->
    <template #footer>
      <div v-if="errorGuardar" class="text-danger me-auto" style="font-size: 0.85rem;">
        <i class="bi bi-exclamation-circle me-1"></i>{{ errorGuardar }}
      </div>
      <button type="button" class="btn btn-outline-secondary" @click="cerrar">Cerrar</button>
      <button
        v-if="!esCliente && ticket"
        type="button"
        class="btn btn-primary"
        :disabled="!hayCambios || guardando"
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
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import api from '@/api/axios'
import AppModal         from '@/components/ui/AppModal.vue'
import ColorBadgeSelect from '@/components/ui/ColorBadgeSelect.vue'

const route  = useRoute()
const router = useRouter()
const store  = useStore()

const esCliente = computed(() => store.getters['auth/rol'] === 'cliente')

const ticket       = ref(null)
const agentes      = ref([])
const categorias   = ref([])
const cargando     = ref(false)
const guardando    = ref(false)
const error        = ref(null)
const errorGuardar = ref(null)

// form = copia editable de los campos que el usuario puede cambiar
const form     = reactive({ estado: '', prioridad: '', id_categoria: '', id_agente: '' })
// original = snapshot al momento de cargar (o después de guardar) para detectar cambios
const original = reactive({ estado: '', prioridad: '', id_categoria: '', id_agente: '' })

const hayCambios = computed(() =>
  form.estado       !== original.estado       ||
  form.prioridad    !== original.prioridad    ||
  form.id_categoria !== original.id_categoria ||
  form.id_agente    !== original.id_agente
)

// ── Carga ─────────────────────────────────────────────────────────────────

const sincronizarForm = (t) => {
  const snap = {
    estado:       t.estado,
    prioridad:    t.prioridad,
    id_categoria: t.id_categoria ?? '',
    id_agente:    t.id_agente    ?? '',
  }
  Object.assign(form,     snap)
  Object.assign(original, snap)
}

const cargarTicket = async () => {
  cargando.value = true
  error.value    = null
  try {
    const { data } = await api.get(`/api/tickets/${route.params.id}`)
    ticket.value = data
    sincronizarForm(data)
  } catch (err) {
    error.value = err.response?.status === 404
      ? 'Ticket no encontrado.'
      : 'No se pudo cargar el ticket.'
  } finally {
    cargando.value = false
  }
}

const cargarMaestros = async () => {
  const [resAg, resCat] = await Promise.allSettled([
    api.get('/api/usuarios/agentes'),
    api.get('/api/categorias', { params: { limit: 100, activo: true } }),
  ])
  if (resAg.status  === 'fulfilled') agentes.value    = resAg.value.data        ?? []
  if (resCat.status === 'fulfilled') categorias.value = resCat.value.data.datos ?? []
}

onMounted(() => {
  cargarTicket()
  if (!esCliente.value) cargarMaestros()
})

// ── Guardar ───────────────────────────────────────────────────────────────

const guardar = async () => {
  errorGuardar.value = null
  const campos = {}
  if (form.estado       !== original.estado)      campos.estado       = form.estado
  if (form.prioridad    !== original.prioridad)    campos.prioridad    = form.prioridad
  if (form.id_categoria !== original.id_categoria) campos.id_categoria = form.id_categoria
  if (form.id_agente    !== original.id_agente)    campos.id_agente    = form.id_agente || null

  if (Object.keys(campos).length === 0) return

  guardando.value = true
  try {
    await api.patch(`/api/tickets/${ticket.value.id}`, campos)

    // Actualizar nombres de visualización en el ticket
    if (campos.id_agente) {
      const ag = agentes.value.find(a => a.id === campos.id_agente)
      if (ag) {
        ticket.value.agente_nombre   = ag.nombre
        ticket.value.agente_apellido = ag.apellido
        ticket.value.agente_email    = ag.email
      }
    } else if ('id_agente' in campos) {
      ticket.value.agente_nombre   = 'Sin asignar'
      ticket.value.agente_apellido = ''
      ticket.value.agente_email    = null
    }
    if (campos.id_categoria) {
      const cat = categorias.value.find(c => c.id === campos.id_categoria)
      if (cat) ticket.value.categoria = cat.nombre
    }
    Object.assign(ticket.value, campos)

    Object.assign(original, form)
  } catch {
    errorGuardar.value = 'No se pudieron guardar los cambios.'
    Object.assign(form, original)
  } finally {
    guardando.value = false
    cerrar()
  }
}

const cerrar = () => router.push({ name: 'tickets' })

// ── Opciones y helpers ────────────────────────────────────────────────────

const ESTADO_OPTIONS = [
  { value: 'abierto',     label: 'Abierto',    color: { bg: '#0d6efd', text: '#fff' } },
  { value: 'en_progreso', label: 'En progreso', color: { bg: '#ffc107', text: '#212529' } },
  { value: 'resuelto',    label: 'Resuelto',    color: { bg: '#198754', text: '#fff' } },
  { value: 'cerrado',     label: 'Cerrado',     color: { bg: '#6c757d', text: '#fff' } },
]
const PRIOR_OPTIONS = [
  { value: 'bajo',    label: 'Bajo',    color: { bg: '#6c757d', text: '#fff' } },
  { value: 'medio',   label: 'Medio',   color: { bg: '#0dcaf0', text: '#212529' } },
  { value: 'alto',    label: 'Alto',    color: { bg: '#ffc107', text: '#212529' } },
  { value: 'critico', label: 'Crítico', color: { bg: '#dc3545', text: '#fff' } },
]

const ESTADO_BADGE = { abierto: 'bg-primary', en_progreso: 'bg-warning text-dark', resuelto: 'bg-success', cerrado: 'bg-secondary' }
const PRIOR_BADGE  = { bajo: 'bg-secondary', medio: 'bg-info text-dark', alto: 'bg-warning text-dark', critico: 'bg-danger' }
const CANAL_LABEL  = { web: 'Web', chat: 'Chat', telefono: 'Teléfono', presencial: 'Presencial', email: 'Email', forms: 'Formulario' }

const badgeEstado    = e => ESTADO_BADGE[e] ?? 'bg-secondary'
const labelEstado    = e => ESTADO_OPTIONS.find(o => o.value === e)?.label ?? e
const badgePrioridad = p => PRIOR_BADGE[p]  ?? 'bg-secondary'
const labelPrioridad = p => PRIOR_OPTIONS.find(o => o.value === p)?.label ?? p
const labelCanal     = c => CANAL_LABEL[c]  ?? c

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
