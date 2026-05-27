<template>
  <AppModal
    :titulo="modoCrear ? 'Nuevo ticket' : (ticket?.numero_legible ?? '...')"
    cancel-label="Cerrar"
    size="lg"
    scrollable
    :body-class="modoCrear ? '' : 'overflow-hidden d-flex flex-column'"
    @close="cerrar"
  >

    <!-- ══════════════════════════════════════
    <!-- ══════════════════════════════════════
         MODO CREACIÓN
    ══════════════════════════════════════ -->
    <template v-if="modoCrear">
      <div class="row g-0 mb-2 flex-shrink-0">

        <!-- Columna izquierda: título, descripción, canal -->
        <div class="col-12 col-lg-8 pe-lg-4">

          <div class="mb-3">
            <input
              v-model="formCrear.titulo"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': erroresCrear.titulo }"
              placeholder="Título del ticket"
              maxlength="200"
              autofocus
            />
            <div class="invalid-feedback">{{ erroresCrear.titulo }}</div>
          </div>

          <div class="mb-4">
            <textarea
              v-model="formCrear.descripcion"
              class="form-control"
              :class="{ 'is-invalid': erroresCrear.descripcion }"
              placeholder="Descripción"
              rows="5"
              maxlength="2000"
            ></textarea>
            <div class="invalid-feedback">{{ erroresCrear.descripcion }}</div>
          </div>

          <div class="d-flex align-items-center gap-2" style="font-size: 0.82rem; color: #6c757d;">
            <i class="bi bi-broadcast"></i>
            <span>Canal</span>
            <select v-model="formCrear.canal" class="form-select form-select-sm w-auto">
              <option value="web">Web</option>
              <option value="telefono">Teléfono</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>

        </div>

        <!-- Columna derecha: sidebar -->
        <div class="col-12 col-lg-4 border-start ps-lg-4 mt-4 mt-lg-0">

          <div class="mb-3">
            <div class="sidebar-label">Prioridad</div>
            <ColorBadgeSelect v-model="formCrear.prioridad" :options="PRIOR_OPTIONS" />
          </div>

          <div class="mb-3">
            <div class="sidebar-label">Categoría <span class="text-danger">*</span></div>
            <select
              v-model="formCrear.id_categoria"
              class="form-select form-select-sm"
              :class="{ 'is-invalid': erroresCrear.id_categoria }"
            >
              <option value="" disabled>Seleccionar...</option>
              <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
            </select>
            <div class="invalid-feedback">{{ erroresCrear.id_categoria }}</div>
          </div>

          <hr class="my-3">

          <div class="mb-3">
            <div class="sidebar-label">Agente</div>
            <SearchableSelect
              v-model="formCrear.id_agente"
              :options="agenteOptions"
              placeholder="Auto-asignar por menor carga"
              add-label="Auto-asignar por menor carga"
              add-action="reset"
            />
          </div>

          <div>
            <div class="sidebar-label">Cliente <span class="text-danger">*</span></div>
            <SearchableSelect
              v-model="formCrear.id_cliente"
              :options="clienteOptions"
              placeholder="Seleccione o busque un cliente..."
              add-label="Agregar nuevo cliente"
              :invalid="!!erroresCrear.id_cliente"
              @agregar="mostrarCrearCliente = true"
            />
            <div v-if="erroresCrear.id_cliente" class="text-danger mt-1" style="font-size: 0.875em;">
              {{ erroresCrear.id_cliente }}
            </div>
          </div>

        </div>
      </div>

      <!-- Modal: crear cliente rápido -->
      <CrearUsuarioModal
        v-if="mostrarCrearCliente"
        rol-fijo="cliente"
        @close="mostrarCrearCliente = false"
        @creado="onClienteCreado"
      />

      <div v-if="errorCrear" class="alert alert-danger py-2 mb-0 mt-3" style="font-size: 0.875rem;">
        <i class="bi bi-exclamation-circle me-1"></i>{{ errorCrear }}
      </div>
    </template>

    <!-- ══════════════════════════════════════
         MODO EDICIÓN (sin cambios)
    ══════════════════════════════════════ -->
    <template v-else>

      <!-- Cargando -->
      <div v-if="cargando" class="text-center py-5 text-muted">
        <span class="spinner-border spinner-border-sm me-2"></span>Cargando...
      </div>

      <!-- Error -->
      <div v-else-if="error" class="alert alert-danger py-2 mb-0">
        <i class="bi bi-exclamation-circle me-1"></i>{{ error }}
      </div>

      <!-- Contenido -->
      <template v-else-if="ticket">

        <!-- ── Sección fija: descripción + sidebar ── -->
        <div class="row g-0 mb-4 flex-shrink-0">

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

          <div class="col-12 col-lg-4 border-start ps-lg-4 mt-4 mt-lg-0">

            <div class="mb-3">
              <div class="sidebar-label">Estado</div>
              <ColorBadgeSelect v-if="!esCliente" v-model="form.estado" :options="ESTADO_OPTIONS" />
              <span v-else :class="['badge', badgeEstado(ticket.estado)]">{{ labelEstado(ticket.estado) }}</span>
            </div>

            <div class="mb-3">
              <div class="sidebar-label">Prioridad</div>
              <ColorBadgeSelect v-if="!esCliente" v-model="form.prioridad" :options="PRIOR_OPTIONS" />
              <span v-else :class="['badge', badgePrioridad(ticket.prioridad)]">{{ labelPrioridad(ticket.prioridad) }}</span>
            </div>

            <div class="mb-3">
              <div class="sidebar-label">Categoría</div>
              <select v-if="!esCliente" class="form-select form-select-sm" v-model="form.id_categoria">
                <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
              </select>
              <span v-else class="fw-medium" style="font-size: 0.9rem;">{{ ticket.categoria }}</span>
            </div>

            <hr class="my-3">

            <div class="mb-3">
              <div class="sidebar-label">Agente</div>
              <select v-if="!esCliente" class="form-select form-select-sm" v-model="form.id_agente">
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

        <!-- ── Tabs + contenido scrollable ── -->
        <div class="tabs-section">
          <ul class="nav nav-tabs flex-shrink-0" style="font-size: 0.875rem;">
            <li class="nav-item">
              <button class="nav-link" :class="{ active: tab === 'notas' }" @click="tab = 'notas'">
                <i class="bi bi-chat-left-text me-1"></i>Conversación
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" :class="{ active: tab === 'historial' }" @click="tab = 'historial'">
                <i class="bi bi-clock-history me-1"></i>Historial
              </button>
            </li>
          </ul>

          <div class="tab-content-area">
            <TicketNotasTab
              v-show="tab === 'notas'"
              ref="notasRef"
              :ticket-id="route.params.id"
              :es-cliente="esCliente"
            />
            <TicketHistorialTab
              v-show="tab === 'historial'"
              ref="historialRef"
              :ticket-id="route.params.id"
            />
          </div>
        </div>

      </template>
    </template>

    <!-- ── Footer ── -->
    <template #footer>

      <!-- Footer modo creación -->
      <template v-if="modoCrear">
        <div v-if="errorCrear" class="text-danger me-auto" style="font-size: 0.85rem;">
          <i class="bi bi-exclamation-circle me-1"></i>{{ errorCrear }}
        </div>
        <button type="button" class="btn btn-outline-secondary" @click="cerrar">Cerrar</button>
        <button type="button" class="btn btn-primary" :disabled="cargandoCrear" @click="crear">
          <span v-if="cargandoCrear" class="spinner-border spinner-border-sm me-2"></span>
          {{ cargandoCrear ? 'Creando...' : 'Crear ticket' }}
        </button>
      </template>

      <!-- Footer modo edición (sin cambios) -->
      <template v-else>
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

    </template>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import api from '@/api/axios'
import AppModal          from '@/components/ui/AppModal.vue'
import ColorBadgeSelect  from '@/components/ui/ColorBadgeSelect.vue'
import SearchableSelect  from '@/components/ui/SearchableSelect.vue'
import CrearUsuarioModal from '@/components/usuarios/CrearUsuarioModal.vue'
import TicketNotasTab    from '@/components/tickets/TicketNotasTab.vue'
import TicketHistorialTab from '@/components/tickets/TicketHistorialTab.vue'

const props = defineProps({
  modoCrear: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'creado'])

const route  = useRoute()
const router = useRouter()
const store  = useStore()

const esCliente = computed(() => store.getters['auth/rol'] === 'cliente')
const esAgente  = computed(() => store.getters['auth/rol'] === 'agente')
const usuario   = computed(() => store.getters['auth/usuario'])

// ── Estado compartido ──────────────────────────────────────────────────────

const agentes    = ref([])
const categorias = ref([])

// ── Estado modo edición ───────────────────────────────────────────────────

const ticket       = ref(null)
const cargando     = ref(false)
const guardando    = ref(false)
const error        = ref(null)
const errorGuardar = ref(null)

const tab          = ref('notas')
const notasRef     = ref(null)
const historialRef = ref(null)

const form     = reactive({ estado: '', prioridad: '', id_categoria: '', id_agente: '' })
const original = reactive({ estado: '', prioridad: '', id_categoria: '', id_agente: '' })

const hayCambios = computed(() =>
  form.estado       !== original.estado       ||
  form.prioridad    !== original.prioridad    ||
  form.id_categoria !== original.id_categoria ||
  form.id_agente    !== original.id_agente
)

// ── Estado modo creación ──────────────────────────────────────────────────

const clientes            = ref([])
const mostrarCrearCliente = ref(false)
const cargandoCrear       = ref(false)
const errorCrear          = ref(null)
const erroresCrear        = ref({})

const formCrear = reactive({
  titulo:       '',
  descripcion:  '',
  canal:        'web',
  prioridad:    'medio',
  id_categoria: '',
  id_agente:    '',
  id_cliente:   '',
})

const agenteOptions = computed(() =>
  agentes.value.map(a => ({
    value:    a.id,
    label:    `${a.nombre} ${a.apellido}`,
    sublabel: a.email,
  }))
)

const clienteOptions = computed(() =>
  clientes.value.map(c => ({
    value:    c.id,
    label:    `${c.nombre} ${c.apellido}`,
    sublabel: c.email,
  }))
)

const onClienteCreado = (u) => {
  clientes.value.push(u)
  formCrear.id_cliente      = u.id
  mostrarCrearCliente.value = false
}

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

const cargarMaestrosCrear = async () => {
  const [resAg, resCat, resCli] = await Promise.allSettled([
    api.get('/api/usuarios/agentes'),
    api.get('/api/categorias', { params: { limit: 100, activo: true } }),
    api.get('/api/usuarios/clientes'),
  ])
  if (resAg.status  === 'fulfilled') agentes.value    = resAg.value.data        ?? []
  if (resCat.status === 'fulfilled') categorias.value = resCat.value.data.datos ?? []
  if (resCli.status === 'fulfilled') clientes.value   = resCli.value.data       ?? []
}

onMounted(async () => {
  if (props.modoCrear) {
    await cargarMaestrosCrear()
    if (esAgente.value) formCrear.id_agente = usuario.value?.id ?? ''
  } else {
    cargarTicket()
    if (!esCliente.value) cargarMaestros()
  }
})

// ── Guardar (modo edición) ─────────────────────────────────────────────────

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
    historialRef.value?.cargar()
  } catch {
    errorGuardar.value = 'No se pudieron guardar los cambios.'
    Object.assign(form, original)
  } finally {
    guardando.value = false
    cerrar()
  }
}

// ── Crear (modo creación) ──────────────────────────────────────────────────

const validarCrear = () => {
  const e = {}
  if (!formCrear.titulo.trim())      e.titulo       = 'El título es requerido.'
  if (!formCrear.descripcion.trim()) e.descripcion  = 'La descripción es requerida.'
  if (!formCrear.id_categoria)       e.id_categoria = 'Selecciona una categoría.'
  if (!formCrear.id_cliente)         e.id_cliente   = 'Selecciona un cliente.'
  erroresCrear.value = e
  return Object.keys(e).length === 0
}

const crear = async () => {
  errorCrear.value = null
  if (!validarCrear()) return
  cargandoCrear.value = true
  try {
    const payload = {
      titulo:       formCrear.titulo.trim(),
      descripcion:  formCrear.descripcion.trim(),
      canal:        formCrear.canal,
      prioridad:    formCrear.prioridad,
      id_categoria: formCrear.id_categoria,
      id_cliente:   formCrear.id_cliente,
    }
    if (formCrear.id_agente) payload.id_agente = formCrear.id_agente
    await api.post('/api/tickets', payload)
    emit('creado')
  } catch (err) {
    errorCrear.value = err.response?.data?.mensaje || 'Error al crear el ticket.'
  } finally {
    cargandoCrear.value = false
  }
}

// ── Cerrar ────────────────────────────────────────────────────────────────

const cerrar = () => {
  if (props.modoCrear) emit('close')
  else router.push({ name: 'tickets' })
}

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

.tabs-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.tab-content-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-top: 0.75rem;
}
</style>
